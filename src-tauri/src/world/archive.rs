use std::{fs::File, io, path::Path};

use walkdir::WalkDir;
use zip::{CompressionMethod, ZipArchive, ZipWriter, write::SimpleFileOptions};

use crate::app::KazmasResult;

const COMPRESSION_LEVEL: i64 = 3;

const WAL_SUFFIX: &str = "-wal";
const SHM_SUFFIX: &str = "-shm";

pub(super) fn pack_world(
    workspace: impl AsRef<Path>,
    package: impl AsRef<Path>,
) -> KazmasResult<()> {
    let zip_file = File::create(package)?;
    let mut writer = ZipWriter::new(zip_file);

    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Zstd)
        .compression_level(Some(COMPRESSION_LEVEL));

    for entry in WalkDir::new(&workspace) {
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

        if !path.is_file() || should_skip_file(path) {
            continue;
        }

        writer.start_file(name, options)?;
        let mut file = File::open(path)?;
        io::copy(&mut file, &mut writer)?;
    }

    Ok(())
}

pub(super) fn unpack_world(
    package: impl AsRef<Path>,
    workspace: impl AsRef<Path>,
) -> KazmasResult<()> {
    let zip_file = File::open(package)?;
    let mut archive = ZipArchive::new(zip_file)?;
    archive.extract(workspace)?;
    Ok(())
}

fn should_skip_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.ends_with(WAL_SUFFIX) || ext.ends_with(SHM_SUFFIX))
}
