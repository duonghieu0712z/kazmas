use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

const WORLD_DB: &str = "data/world.db";
const ASSETS: &str = "assets";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorldManifest {
    #[serde(serialize_with = "uuid::serde::simple::serialize")]
    pub(crate) id: Uuid,
    pub(crate) name: String,
    pub(crate) paths: WorldPaths,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub(crate) created_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub(crate) updated_at: DateTime<Utc>,
}

impl WorldManifest {
    pub(crate) fn new(name: &str) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::now_v7(),
            name: name.into(),
            paths: Default::default(),
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldPaths {
    pub(crate) world: String,
    pub(crate) assets: String,
}

impl Default for WorldPaths {
    fn default() -> Self {
        Self {
            world: WORLD_DB.into(),
            assets: ASSETS.into(),
        }
    }
}
