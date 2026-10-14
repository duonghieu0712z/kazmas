use std::collections::HashSet;

use chrono::Utc;
use sqlx::{Connection, SqliteConnection};
use uuid::Uuid;

use super::node_order;
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
ORDER BY COALESCE((SELECT json_extract(data, '$.sortIndex') FROM node_metadata WHERE node_id = descendants.id), ?), created_at, id
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
ORDER BY COALESCE((SELECT json_extract(data, '$.sortIndex') FROM node_metadata WHERE node_id = reachable.id), ?), created_at, id
";

const UPDATE_NODE: &str = r"
UPDATE nodes
SET parent_id = ?, name = ?, modified_at = ?
WHERE id = ?
";

const UPDATE_NODE_PARENT: &str = r"
UPDATE nodes
SET parent_id = ?, modified_at = ?
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
        .bind(node_order::MISSING_SORT_INDEX)
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

pub(crate) async fn move_manuscript_node(
    conn: &mut SqliteConnection,
    id: Uuid,
    target_id: Uuid,
    placement: &str,
) -> KazmasResult<bool> {
    let mut tx = conn.begin().await?;
    let root = get_node_by_kind(&mut tx, NodeKind::Manuscript).await?;
    let nodes = get_node_descendants_by_kind(&mut tx, NodeKind::Manuscript).await?;

    let Some(node) = nodes.iter().find(|node| node.id == id) else {
        return Ok(false);
    };

    let Some(target) = nodes
        .iter()
        .find(|node| node.id == target_id)
        .or_else(|| (root.id == target_id).then_some(&root))
    else {
        return Ok(false);
    };

    if id == target_id {
        return Ok(false);
    }

    let parent_id = match placement {
        "inside" if matches!(target.kind, NodeKind::Folder | NodeKind::Manuscript) => target.id,
        "before" | "after" if target.id != root.id => {
            let Some(parent_id) = target.parent_id else {
                return Ok(false);
            };
            parent_id
        },
        _ => return Ok(false),
    };

    let mut ancestor = Some(parent_id);
    let mut visited = HashSet::new();

    while let Some(parent) = ancestor {
        if parent == id || !visited.insert(parent) {
            return Ok(false);
        }

        ancestor = nodes
            .iter()
            .find(|node| node.id == parent)
            .and_then(|node| node.parent_id);
    }

    let mut siblings: Vec<Uuid> = nodes
        .iter()
        .filter(|item| item.parent_id == Some(parent_id) && item.id != id)
        .map(|item| item.id)
        .collect();
    let index = if placement == "inside" {
        siblings.len()
    } else {
        let Some(index) = siblings.iter().position(|id| *id == target_id) else {
            return Ok(false);
        };
        index + usize::from(placement == "after")
    };

    siblings.insert(index, id);

    let previous: Vec<Uuid> = nodes
        .iter()
        .filter(|item| item.parent_id == node.parent_id)
        .map(|item| item.id)
        .collect();
    if node.parent_id == Some(parent_id) && previous == siblings {
        return Ok(true);
    }

    let now = Utc::now().timestamp();
    for (index, sibling) in siblings.iter().enumerate() {
        sqlx::query(UPDATE_NODE_PARENT)
            .bind(parent_id)
            .bind(now)
            .bind(sibling)
            .execute(&mut *tx)
            .await?;

        node_order::set_sort_index(
            &mut tx,
            *sibling,
            i64::try_from(index)
                .map_err(|error| crate::app::KazmasError::Invalid(error.to_string()))?,
        )
        .await?;
    }

    tx.commit().await?;
    Ok(true)
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
    let mut tx = conn.begin().await?;

    let Some(node) = sqlx::query_as::<_, Node>(SELECT_NODE)
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
    else {
        return Ok(false);
    };

    if node.deleted_at.is_some()
        || !matches!(
            node.kind,
            NodeKind::Folder | NodeKind::ManuscriptEntry | NodeKind::WikiEntry
        )
    {
        return Ok(false);
    }

    node_order::record_trash_position(&mut tx, &node).await?;

    let now = Utc::now().timestamp();
    let result = sqlx::query(DELETE_NODE)
        .bind(now)
        .bind(now)
        .bind(id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn purge_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<bool> {
    let result = sqlx::query(PURGE_NODE).bind(id).execute(conn).await?;
    Ok(result.rows_affected() == 1)
}

pub(crate) async fn restore_node(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<bool> {
    let mut tx = conn.begin().await?;
    let trash = get_trash(&mut tx).await?;

    let Some(node) = trash.iter().find(|node| node.id == id) else {
        return Ok(false);
    };

    let mut restored = HashSet::from([id]);
    let mut pending = vec![id];

    while let Some(parent_id) = pending.pop() {
        for child in trash
            .iter()
            .filter(|node| node.parent_id == Some(parent_id))
        {
            restored.insert(child.id);
            pending.push(child.id);
        }
    }

    let mut ancestors = HashSet::new();
    let mut parent_id = node.parent_id;

    while let Some(parent) = parent_id.and_then(|id| trash.iter().find(|node| node.id == id)) {
        ancestors.insert(parent.id);
        restored.insert(parent.id);
        parent_id = parent.parent_id;
    }

    let now = Utc::now().timestamp();
    for sibling in trash.iter().filter(|node| {
        node.deleted_at.is_none()
            && !restored.contains(&node.id)
            && node.parent_id.is_some_and(|id| ancestors.contains(&id))
    }) {
        node_order::record_trash_position(&mut tx, sibling).await?;

        sqlx::query(DELETE_NODE)
            .bind(now)
            .bind(now)
            .bind(sibling.id)
            .execute(&mut *tx)
            .await?;
    }

    for id in &restored {
        sqlx::query(RESTORE_NODE)
            .bind(now)
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }

    node_order::restore_order(&mut tx, &restored, &trash).await?;

    tx.commit().await?;
    Ok(true)
}

pub(crate) async fn get_trash(conn: &mut SqliteConnection) -> KazmasResult<Vec<Node>> {
    Ok(sqlx::query_as::<_, Node>(SELECT_TRASH)
        .bind(node_order::MISSING_SORT_INDEX)
        .fetch_all(conn)
        .await?)
}

pub(crate) async fn restore_trash(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    let mut tx = conn.begin().await?;
    let trash = get_trash(&mut tx).await?;

    let result = sqlx::query(RESTORE_TRASH)
        .bind(Utc::now().timestamp())
        .execute(&mut *tx)
        .await?;

    let restored = trash.iter().map(|node| node.id).collect();
    node_order::restore_order(&mut tx, &restored, &trash).await?;

    tx.commit().await?;
    Ok(result.rows_affected() > 0)
}

pub(crate) async fn empty_trash(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    let result = sqlx::query(EMPTY_TRASH).execute(conn).await?;
    Ok(result.rows_affected() > 0)
}
