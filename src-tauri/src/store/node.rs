use chrono::Utc;
use sqlx::SqliteConnection;
use uuid::Uuid;

use crate::{
    app::KazmasResult,
    model::{Node, NodeKind},
};

const SELECT_NODE: &str = r"
SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at
FROM nodes
WHERE id = ?
";

const SELECT_NODE_BY_KIND: &str = r"
SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at
FROM nodes
WHERE kind = ? AND deleted_at IS NULL
ORDER BY created_at
LIMIT 1
";

const SELECT_NODE_DESCENDANTS_BY_KIND: &str = r"
WITH RECURSIVE root AS (
    SELECT id
    FROM nodes
    WHERE kind = ? AND deleted_at IS NULL
    ORDER BY created_at
    LIMIT 1
),
descendants AS (
    SELECT nodes.id, nodes.parent_id, nodes.kind, nodes.name, nodes.created_at, nodes.modified_at, nodes.deleted_at
    FROM nodes
    INNER JOIN root ON nodes.parent_id = root.id
    WHERE nodes.deleted_at IS NULL

    UNION ALL

    SELECT nodes.id, nodes.parent_id, nodes.kind, nodes.name, nodes.created_at, nodes.modified_at, nodes.deleted_at
    FROM nodes
    INNER JOIN descendants ON nodes.parent_id = descendants.id
    WHERE nodes.deleted_at IS NULL
)
SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at
FROM descendants
";

const INSERT_NODE: &str = r"
INSERT INTO nodes (id, parent_id, kind, name, created_at, modified_at)
VALUES (?, ?, ?, ?, ?, ?)
";

const SELECT_TRASH: &str = r"
WITH RECURSIVE reachable AS (
    SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at, deleted_at IS NOT NULL AS trashed
    FROM nodes
    WHERE kind IN ('manuscript', 'wiki') AND deleted_at IS NULL
    UNION ALL
    SELECT nodes.id, nodes.parent_id, nodes.kind, nodes.name, nodes.created_at, nodes.modified_at, nodes.deleted_at,
        reachable.trashed OR nodes.deleted_at IS NOT NULL
    FROM nodes
    INNER JOIN reachable ON nodes.parent_id = reachable.id
)
SELECT id, parent_id, kind, name, created_at, modified_at, deleted_at
FROM reachable
WHERE trashed
ORDER BY deleted_at DESC, id
";

const UPDATE_NODE: &str = r"
UPDATE nodes
SET parent_id = ?, name = ?, modified_at = ?
WHERE id = ?
";

const UPDATE_NODE_MODIFIED_AT: &str = r"
UPDATE nodes
SET modified_at = ?
WHERE id = ?
";

const DELETE_NODE: &str = r"
UPDATE nodes
SET modified_at = ?, deleted_at = ?
WHERE id = ? AND deleted_at IS NULL AND kind IN ('folder', 'manuscript_entry', 'wiki_entry')
";

const PURGE_NODE: &str = r"
DELETE FROM nodes
WHERE id = ? AND deleted_at IS NOT NULL AND kind IN ('folder', 'manuscript_entry', 'wiki_entry')
";

const RESTORE_NODE: &str = r"
UPDATE nodes
SET modified_at = ?, deleted_at = NULL
WHERE id = ? AND deleted_at IS NOT NULL
";

const RESTORE_TRASH: &str = r"
UPDATE nodes
SET deleted_at = NULL, modified_at = ?
WHERE deleted_at IS NOT NULL AND kind IN ('folder', 'manuscript_entry', 'wiki_entry')
";

const EMPTY_TRASH: &str = r"
DELETE FROM nodes
WHERE deleted_at IS NOT NULL AND kind IN ('folder', 'manuscript_entry', 'wiki_entry')
";

pub(crate) async fn get_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<Node> {
    let result = sqlx::query_as::<_, Node>(SELECT_NODE)
        .bind(id)
        .fetch_one(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn get_node_by_kind(
    conn: &mut SqliteConnection,
    kind: NodeKind,
) -> KazmasResult<Node> {
    let result = sqlx::query_as::<_, Node>(SELECT_NODE_BY_KIND)
        .bind(kind)
        .fetch_one(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn get_node_descendants_by_kind(
    conn: &mut SqliteConnection,
    kind: NodeKind,
) -> KazmasResult<Vec<Node>> {
    let result = sqlx::query_as::<_, Node>(SELECT_NODE_DESCENDANTS_BY_KIND)
        .bind(kind)
        .fetch_all(conn)
        .await?;
    Ok(result)
}

pub(crate) async fn create_node(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<bool> {
    let result = sqlx::query(INSERT_NODE)
        .bind(node.id)
        .bind(node.parent_id)
        .bind(node.kind)
        .bind(&node.name)
        .bind(node.created_at.timestamp())
        .bind(node.modified_at.timestamp())
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_node(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_NODE)
        .bind(node.parent_id)
        .bind(&node.name)
        .bind(Utc::now().timestamp())
        .bind(node.id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn update_node_modified_at(
    conn: &mut SqliteConnection,
    id: Uuid,
) -> KazmasResult<bool> {
    let result = sqlx::query(UPDATE_NODE_MODIFIED_AT)
        .bind(Utc::now().timestamp())
        .bind(id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn delete_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<bool> {
    let now = Utc::now().timestamp();
    let result = sqlx::query(DELETE_NODE)
        .bind(now)
        .bind(now)
        .bind(id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn purge_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<bool> {
    let result = sqlx::query(PURGE_NODE).bind(id).execute(conn).await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn restore_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<bool> {
    let trash = get_trash(conn).await?;
    let Some(node) = trash.iter().find(|node| node.id == id) else {
        return Ok(false);
    };

    if node
        .parent_id
        .is_some_and(|parent_id| trash.iter().any(|parent| parent.id == parent_id))
    {
        return Ok(false);
    }

    let now = Utc::now().timestamp();
    let result = sqlx::query(RESTORE_NODE)
        .bind(now)
        .bind(id)
        .execute(conn)
        .await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn get_trash(conn: &mut SqliteConnection) -> KazmasResult<Vec<Node>> {
    Ok(sqlx::query_as::<_, Node>(SELECT_TRASH)
        .fetch_all(conn)
        .await?)
}

pub(crate) async fn restore_trash(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    let result = sqlx::query(RESTORE_TRASH)
        .bind(Utc::now().timestamp())
        .execute(conn)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub(crate) async fn empty_trash(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    let result = sqlx::query(EMPTY_TRASH).execute(conn).await?;
    Ok(result.rows_affected() > 0)
}
