use chrono::{DateTime, Utc};
use serde::Serialize;
use specta::Type;
use uuid::Uuid;

use crate::world::WorldManifest;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorldDto {
    #[specta(type = String)]
    pub(crate) id: Uuid,
    pub(crate) name: String,
    #[specta(type = String)]
    pub(crate) created_at: DateTime<Utc>,
    #[specta(type = String)]
    pub(crate) updated_at: DateTime<Utc>,
}

impl From<WorldManifest> for WorldDto {
    fn from(manifest: WorldManifest) -> Self {
        Self {
            id: manifest.id,
            name: manifest.name,
            created_at: manifest.created_at,
            updated_at: manifest.updated_at,
        }
    }
}
