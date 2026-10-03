use serde_json::json;
use uuid::Uuid;

use super::*;
use crate::{
    database::close_database,
    model::{Document, Node, NodeKind, NodeMetadata},
    test_support::{TestResult, database, temp_dir},
};

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
    assert!(purge_node(&mut conn, folder.id).await?);
    assert!(get_node(&mut conn, child.id).await.is_err());
    assert!(get_document(&mut conn, child.id).await.is_err());
    assert!(get_metadata(&mut conn, child.id).await.is_err());
    assert!(!purge_node(&mut conn, folder.id).await?);
    close_database(conn).await?;
    Ok(())
}
