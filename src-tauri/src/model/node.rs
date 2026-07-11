use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::{FromRow, Type as SqlxType};
use uuid::Uuid;

const DEFAULT_NAME: &str = "Untitled";

#[derive(Debug, Clone, Copy, Deserialize, Serialize, Type, SqlxType)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub(crate) enum NodeKind {
    World,
    Manuscript,
    Wiki,
    Folder,
    ManuscriptEntry,
    WikiEntry,
}

#[derive(Debug, Clone, FromRow)]
pub(crate) struct Node {
    pub(crate) id: Uuid,
    pub(crate) parent_id: Option<Uuid>,
    pub(crate) kind: NodeKind,
    pub(crate) name: String,
    pub(crate) created_at: DateTime<Utc>,
    pub(crate) modified_at: DateTime<Utc>,
    pub(crate) deleted_at: Option<DateTime<Utc>>,
}

impl Node {
    pub(crate) fn new(kind: NodeKind, name: Option<&str>, parent_id: Option<Uuid>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::now_v7(),
            parent_id,
            kind,
            name: name.unwrap_or(DEFAULT_NAME).into(),
            created_at: now,
            modified_at: now,
            deleted_at: None,
        }
    }
}
