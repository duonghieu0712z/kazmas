use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub(crate) struct NodeMetadata {
    pub(crate) node_id: Uuid,
    pub(crate) data: serde_json::Value,
}

impl NodeMetadata {
    pub(crate) fn new(node_id: Uuid, data: serde_json::Value) -> Self {
        Self { node_id, data }
    }
}
