use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub(crate) struct Document {
    pub(crate) node_id: Uuid,
    pub(crate) content: serde_json::Value,
}

impl Document {
    pub(crate) fn new(node_id: Uuid, content: serde_json::Value) -> Self {
        Self { node_id, content }
    }
}
