use std::io::Write;

use zip::{ZipWriter, write::SimpleFileOptions};

use super::{MANIFEST_ENTRY, MAX_MANIFEST_SIZE, WorldManifest, read_manifest, write_manifest};
use crate::{
    app::KazmasError,
    test_support::{TestResult, temp_dir},
};

#[test]
fn enforces_manifest_read_size_limit() -> TestResult {
    let dir = temp_dir()?;
    for extra in [0, 1] {
        let manifest = manifest_with_json_size(MAX_MANIFEST_SIZE + extra)?;
        let package = dir.path().join(format!("manifest-{extra}.kazmas"));
        let mut writer = ZipWriter::new(std::fs::File::create(&package)?);
        writer.start_file(MANIFEST_ENTRY, SimpleFileOptions::default())?;
        writer.write_all(&serde_json::to_vec(&manifest)?)?;
        writer.finish()?;

        let result = read_manifest(&package);
        if extra == 0 {
            assert_eq!(result?.name, manifest.name);
        } else {
            assert!(matches!(result, Err(KazmasError::Invalid(_))));
        }
    }

    Ok(())
}

#[tokio::test]
async fn oversized_manifest_write_preserves_existing_manifest() -> TestResult {
    let dir = temp_dir()?;
    let path = dir.path().join(MANIFEST_ENTRY);
    let manifest = manifest_with_json_size(MAX_MANIFEST_SIZE)?;
    write_manifest(&manifest, dir.path()).await?;
    let previous = std::fs::read(&path)?;
    assert_eq!(previous.len() as u64, MAX_MANIFEST_SIZE);

    let oversized = manifest_with_json_size(MAX_MANIFEST_SIZE + 1)?;
    assert!(matches!(
        write_manifest(&oversized, dir.path()).await,
        Err(KazmasError::Invalid(_))
    ));
    assert_eq!(std::fs::read(&path)?, previous);

    Ok(())
}

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

fn manifest_with_json_size(size: u64) -> Result<WorldManifest, Box<dyn std::error::Error>> {
    let mut manifest = WorldManifest::new("\u{65e5}");
    let padding = usize::try_from(size)? - serde_json::to_vec(&manifest)?.len();
    manifest.name.push_str(&"a".repeat(padding));
    assert_eq!(serde_json::to_vec(&manifest)?.len() as u64, size);
    Ok(manifest)
}
