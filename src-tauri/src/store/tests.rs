use serde_json::json;
use uuid::Uuid;

use super::*;
use crate::{
    database::close_database,
    model::{Document, Node, NodeKind, NodeMetadata},
    test_support::{TestResult, database, temp_dir},
};

const REJECT_ORDER_UPDATE: &str = r"
CREATE TRIGGER reject_order BEFORE UPDATE OF data ON node_metadata
BEGIN
    SELECT RAISE(ABORT, 'injected failure');
END
";

#[tokio::test]
async fn trash_order_uses_index_then_creation_time_then_id_with_legacy_nodes_last() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("trash-order.db")).await?;
    let root = Node::new(NodeKind::Manuscript, None, None);
    create_node(&mut conn, &root).await?;

    let mut nodes = Vec::new();
    for (id, index, timestamp) in [
        (1, Some(2), 1),
        (2, Some(1), 3),
        (3, Some(1), 2),
        (4, Some(1), 2),
        (5, None, 1),
    ] {
        let mut node = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
        node.id = Uuid::from_u128(id);
        node.created_at =
            chrono::DateTime::from_timestamp(timestamp, 0).ok_or("invalid test timestamp")?;
        create_node(&mut conn, &node).await?;
        let data = index.map_or_else(|| json!({}), |index| json!({"sortIndex": index}));
        create_metadata(&mut conn, &NodeMetadata::new(node.id, data)).await?;
        nodes.push(node);
    }

    for node in &nodes {
        assert!(delete_node(&mut conn, node.id).await?);
    }

    let ids: Vec<Uuid> = get_trash(&mut conn)
        .await?
        .into_iter()
        .map(|node| node.id)
        .collect();
    assert_eq!(ids, [3, 4, 2, 1, 5].map(Uuid::from_u128));

    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn failed_restore_rolls_back_flags_order_and_saved_anchors() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("restore-rollback.db")).await?;
    let root = Node::new(NodeKind::Manuscript, None, None);
    let first = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
    let second = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
    let third = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
    for (index, node) in [&root, &first, &second, &third].iter().enumerate() {
        create_node(&mut conn, node).await?;
        create_metadata(
            &mut conn,
            &NodeMetadata::new(node.id, json!({"sortIndex": index, "tags": ["keep"]})),
        )
        .await?;
    }

    assert!(delete_node(&mut conn, second.id).await?);
    let before = get_metadata(&mut conn, second.id).await?.data;

    sqlx::raw_sql(REJECT_ORDER_UPDATE)
        .execute(&mut conn)
        .await?;

    assert!(restore_node(&mut conn, second.id).await.is_err());

    assert!(get_node(&mut conn, second.id).await?.deleted_at.is_some());
    assert_eq!(get_metadata(&mut conn, second.id).await?.data, before);
    assert_eq!(
        get_metadata(&mut conn, first.id).await?.data["sortIndex"],
        1
    );
    assert_eq!(
        get_metadata(&mut conn, third.id).await?.data["sortIndex"],
        3
    );

    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn document_and_metadata_round_trip_unicode_and_nested_json() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("json.db")).await?;
    let node = Node::new(NodeKind::ManuscriptEntry, Some("Chapter"), None);
    assert!(create_node(&mut conn, &node).await?);
    let content = json!({"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Unicode \u{65e5}\u{672c}\u{8a9e}", "marks": [{"type": "bold"}]}]}]});
    assert!(create_document(&mut conn, &Document::new(node.id, content.clone())).await?);
    assert_eq!(get_document(&mut conn, node.id).await?.content, content);
    let data = json!({"tags": ["fiction", "draft"], "settings": {"enabled": true}});
    assert!(create_metadata(&mut conn, &NodeMetadata::new(node.id, data.clone())).await?);
    assert_eq!(get_metadata(&mut conn, node.id).await?.data, data);
    let changed = json!({"type": "doc"});
    assert!(update_document(&mut conn, &Document::new(node.id, changed.clone())).await?);
    assert_eq!(get_document(&mut conn, node.id).await?.content, changed);
    assert!(!update_document(&mut conn, &Document::new(Uuid::now_v7(), json!({}))).await?);
    assert!(!update_metadata(&mut conn, &NodeMetadata::new(Uuid::now_v7(), json!({}))).await?);
    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn rejects_invalid_names_foreign_keys_and_malformed_json() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("constraints.db")).await?;
    assert!(
        create_node(&mut conn, &Node::new(NodeKind::Folder, Some("   "), None))
            .await
            .is_err()
    );
    assert!(
        create_node(
            &mut conn,
            &Node::new(NodeKind::Folder, None, Some(Uuid::now_v7()))
        )
        .await
        .is_err()
    );
    assert!(
        create_document(&mut conn, &Document::new(Uuid::now_v7(), json!({})))
            .await
            .is_err()
    );
    assert!(
        sqlx::query("SELECT jsonb(?)")
            .bind("{broken")
            .execute(&mut conn)
            .await
            .is_err()
    );
    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn soft_delete_hides_subtree_restore_recovers_it_and_purge_cascades() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("tree.db")).await?;
    let root = Node::new(NodeKind::Manuscript, None, None);
    let folder = Node::new(NodeKind::Folder, None, Some(root.id));
    let child = Node::new(NodeKind::ManuscriptEntry, None, Some(folder.id));
    for node in [&root, &folder, &child] {
        create_node(&mut conn, node).await?;
    }
    create_document(&mut conn, &Document::new(child.id, json!({"type": "doc"}))).await?;
    create_metadata(&mut conn, &NodeMetadata::new(child.id, json!({}))).await?;
    assert_eq!(
        get_node_descendants_by_kind(&mut conn, NodeKind::Manuscript)
            .await?
            .len(),
        2
    );
    assert!(delete_node(&mut conn, folder.id).await?);
    assert!(!delete_node(&mut conn, folder.id).await?);
    let trash = get_trash(&mut conn).await?;
    assert_eq!(trash.len(), 2);
    assert!(
        trash
            .iter()
            .any(|node| node.id == child.id && node.deleted_at.is_none())
    );
    assert!(
        get_node_descendants_by_kind(&mut conn, NodeKind::Manuscript)
            .await?
            .is_empty()
    );
    assert!(restore_node(&mut conn, folder.id).await?);
    assert!(!restore_node(&mut conn, folder.id).await?);
    assert_eq!(
        get_node_descendants_by_kind(&mut conn, NodeKind::Manuscript)
            .await?
            .len(),
        2
    );
    assert!(!purge_node(&mut conn, folder.id).await?);
    assert!(delete_node(&mut conn, folder.id).await?);
    assert!(purge_node(&mut conn, folder.id).await?);
    assert!(get_node(&mut conn, child.id).await.is_err());
    assert!(get_document(&mut conn, child.id).await.is_err());
    assert!(get_metadata(&mut conn, child.id).await.is_err());
    assert!(!purge_node(&mut conn, folder.id).await?);
    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn folder_restore_recovers_deleted_children_and_emptying_keeps_live_content() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("trash.db")).await?;
    let world = Node::new(NodeKind::World, None, None);
    let root = Node::new(NodeKind::Manuscript, None, Some(world.id));
    let folder = Node::new(NodeKind::Folder, None, Some(root.id));
    let child = Node::new(NodeKind::ManuscriptEntry, None, Some(folder.id));
    let live = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
    for node in [&world, &root, &folder, &child, &live] {
        create_node(&mut conn, node).await?;
    }
    create_document(&mut conn, &Document::new(child.id, json!({"type": "doc"}))).await?;
    create_metadata(&mut conn, &NodeMetadata::new(child.id, json!({}))).await?;
    create_document(&mut conn, &Document::new(live.id, json!({"type": "doc"}))).await?;
    assert!(!delete_node(&mut conn, world.id).await?);
    assert!(!delete_node(&mut conn, root.id).await?);
    assert!(!purge_node(&mut conn, live.id).await?);
    assert!(delete_node(&mut conn, child.id).await?);
    assert!(delete_node(&mut conn, folder.id).await?);
    let trash = get_trash(&mut conn).await?;
    assert_eq!(trash.len(), 2);
    assert!(trash.iter().any(|node| node.id == folder.id));
    assert!(trash.iter().any(|node| node.id == child.id));
    assert!(restore_node(&mut conn, folder.id).await?);
    assert!(get_trash(&mut conn).await?.is_empty());
    assert!(get_node(&mut conn, child.id).await?.deleted_at.is_none());
    assert!(delete_node(&mut conn, child.id).await?);
    assert!(restore_trash(&mut conn).await?);
    assert!(get_trash(&mut conn).await?.is_empty());
    assert!(get_node(&mut conn, child.id).await?.deleted_at.is_none());
    assert!(!restore_trash(&mut conn).await?);
    assert!(delete_node(&mut conn, child.id).await?);
    assert!(delete_node(&mut conn, folder.id).await?);
    assert!(empty_trash(&mut conn).await?);
    assert!(get_trash(&mut conn).await?.is_empty());
    assert!(get_node(&mut conn, folder.id).await.is_err());
    assert!(get_document(&mut conn, child.id).await.is_err());
    assert!(get_metadata(&mut conn, child.id).await.is_err());
    assert!(get_document(&mut conn, live.id).await.is_ok());
    assert!(!empty_trash(&mut conn).await?);
    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn restoring_nested_branch_recovers_ancestors_and_keeps_siblings_in_trash() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = database(&dir.path().join("nested-restore.db")).await?;
    let root = Node::new(NodeKind::Manuscript, None, None);
    let outer = Node::new(NodeKind::Folder, None, Some(root.id));
    let inner = Node::new(NodeKind::Folder, None, Some(outer.id));
    let selected = Node::new(NodeKind::Folder, None, Some(inner.id));
    let child = Node::new(NodeKind::ManuscriptEntry, None, Some(selected.id));
    let outer_sibling = Node::new(NodeKind::ManuscriptEntry, None, Some(outer.id));
    let inner_sibling = Node::new(NodeKind::Folder, None, Some(inner.id));
    let sibling_child = Node::new(NodeKind::ManuscriptEntry, None, Some(inner_sibling.id));
    let deleted_sibling = Node::new(NodeKind::ManuscriptEntry, None, Some(inner.id));
    let live = Node::new(NodeKind::ManuscriptEntry, None, Some(root.id));
    for node in [
        &root,
        &outer,
        &inner,
        &selected,
        &child,
        &outer_sibling,
        &inner_sibling,
        &sibling_child,
        &deleted_sibling,
        &live,
    ] {
        create_node(&mut conn, node).await?;
    }

    assert!(delete_node(&mut conn, child.id).await?);
    assert!(delete_node(&mut conn, deleted_sibling.id).await?);
    assert!(delete_node(&mut conn, outer.id).await?);
    assert!(restore_node(&mut conn, selected.id).await?);

    let trash = get_trash(&mut conn).await?;
    assert_eq!(trash.len(), 4);
    for id in [
        outer_sibling.id,
        inner_sibling.id,
        sibling_child.id,
        deleted_sibling.id,
    ] {
        assert!(trash.iter().any(|node| node.id == id));
    }
    let visible = get_node_descendants_by_kind(&mut conn, NodeKind::Manuscript).await?;
    assert_eq!(visible.len(), 5);
    for id in [outer.id, inner.id, selected.id, child.id, live.id] {
        assert!(visible.iter().any(|node| node.id == id));
    }

    assert!(restore_node(&mut conn, sibling_child.id).await?);
    let trash = get_trash(&mut conn).await?;
    assert_eq!(trash.len(), 2);
    assert!(trash.iter().any(|node| node.id == outer_sibling.id));
    assert!(trash.iter().any(|node| node.id == deleted_sibling.id));
    assert!(restore_trash(&mut conn).await?);
    assert!(get_trash(&mut conn).await?.is_empty());
    assert!(!restore_node(&mut conn, selected.id).await?);
    assert!(!restore_node(&mut conn, Uuid::now_v7()).await?);
    close_database(conn).await?;
    Ok(())
}
