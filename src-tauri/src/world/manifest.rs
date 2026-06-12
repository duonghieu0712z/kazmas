use std::{fs::File, io::Read, path::Path};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::fs;
use uuid::Uuid;
use zip::ZipArchive;

use crate::app::KazmasResult;

const MANIFEST_ENTRY: &str = "manifest.json";
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
    pub(crate) updated_at: DateTime<Utc>,
}

impl WorldManifest {
    pub(super) fn new(name: &str) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::now_v7(),
            name: name.into(),
            paths: Default::default(),
            created_at: now,
            updated_at: now,
        }
    }

    pub(super) fn world_path(&self) -> String {
        self.paths.world.clone()
    }

    pub(super) fn assets_path(&self) -> String {
        self.paths.assets.clone()
    }

    pub(super) fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

pub(crate) fn read_manifest(package: impl AsRef<Path>) -> KazmasResult<WorldManifest> {
    let zip_file = File::open(package)?;
    let mut archive = ZipArchive::new(zip_file)?;
    let mut manifest_file = archive.by_name(MANIFEST_ENTRY)?;

    let mut manifest_json = String::new();
    manifest_file.read_to_string(&mut manifest_json)?;

    let manifest = serde_json::from_str(&manifest_json)?;
    Ok(manifest)
}

pub(super) async fn write_manifest(
    manifest: &WorldManifest,
    workspace: impl AsRef<Path>,
) -> KazmasResult<()> {
    let file = workspace.as_ref().join(MANIFEST_ENTRY);
    let data = serde_json::to_string(manifest)?;
    fs::write(file, data).await?;
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
