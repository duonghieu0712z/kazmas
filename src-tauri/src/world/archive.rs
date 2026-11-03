use std::{
    fs::{self, File, Metadata},
    io::{self, Read},
    path::Path,
};

#[cfg(test)]
#[path = "archive_tests.rs"]
mod tests;

use tempfile::NamedTempFile;
use walkdir::{DirEntry, WalkDir};
use zip::{
    CompressionMethod, ZipArchive, ZipWriter,
    read::{ExtractOptions, SymlinkExtractAction},
    write::SimpleFileOptions,
};

use super::manifest::{MANIFEST_ENTRY, MAX_MANIFEST_SIZE, validate_manifest_size};
use crate::app::{KazmasError, KazmasResult};

const COMPRESSION_LEVEL: i64 = 3;
const MAX_WORLD_SIZE: u64 = 1024 * 1024 * 1024;

const MACOSX_DIR: &str = "__MACOSX";
const DS_STORE: &str = ".DS_Store";
const APPLE_DOUBLE_PREFIX: &str = "._";

const WAL_SUFFIX: &str = "-wal";
const SHM_SUFFIX: &str = "-shm";

pub(super) fn open_world_archive(package: impl AsRef<Path>) -> KazmasResult<ZipArchive<File>> {
    let zip_file = File::open(package)?;
    let mut archive = ZipArchive::new(zip_file)?;

    archive.validate_header_consistency()?;

    match archive.decompressed_size() {
        Some(size) if size > u128::from(MAX_WORLD_SIZE) => {
            return Err(KazmasError::Invalid(
                "world exceeds the 1 GiB uncompressed size limit".into(),
            ));
        },
        None => {
            return Err(KazmasError::Invalid(
                "world package has an unknown uncompressed size".into(),
            ));
        },
        Some(_) => {},
    }

    for index in 0..archive.len() {
        let entry = archive.by_index(index)?;
        let name = entry.name()?;
        let normalized = name.replace('\\', "/");
        if normalized.starts_with('/')
            || normalized.contains(':')
            || normalized.split('/').any(|part| part == "..")
        {
            return Err(KazmasError::Invalid(format!("unsafe archive entry {name}")));
        }

        if entry.enclosed_name().is_none() {
            return Err(KazmasError::Invalid(format!("unsafe archive entry {name}")));
        }

        if entry.is_symlink() {
            return Err(KazmasError::Invalid(format!(
                "symbolic links are not supported in world packages: {name}"
            )));
        }
    }

    Ok(archive)
}

pub(super) fn unpack_world_archive(
    mut archive: ZipArchive<File>,
    workspace: impl AsRef<Path>,
) -> KazmasResult<()> {
    let options = ExtractOptions::default()
        .symlink_action(SymlinkExtractAction::NoExtract)
        .with_size_limit(MAX_WORLD_SIZE);
    archive.extract_with_options(workspace, options)?;
    Ok(())
}

pub(super) fn pack_world_archive(
    workspace: impl AsRef<Path>,
    package: impl AsRef<Path>,
) -> KazmasResult<()> {
    let manifest_path = workspace.as_ref().join(MANIFEST_ENTRY);
    let mut remaining_size = MAX_WORLD_SIZE;
    for entry in walk_world_entries(&workspace) {
        let entry = entry?;
        let metadata = read_world_entry_metadata(entry.path())?;
        if metadata.is_file() {
            if entry.path() == manifest_path {
                validate_manifest_size(metadata.len())?;
            }

            remaining_size = consume_world_size_budget(remaining_size, metadata.len())?;
        }
    }

    let package = package.as_ref();
    let mut writer = ZipWriter::new(create_temp_package(package)?);

    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Zstd)
        .compression_level(Some(COMPRESSION_LEVEL));

    let mut remaining_size = MAX_WORLD_SIZE;
    for entry in walk_world_entries(&workspace) {
        let entry = entry?;
        let path = entry.path();
        let metadata = read_world_entry_metadata(path)?;
        let name = path
            .strip_prefix(&workspace)?
            .to_string_lossy()
            .replace('\\', "/");

        if name.is_empty() {
            continue;
        }

        if metadata.is_dir() {
            writer.add_directory(format!("{name}/"), options)?;
            continue;
        }

        if !metadata.is_file() {
            continue;
        }

        writer.start_file(name, options)?;
        let file = File::open(path)?;
        let is_manifest = path == manifest_path;
        let size_limit = if is_manifest {
            remaining_size.min(MAX_MANIFEST_SIZE)
        } else {
            remaining_size
        };
        let copied = io::copy(&mut file.take(size_limit + 1), &mut writer)?;
        if is_manifest {
            validate_manifest_size(copied)?;
        }

        remaining_size = consume_world_size_budget(remaining_size, copied)?;
    }

    let temp = writer.finish()?;
    temp.as_file().sync_all()?;

    let temp_package = temp.into_temp_path();
    fs::rename(&temp_package, package)?;

    Ok(())
}

fn walk_world_entries(
    workspace: impl AsRef<Path>,
) -> impl Iterator<Item = walkdir::Result<DirEntry>> {
    WalkDir::new(workspace)
        .follow_root_links(false)
        .into_iter()
        .filter_entry(|entry| !should_skip_entry(entry.path()))
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

fn consume_world_size_budget(remaining_size: u64, size: u64) -> KazmasResult<u64> {
    remaining_size.checked_sub(size).ok_or_else(|| {
        KazmasError::Invalid("world exceeds the 1 GiB uncompressed size limit".into())
    })
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

fn read_world_entry_metadata(path: &Path) -> KazmasResult<Metadata> {
    let metadata = fs::symlink_metadata(path)?;
    if metadata.file_type().is_symlink() {
        return Err(KazmasError::Invalid(format!(
            "symbolic links are not supported in world workspaces: {}",
            path.display()
        )));
    }

    Ok(metadata)
}
