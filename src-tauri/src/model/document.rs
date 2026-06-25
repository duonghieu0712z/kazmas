use sqlx::{FromRow, SqliteConnection};
use uuid::Uuid;

use crate::app::KazmasResult;

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

const SELECT_DOCUMENT: &str = "
SELECT node_id, json(content) AS content
FROM documents
WHERE node_id = ?
";

const INSERT_DOCUMENT: &str = "
INSERT INTO documents (node_id, content)
VALUES (?, jsonb(?))
";

const UPDATE_DOCUMENT: &str = "
UPDATE documents
SET content = jsonb(?)
WHERE node_id = ?
";

pub(crate) async fn get_document(
    conn: &mut SqliteConnection,
    node_id: &Uuid,
) -> KazmasResult<Document> {
    let result = sqlx::query_as::<_, Document>(SELECT_DOCUMENT)
        .bind(node_id)
        .fetch_one(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn create_document(
    conn: &mut SqliteConnection,
    document: &Document,
) -> KazmasResult<bool> {
    let result = sqlx::query(INSERT_DOCUMENT)
        .bind(&document.node_id)
        .bind(&document.content)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_document(
    conn: &mut SqliteConnection,
    document: &Document,
) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_DOCUMENT)
        .bind(&document.content)
        .bind(&document.node_id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}
