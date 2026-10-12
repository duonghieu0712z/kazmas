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
    pack_world(&workspace, &package)?;
    let output = dir.path().join("output");
    unpack_world(&package, &output)?;
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
fn rejects_archive_entries_that_escape_the_workspace() -> TestResult {
    let dir = temp_dir()?;
    for (index, name) in ["../escaped.txt", "/absolute.txt"].iter().enumerate() {
        let package = dir.path().join(format!("unsafe-{index}.kazmas"));
        let mut writer = ZipWriter::new(File::create(&package)?);
        writer.start_file(*name, SimpleFileOptions::default())?;
        writer.write_all(b"unsafe")?;
        writer.finish()?;
        assert!(unpack_world(&package, dir.path().join(format!("output-{index}"))).is_err());
        assert!(!dir.path().join("escaped.txt").exists());
    }
    Ok(())
}

#[test]
fn packing_failure_preserves_existing_package() -> TestResult {
    let dir = temp_dir()?;
    let package = dir.path().join("saved.kazmas");
    fs::write(&package, b"previous package")?;
    assert!(pack_world(dir.path().join("missing"), &package).is_err());
    assert_eq!(fs::read(package)?, b"previous package");
    Ok(())
}
