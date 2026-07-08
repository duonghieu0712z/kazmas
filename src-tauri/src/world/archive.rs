use std::{
    fs::{self, File},
    io,
    path::Path,
};

use tempfile::NamedTempFile;
use walkdir::WalkDir;
use zip::{CompressionMethod, ZipArchive, ZipWriter, write::SimpleFileOptions};

use crate::app::{KazmasError, KazmasResult};

const COMPRESSION_LEVEL: i64 = 3;

const MACOSX_DIR: &str = "__MACOSX";
const DS_STORE: &str = ".DS_Store";
const APPLE_DOUBLE_PREFIX: &str = "._";

const WAL_SUFFIX: &str = "-wal";
const SHM_SUFFIX: &str = "-shm";

pub(super) fn pack_world(
    workspace: impl AsRef<Path>,
    package: impl AsRef<Path>,
) -> KazmasResult<()> {
    let package = package.as_ref();
    let mut writer = ZipWriter::new(create_temp_package(package)?);

    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Zstd)
        .compression_level(Some(COMPRESSION_LEVEL));

    for entry in WalkDir::new(&workspace)
        .into_iter()
        .filter_entry(|entry| !should_skip_entry(entry.path()))
    {
        let entry = entry?;
        let path = entry.path();
        let name = path
            .strip_prefix(&workspace)?
            .to_string_lossy()
            .replace(r"\", "/");

        if name.is_empty() {
            continue;
        }

        if path.is_dir() {
            writer.add_directory(format!("{name}/"), options)?;
            continue;
        }

        if !path.is_file() {
            continue;
        }

        writer.start_file(name, options)?;
        let mut file = File::open(path)?;
        io::copy(&mut file, &mut writer)?;
    }

    let temp = writer.finish()?;
    temp.as_file().sync_all()?;

    let temp_package = temp.into_temp_path();
    fs::rename(&temp_package, package)?;

    Ok(())
}

pub(super) fn unpack_world(
    package: impl AsRef<Path>,
    workspace: impl AsRef<Path>,
) -> KazmasResult<()> {
    let zip_file = File::open(package)?;
    let mut archive = ZipArchive::new(zip_file)?;

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index)?;
        let Some(enclosed_name) = entry.enclosed_name() else {
            return Err(KazmasError::Invalid(format!(
                "unsafe archive entry {}",
                entry.name()
            )));
        };

        let output_path = workspace.as_ref().join(enclosed_name);

        if entry.is_dir() {
            fs::create_dir_all(output_path)?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut output = File::create(output_path)?;
        io::copy(&mut entry, &mut output)?;
    }

    Ok(())
}

fn should_skip_entry(path: impl AsRef<Path>) -> bool {
    let path = path.as_ref();

    if path
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| {
            name == MACOSX_DIR || name == DS_STORE || name.starts_with(APPLE_DOUBLE_PREFIX)
        })
    {
        return true;
    }

    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.ends_with(WAL_SUFFIX) || ext.ends_with(SHM_SUFFIX))
}

fn create_temp_package(package: impl AsRef<Path>) -> KazmasResult<NamedTempFile> {
    let parent = package
        .as_ref()
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));

    fs::create_dir_all(parent)?;

    let temp_package = tempfile::Builder::new()
        .prefix(".")
        .suffix(".tmp")
        .tempfile_in(parent)?;

    Ok(temp_package)
}
