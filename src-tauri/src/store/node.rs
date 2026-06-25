use chrono::Utc;
use sqlx::SqliteConnection;
use uuid::Uuid;

use crate::{app::KazmasResult, model::Node};

const SELECT_NODE: &str = r#"
SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at
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
UPDATE nodes
SET modified_at = ?, deleted_at = ?
WHERE id = ? AND deleted_at IS NULL
"#;

const PURGE_NODE: &str = r#"
DELETE FROM nodes
WHERE id = ?
"#;

const RESTORE_NODE: &str = r#"
UPDATE nodes
SET modified_at = ?, deleted_at = NULL
WHERE id = ? AND deleted_at IS NOT NULL
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
        .bind(node.created_at.timestamp())
        .bind(node.modified_at.timestamp())
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_node(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_NODE)
        .bind(&node.parent_id)
        .bind(&node.name)
        .bind(node.modified_at.timestamp())
        .bind(&node.id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn delete_node(conn: &mut SqliteConnection, id: &Uuid) -> KazmasResult<bool> {
    let now = Utc::now().timestamp();
    let result = sqlx::query(DELETE_NODE)
        .bind(now)
        .bind(now)
        .bind(id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn purge_node(conn: &mut SqliteConnection, id: &Uuid) -> KazmasResult<bool> {
    let result = sqlx::query(PURGE_NODE).bind(id).execute(conn).await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn restore_node(conn: &mut SqliteConnection, id: &Uuid) -> KazmasResult<bool> {
    let now = Utc::now().timestamp();
    let result = sqlx::query(RESTORE_NODE)
        .bind(now)
        .bind(id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}
