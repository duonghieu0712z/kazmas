use std::{fs::File, io::Read, path::Path};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::fs;
use uuid::Uuid;
use zip::ZipArchive;

use super::archive::open_world_archive;
use crate::app::{KazmasError, KazmasResult};

#[cfg(test)]
#[path = "manifest_tests.rs"]
mod tests;

pub(super) const MAX_MANIFEST_SIZE: u64 = 1024 * 1024;

pub(super) const MANIFEST_ENTRY: &str = "manifest.json";
const WORLD_DB: &str = "data/world.db";
const ASSETS: &str = "assets";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorldManifest {
    #[serde(serialize_with = "uuid::serde::simple::serialize")]
    pub(crate) id: Uuid,
    pub(crate) name: String,
    paths: WorldPaths,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub(crate) created_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub(crate) modified_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub(crate) opened_at: DateTime<Utc>,
}

impl WorldManifest {
    pub(super) fn new(name: &str) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::now_v7(),
            name: name.into(),
            paths: WorldPaths::default(),
            created_at: now,
            modified_at: now,
            opened_at: now,
        }
    }

    pub(super) fn world_path(&self) -> String {
        self.paths.world.clone()
    }

    pub(super) fn assets_path(&self) -> String {
        self.paths.assets.clone()
    }

    pub(super) fn modify(&mut self) {
        self.modified_at = Utc::now();
    }

    pub(super) fn open(&mut self) {
        self.opened_at = Utc::now();
    }
}

pub(crate) fn read_manifest(package: impl AsRef<Path>) -> KazmasResult<WorldManifest> {
    let mut archive = open_world_archive(package)?;
    read_manifest_from_archive(&mut archive)
}

pub(super) fn read_manifest_from_archive(
    archive: &mut ZipArchive<File>,
) -> KazmasResult<WorldManifest> {
    let manifest_file = archive.by_name(MANIFEST_ENTRY)?;

    let mut manifest_json = Vec::new();
    manifest_file
        .take(MAX_MANIFEST_SIZE + 1)
        .read_to_end(&mut manifest_json)?;
    validate_manifest_size(manifest_json.len() as u64)?;

    let manifest: WorldManifest = serde_json::from_slice(&manifest_json)?;
    for path in [&manifest.paths.world, &manifest.paths.assets] {
        let normalized = path.replace('\\', "/");
        if normalized.is_empty()
            || normalized.starts_with('/')
            || normalized.contains(':')
            || normalized
                .split('/')
                .any(|part| part == ".." || part == ".")
        {
            return Err(KazmasError::Invalid(format!("unsafe manifest path {path}")));
        }
    }
    Ok(manifest)
}

pub(super) async fn write_manifest(
    manifest: &WorldManifest,
    workspace: impl AsRef<Path>,
) -> KazmasResult<()> {
    let file = workspace.as_ref().join(MANIFEST_ENTRY);
    let data = serde_json::to_string(manifest)?;
    validate_manifest_size(data.len() as u64)?;

    fs::write(file, data).await?;
    Ok(())
}

pub(super) fn validate_manifest_size(size: u64) -> KazmasResult<()> {
    if size > MAX_MANIFEST_SIZE {
        return Err(KazmasError::Invalid(
            "world manifest exceeds the 1 MiB size limit".into(),
        ));
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorldPaths {
    world: String,
    assets: String,
}

impl Default for WorldPaths {
    fn default() -> Self {
        Self {
            world: WORLD_DB.into(),
            assets: ASSETS.into(),
        }
    }
}
