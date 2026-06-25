use sqlx::{FromRow, SqliteConnection};
use uuid::Uuid;

use crate::app::KazmasResult;

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

const SELECT_METADATA: &str = "
SELECT node_id, json(data) AS data
FROM node_metadata
WHERE node_id = ?
";

const INSERT_METADATA: &str = "
INSERT INTO node_metadata (node_id, data)
VALUES (?, jsonb(?))
";

const UPDATE_METADATA: &str = "
UPDATE node_metadata
SET data = jsonb(?)
WHERE node_id = ?
";

pub(crate) async fn get_metadata(
    conn: &mut SqliteConnection,
    node_id: &Uuid,
) -> KazmasResult<NodeMetadata> {
    let result = sqlx::query_as::<_, NodeMetadata>(SELECT_METADATA)
        .bind(node_id)
        .fetch_one(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn create_metadata(
    conn: &mut SqliteConnection,
    metadata: &NodeMetadata,
) -> KazmasResult<bool> {
    let result = sqlx::query(INSERT_METADATA)
        .bind(&metadata.node_id)
        .bind(&metadata.data)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_metadata(
    conn: &mut SqliteConnection,
    metadata: &NodeMetadata,
) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_METADATA)
        .bind(&metadata.data)
        .bind(&metadata.node_id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}
