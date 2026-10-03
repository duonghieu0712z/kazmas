use std::io::Write;

use zip::{ZipWriter, write::SimpleFileOptions};

use super::{WorldManifest, read_manifest};
use crate::test_support::{TestResult, temp_dir};

#[test]
fn rejects_manifest_paths_outside_the_workspace() -> TestResult {
    let dir = temp_dir()?;
    for (index, path) in [
        "../outside.db",
        "/outside.db",
        "C:\\outside.db",
        "..\\outside.db",
        "",
    ]
    .iter()
    .enumerate()
    {
        let package = dir.path().join(format!("manifest-{index}.kazmas"));
        let mut manifest = WorldManifest::new("Unsafe");
        manifest.paths.world = (*path).to_owned();
        let mut writer = ZipWriter::new(std::fs::File::create(&package)?);
        writer.start_file("manifest.json", SimpleFileOptions::default())?;
        writer.write_all(serde_json::to_string(&manifest)?.as_bytes())?;
        writer.finish()?;
        assert!(read_manifest(package).is_err());
    }
    Ok(())
}

#[test]
fn rejects_missing_and_malformed_manifests() -> TestResult {
    let dir = temp_dir()?;
    for (index, entry) in ["other.json", "manifest.json"].iter().enumerate() {
        let package = dir.path().join(format!("invalid-{index}.kazmas"));
        let mut writer = ZipWriter::new(std::fs::File::create(&package)?);
        writer.start_file(*entry, SimpleFileOptions::default())?;
        writer.write_all(b"{broken")?;
        writer.finish()?;
        assert!(read_manifest(package).is_err());
    }
    Ok(())
}
