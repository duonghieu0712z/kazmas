use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};
use sqlx::SqliteConnection;
use uuid::Uuid;

use crate::{
    app::{KazmasError, KazmasResult},
    model::Node,
};

pub(super) const MISSING_SORT_INDEX: i64 = i64::MAX;

const SELECT_SIBLINGS: &str = r"
SELECT nodes.id, json_extract(node_metadata.data, '$.sortIndex') AS sort_index
FROM nodes
LEFT JOIN node_metadata ON node_metadata.node_id = nodes.id
WHERE nodes.parent_id IS ? AND (? OR nodes.deleted_at IS NULL)
ORDER BY COALESCE(sort_index, ?), nodes.created_at, nodes.id
";

const SET_SORT_INDEX: &str = r"
INSERT INTO node_metadata (node_id, data)
VALUES (?, jsonb_object('sortIndex', ?))
ON CONFLICT(node_id) DO UPDATE
SET data = jsonb_set(node_metadata.data, '$.sortIndex', json_extract(excluded.data, '$.sortIndex'))
";

const SELECT_TRASH_POSITION: &str = r"
SELECT json_extract(data, '$.trashPosition')
FROM node_metadata
WHERE node_id = ?
";

const SET_TRASH_POSITION: &str = r"
INSERT INTO node_metadata (node_id, data)
VALUES (?, jsonb_object('trashPosition', jsonb(?)))
ON CONFLICT(node_id) DO UPDATE
SET data = jsonb_set(node_metadata.data, '$.trashPosition', jsonb_extract(excluded.data, '$.trashPosition'))
";

const CLEAR_TRASH_POSITION: &str = r"
UPDATE node_metadata
SET data = jsonb_remove(data, '$.trashPosition')
WHERE node_id = ?
";

#[derive(Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrashPosition {
    prev_sibling_id: Option<Uuid>,
    next_sibling_id: Option<Uuid>,
}

pub(super) async fn siblings(
    conn: &mut SqliteConnection,
    parent_id: Option<Uuid>,
    include_deleted: bool,
) -> KazmasResult<Vec<(Uuid, Option<i64>)>> {
    Ok(sqlx::query_as(SELECT_SIBLINGS)
        .bind(parent_id)
        .bind(include_deleted)
        .bind(MISSING_SORT_INDEX)
        .fetch_all(conn)
        .await?)
}

pub(super) async fn set_sort_index(
    conn: &mut SqliteConnection,
    id: Uuid,
    index: i64,
) -> KazmasResult<()> {
    sqlx::query(SET_SORT_INDEX)
        .bind(id)
        .bind(index)
        .execute(conn)
        .await?;

    Ok(())
}

pub(crate) async fn append(conn: &mut SqliteConnection, node: &Node) -> KazmasResult<()> {
    let siblings = siblings(conn, node.parent_id, true).await?;
    let mut next = siblings
        .iter()
        .filter_map(|(_, index)| *index)
        .max()
        .unwrap_or(-1);

    for (id, index) in siblings {
        if id != node.id && index.is_none() {
            next = next
                .checked_add(1)
                .ok_or_else(|| KazmasError::Invalid("node sort index overflow".into()))?;

            set_sort_index(conn, id, next).await?;
        }
    }

    next = next
        .checked_add(1)
        .ok_or_else(|| KazmasError::Invalid("node sort index overflow".into()))?;

    set_sort_index(conn, node.id, next).await
}

pub(super) async fn record_trash_position(
    conn: &mut SqliteConnection,
    node: &Node,
) -> KazmasResult<()> {
    let siblings = siblings(conn, node.parent_id, false).await?;

    let Some(index) = siblings.iter().position(|(id, _)| *id == node.id) else {
        return Ok(());
    };

    let position = TrashPosition {
        prev_sibling_id: index.checked_sub(1).map(|index| siblings[index].0),
        next_sibling_id: siblings.get(index + 1).map(|(id, _)| *id),
    };

    sqlx::query(SET_TRASH_POSITION)
        .bind(node.id)
        .bind(serde_json::to_string(&position)?)
        .execute(conn)
        .await?;

    Ok(())
}

async fn trash_position(conn: &mut SqliteConnection, id: Uuid) -> KazmasResult<TrashPosition> {
    let value: Option<String> = sqlx::query_scalar(SELECT_TRASH_POSITION)
        .bind(id)
        .fetch_optional(conn)
        .await?
        .flatten();

    Ok(value
        .and_then(|value| serde_json::from_str(&value).ok())
        .unwrap_or_default())
}

pub(super) async fn restore_order(
    conn: &mut SqliteConnection,
    restored: &HashSet<Uuid>,
    original: &[Node],
) -> KazmasResult<()> {
    let mut groups: HashMap<Option<Uuid>, Vec<Uuid>> = HashMap::new();
    for node in original.iter().filter(|node| restored.contains(&node.id)) {
        groups.entry(node.parent_id).or_default().push(node.id);
    }

    for (parent_id, restored_ids) in groups {
        let siblings = siblings(conn, parent_id, false).await?;
        let mut order: Vec<Uuid> = siblings
            .iter()
            .filter(|(id, _)| !restored.contains(id))
            .map(|(id, _)| *id)
            .collect();

        if order.is_empty() {
            order.clone_from(&restored_ids);
        } else {
            let mut pending = Vec::new();
            for id in restored_ids.iter().rev() {
                pending.push((*id, trash_position(conn, *id).await?));
            }

            while !pending.is_empty() {
                let mut progress = false;
                let mut index = 0;

                while index < pending.len() {
                    let (_, position) = &pending[index];

                    if position
                        .prev_sibling_id
                        .is_some_and(|previous| pending.iter().any(|(id, _)| *id == previous))
                    {
                        index += 1;
                        continue;
                    }

                    let insertion = position
                        .prev_sibling_id
                        .and_then(|id| order.iter().position(|item| *item == id))
                        .map(|index| index + 1)
                        .or_else(|| {
                            position
                                .next_sibling_id
                                .and_then(|id| order.iter().position(|item| *item == id))
                        });

                    if let Some(insertion) = insertion {
                        let (id, _) = pending.remove(index);
                        order.insert(insertion, id);
                        progress = true;
                    } else {
                        index += 1;
                    }
                }

                if !progress {
                    let remaining: HashSet<Uuid> = pending.iter().map(|(id, _)| *id).collect();
                    order.extend(restored_ids.iter().filter(|id| remaining.contains(id)));
                    break;
                }
            }
        }

        for (index, id) in order.iter().enumerate() {
            let index =
                i64::try_from(index).map_err(|error| KazmasError::Invalid(error.to_string()))?;

            if !siblings
                .iter()
                .any(|(sibling, value)| sibling == id && *value == Some(index))
            {
                set_sort_index(conn, *id, index).await?;
            }
        }

        for id in restored_ids {
            sqlx::query(CLEAR_TRASH_POSITION)
                .bind(id)
                .execute(&mut *conn)
                .await?;
        }
    }

    Ok(())
}
