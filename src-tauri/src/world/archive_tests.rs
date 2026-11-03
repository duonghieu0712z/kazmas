use std::io::Write;

use super::*;
use crate::test_support::{TestResult, temp_dir};

#[test]
fn round_trip_preserves_nested_unicode_files_and_skips_transient_entries() -> TestResult {
    let dir = temp_dir()?;
    let workspace = dir.path().join("source");
    fs::create_dir_all(workspace.join("data"))?;
    fs::create_dir_all(workspace.join("assets/nested"))?;
    fs::create_dir_all(workspace.join("__MACOSX"))?;
    fs::write(workspace.join("data/world.db"), "database")?;
    fs::write(
        workspace.join("assets/nested/sample.txt"),
        "Unicode \u{65e5}\u{672c}\u{8a9e}",
    )?;
    for name in [
        "data/world.db-wal",
        "data/world.db-shm",
        ".DS_Store",
        "._sample",
        "__MACOSX/resource",
    ] {
        fs::write(workspace.join(name), "skip")?;
    }
    let package = dir.path().join("world.kazmas");
    pack_world_archive(&workspace, &package)?;
    let output = dir.path().join("output");
    let archive = open_world_archive(&package)?;
    unpack_world_archive(archive, &output)?;
    assert_eq!(fs::read(output.join("data/world.db"))?, b"database");
    assert_eq!(
        fs::read_to_string(output.join("assets/nested/sample.txt"))?,
        "Unicode \u{65e5}\u{672c}\u{8a9e}"
    );
    for name in [
        "data/world.db-wal",
        "data/world.db-shm",
        ".DS_Store",
        "._sample",
        "__MACOSX",
    ] {
        assert!(!output.join(name).exists());
    }
    Ok(())
}

#[test]
fn rejects_oversized_workspace_without_creating_package() -> TestResult {
    let dir = temp_dir()?;
    let workspace = dir.path().join("source");
    fs::create_dir_all(&workspace)?;
    File::create(workspace.join("oversized.bin"))?.set_len(MAX_WORLD_SIZE + 1)?;

    let package = dir.path().join("world.kazmas");
    assert!(pack_world_archive(&workspace, &package).is_err());
    assert!(!package.exists());

    Ok(())
}

#[test]
fn oversized_workspace_manifest_preserves_existing_package() -> TestResult {
    let dir = temp_dir()?;
    let workspace = dir.path().join("source");
    fs::create_dir_all(&workspace)?;
    let manifest_path = workspace.join(MANIFEST_ENTRY);
    File::create(&manifest_path)?.set_len(MAX_MANIFEST_SIZE)?;

    let package = dir.path().join("world.kazmas");
    pack_world_archive(&workspace, &package)?;
    let mut archive = open_world_archive(&package)?;
    assert_eq!(archive.by_name(MANIFEST_ENTRY)?.size(), MAX_MANIFEST_SIZE);
    drop(archive);
    let previous = fs::read(&package)?;

    File::options()
        .write(true)
        .open(&manifest_path)?
        .set_len(MAX_MANIFEST_SIZE + 1)?;
    assert!(matches!(
        pack_world_archive(&workspace, &package),
        Err(KazmasError::Invalid(_))
    ));
    assert_eq!(fs::read(&package)?, previous);

    fs::remove_file(&package)?;
    assert!(matches!(
        pack_world_archive(&workspace, &package),
        Err(KazmasError::Invalid(_))
    ));
    assert!(!package.exists());

    Ok(())
}

#[test]
fn rejects_archive_entries_that_escape_the_workspace() -> TestResult {
    let dir = temp_dir()?;
    for (index, name) in ["../escaped.txt", "/absolute.txt"].iter().enumerate() {
        let package = dir.path().join(format!("unsafe-{index}.kazmas"));
        let mut writer = ZipWriter::new(File::create(&package)?);
        writer.start_file(*name, SimpleFileOptions::default())?;
        writer.write_all(b"unsafe")?;
        writer.finish()?;
        assert!(open_world_archive(&package).is_err());
        assert!(!dir.path().join("escaped.txt").exists());
    }
    Ok(())
}

#[test]
fn extraction_does_not_write_traversal_entries_outside_workspace() -> TestResult {
    let dir = temp_dir()?;
    let package = dir.path().join("unsafe.kazmas");
    let mut writer = ZipWriter::new(File::create(&package)?);
    writer.start_file("../escaped.txt", SimpleFileOptions::default())?;
    writer.write_all(b"unsafe")?;
    writer.finish()?;

    let workspace = dir.path().join("workspace");
    let archive = ZipArchive::new(File::open(&package)?)?;
    let _ = unpack_world_archive(archive, &workspace);

    assert!(!dir.path().join("escaped.txt").exists());

    Ok(())
}

#[test]
fn packing_failure_preserves_existing_package() -> TestResult {
    let dir = temp_dir()?;
    let package = dir.path().join("saved.kazmas");
    fs::write(&package, b"previous package")?;
    assert!(pack_world_archive(dir.path().join("missing"), &package).is_err());
    assert_eq!(fs::read(package)?, b"previous package");
    Ok(())
}
