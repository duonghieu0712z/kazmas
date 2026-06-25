use chrono::{DateTime, Utc};
use sqlx::{FromRow, SqliteConnection, Type};
use uuid::Uuid;

use crate::app::KazmasResult;

const DEFAULT_NAME: &str = "Untitled";

#[derive(Debug, Clone, Copy, Type)]
#[sqlx(rename_all = "snake_case")]
pub(crate) enum NodeKind {
    World,
    Chapter,
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
        }
    }
}

const SELECT_NODE: &str = r#"
SELECT id, parent_id, kind, name, created_at, modified_at
FROM nodes
WHERE id = ?
"#;

const INSERT_NODE: &str = r#"
INSERT INTO nodes (id, parent_id, kind, name, created_at, modified_at)
VALUES (?, ?, ?, ?, ?, ?)
"#;

const UPDATE_NODE: &str = r#"
UPDATE nodes
SET parent_id = ?, name = ?, modified_at = ?
WHERE id = ?
"#;

const DELETE_NODE: &str = r#"
DELETE FROM nodes
WHERE id = ?
"#;

pub(crate) async fn get_node(conn: &mut SqliteConnection, id: &Uuid) -> KazmasResult<Node> {
    let result = sqlx::query_as::<_, Node>(SELECT_NODE)
        .bind(id)
        .fetch_one(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn create_node(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<bool> {
    let result = sqlx::query(INSERT_NODE)
        .bind(&node.id)
        .bind(&node.parent_id)
        .bind(&node.kind)
        .bind(&node.name)
        .bind(&node.created_at.timestamp())
        .bind(&node.modified_at.timestamp())
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_node(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_NODE)
        .bind(&node.name)
        .bind(&node.parent_id)
        .bind(&node.modified_at)
        .bind(&node.id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn delete_node(conn: &mut SqliteConnection, id: &Uuid) -> KazmasResult<bool> {
    let result = sqlx::query(DELETE_NODE).bind(id).execute(conn).await?;
    Ok(result.rows_affected() == 1)
}
