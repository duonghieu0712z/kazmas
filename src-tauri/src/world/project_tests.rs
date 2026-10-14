use serde_json::json;
use uuid::Uuid;

use super::*;
use crate::test_support::{TestResult, temp_dir};

async fn root_order(world: &mut WorldProject) -> KazmasResult<Vec<Uuid>> {
    let root = store::get_node_by_kind(&mut world.conn, NodeKind::Manuscript).await?;

    Ok(world
        .get_node_descendants_by_kind(NodeKind::Manuscript)
        .await?
        .into_iter()
        .filter(|node| node.parent_id == Some(root.id))
        .map(|node| node.id)
        .collect())
}

#[tokio::test]
async fn creation_assigns_order_and_preserves_gaps_after_deletion() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Create order", dir.path(), dir.path()).await?;
    let first = world.create_manuscript_entry(Some("First"), None).await?;
    let second = world.create_manuscript_entry(Some("Second"), None).await?;
    let third = world.create_manuscript_entry(Some("Third"), None).await?;

    assert!(world.delete_node(second).await?);
    assert_eq!(world.get_metadata(first).await?.data["sortIndex"], 0);
    assert_eq!(world.get_metadata(second).await?.data["sortIndex"], 1);
    assert_eq!(world.get_metadata(third).await?.data["sortIndex"], 2);

    let fourth = world
        .create_folder(Some("Fourth"), None, NodeKind::Manuscript)
        .await?;
    assert_eq!(world.get_metadata(fourth).await?.data["sortIndex"], 3);
    assert_eq!(root_order(&mut world).await?, vec![first, third, fourth]);

    assert!(world.purge_node(second).await?);
    assert_eq!(world.get_metadata(third).await?.data["sortIndex"], 2);

    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn creation_appends_after_legacy_siblings_without_losing_metadata() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Legacy order", dir.path(), dir.path()).await?;
    let root = store::get_node_by_kind(&mut world.conn, NodeKind::Manuscript).await?;
    let first = Node::new(
        NodeKind::ManuscriptEntry,
        Some("Legacy first"),
        Some(root.id),
    );
    let second = Node::new(NodeKind::Folder, Some("Legacy second"), Some(root.id));

    for node in [&first, &second] {
        store::create_node(&mut world.conn, node).await?;
        store::create_metadata(
            &mut world.conn,
            &NodeMetadata::new(node.id, json!({"tags": ["legacy"]})),
        )
        .await?;
    }

    let third = world.create_manuscript_entry(Some("New"), None).await?;

    assert_eq!(root_order(&mut world).await?, vec![
        first.id, second.id, third
    ]);
    assert_eq!(
        world.get_metadata(first.id).await?.data,
        json!({"tags": ["legacy"], "sortIndex": 0})
    );
    assert_eq!(world.get_metadata(second.id).await?.data["sortIndex"], 1);
    assert_eq!(world.get_metadata(third).await?.data["sortIndex"], 2);

    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn restoration_uses_previous_then_next_then_end_after_reordering() -> TestResult {
    for missing in 0..=3 {
        let dir = temp_dir()?;
        let package = dir.path().join("Restore order.kazmas");
        let mut world = WorldProject::create_world("Restore order", dir.path(), dir.path()).await?;
        let a = world.create_manuscript_entry(Some("A"), None).await?;
        let b = world.create_manuscript_entry(Some("B"), None).await?;
        let c = world.create_manuscript_entry(Some("C"), None).await?;
        let d = world.create_manuscript_entry(Some("D"), None).await?;

        let mut metadata = world.get_metadata(b).await?;
        metadata.data["tags"] = json!(["keep"]);
        world.update_metadata(&metadata).await?;

        assert!(world.delete_node(b).await?);
        assert_eq!(
            world.get_metadata(b).await?.data["trashPosition"],
            json!({"prevSiblingId": a, "nextSiblingId": c})
        );

        assert!(world.move_manuscript_node(c, a, "before").await?);
        assert!(world.move_manuscript_node(d, a, "before").await?);
        assert_eq!(root_order(&mut world).await?, vec![c, d, a]);

        if missing > 0 {
            assert!(world.delete_node(a).await?);
        }
        if missing == 2 {
            assert!(world.delete_node(c).await?);
        }
        if missing == 3 {
            assert!(world.purge_node(a).await?);
        }

        world.save_world().await?;
        world.close_world().await?;

        let mut world = WorldProject::open_world(&package, dir.path()).await?;
        assert!(world.restore_node(b).await?);

        let expected = match missing {
            0 => vec![c, d, a, b],
            2 => vec![d, b],
            _ => vec![b, c, d],
        };
        assert_eq!(root_order(&mut world).await?, expected);
        let metadata = world.get_metadata(b).await?;
        assert_eq!(metadata.data["tags"], json!(["keep"]));
        assert!(metadata.data.get("trashPosition").is_none());

        world.close_world().await?;
    }
    Ok(())
}

#[tokio::test]
async fn batch_restoration_preserves_sibling_order_and_ignores_reparented_anchors() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Batch restore", dir.path(), dir.path()).await?;
    let a = world.create_manuscript_entry(Some("A"), None).await?;
    let b = world.create_manuscript_entry(Some("B"), None).await?;
    let c = world.create_manuscript_entry(Some("C"), None).await?;
    let d = world.create_manuscript_entry(Some("D"), None).await?;

    assert!(world.delete_node(b).await?);
    assert!(world.delete_node(c).await?);
    assert!(world.move_manuscript_node(d, a, "before").await?);
    assert!(world.restore_trash().await?);
    assert_eq!(root_order(&mut world).await?, vec![d, a, b, c]);

    assert!(world.delete_node(b).await?);
    let folder = world
        .create_folder(Some("Folder"), None, NodeKind::Manuscript)
        .await?;
    assert!(world.move_manuscript_node(a, folder, "inside").await?);
    assert!(world.restore_node(b).await?);
    assert_eq!(root_order(&mut world).await?, vec![d, b, c, folder]);

    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn manuscript_moves_preserve_order_and_parent_after_reopening() -> TestResult {
    let dir = temp_dir()?;
    let package = dir.path().join("Moves.kazmas");
    let mut world = WorldProject::create_world("Moves", dir.path(), dir.path()).await?;
    let first = world.create_manuscript_entry(Some("First"), None).await?;
    let second = world.create_manuscript_entry(Some("Second"), None).await?;
    let folder = world
        .create_folder(Some("Folder"), None, NodeKind::Manuscript)
        .await?;
    let nested = world
        .create_folder(Some("Nested"), Some(folder), NodeKind::Manuscript)
        .await?;
    let wiki = world.create_wiki_entry(Some("Wiki"), None).await?;

    let mut metadata = world.get_metadata(first).await?;
    metadata.data["tags"] = serde_json::json!(["draft"]);
    assert!(world.update_metadata(&metadata).await?);

    assert!(world.move_manuscript_node(second, first, "before").await?);
    let parent_id = world.get_node(first).await?.parent_id;
    let roots: Vec<Uuid> = world
        .get_node_descendants_by_kind(NodeKind::Manuscript)
        .await?
        .into_iter()
        .filter(|node| node.parent_id == parent_id)
        .map(|node| node.id)
        .collect();
    assert_eq!(roots, vec![second, first, folder]);

    assert!(world.move_manuscript_node(first, folder, "inside").await?);
    assert_eq!(
        world.get_metadata(first).await?.data,
        serde_json::json!({"tags": ["draft"], "sortIndex": 1})
    );

    assert!(!world.move_manuscript_node(folder, nested, "inside").await?);
    assert!(!world.move_manuscript_node(folder, folder, "inside").await?);
    assert!(!world.move_manuscript_node(wiki, second, "before").await?);
    assert!(!world.move_manuscript_node(second, wiki, "before").await?);
    assert!(!world.move_manuscript_node(second, first, "inside").await?);

    assert!(world.delete_node(second).await?);
    assert!(!world.move_manuscript_node(second, folder, "inside").await?);
    assert!(world.restore_node(second).await?);

    world.save_world().await?;
    world.close_world().await?;
    let mut reopened = WorldProject::open_world(&package, dir.path()).await?;

    assert_eq!(reopened.get_node(first).await?.parent_id, Some(folder));
    let children: Vec<Uuid> = reopened
        .get_node_descendants_by_kind(NodeKind::Manuscript)
        .await?
        .into_iter()
        .filter(|node| node.parent_id == Some(folder))
        .map(|node| node.id)
        .collect();
    assert_eq!(children, vec![nested, first]);

    let third = reopened
        .create_manuscript_entry(Some("Third"), Some(folder))
        .await?;
    let children: Vec<Uuid> = reopened
        .get_node_descendants_by_kind(NodeKind::Manuscript)
        .await?
        .into_iter()
        .filter(|node| node.parent_id == Some(folder))
        .map(|node| node.id)
        .collect();
    assert_eq!(children, vec![nested, first, third]);

    reopened.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn creates_folders_in_empty_sections_and_under_explicit_parents() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Folders", dir.path(), dir.path()).await?;

    for section in [NodeKind::Manuscript, NodeKind::Wiki] {
        let id = world.create_folder(None, None, section).await?;
        let nodes = world.get_node_descendants_by_kind(section).await?;
        assert_eq!(nodes.len(), 1);
        assert_eq!(nodes[0].id, id);
        assert!(matches!(nodes[0].kind, NodeKind::Folder));

        let child = world
            .create_folder(Some("Child"), Some(id), section)
            .await?;
        assert_eq!(world.get_node(child).await?.parent_id, Some(id));
    }

    assert!(world.is_dirty());
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn rejects_invalid_folder_sections_without_changing_world() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Invalid folders", dir.path(), dir.path()).await?;
    let parent = store::get_node_by_kind(&mut world.conn, NodeKind::Manuscript)
        .await?
        .id;

    for kind in [
        NodeKind::World,
        NodeKind::Folder,
        NodeKind::ManuscriptEntry,
        NodeKind::WikiEntry,
    ] {
        for parent_id in [None, Some(parent)] {
            assert!(matches!(
                world.create_folder(Some("Rejected"), parent_id, kind).await,
                Err(KazmasError::Invalid(_))
            ));
        }
    }

    assert!(!world.is_dirty());
    let nodes: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM nodes")
        .fetch_one(&mut world.conn)
        .await?;
    let metadata: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM node_metadata")
        .fetch_one(&mut world.conn)
        .await?;
    assert_eq!(nodes, 3);
    assert_eq!(metadata, 3);
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn saves_and_reopens_document_metadata_and_assets() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Test World", dir.path(), dir.path()).await?;
    assert!(!world.is_dirty());
    let id = world.create_manuscript_entry(Some("Chapter"), None).await?;
    let wiki = world.create_wiki_entry(Some("Character"), None).await?;
    let content = json!({"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Unicode \u{65e5}\u{672c}\u{8a9e}", "marks": [{"type": "bold"}]}]}]});
    world
        .update_document(&Document::new(id, content.clone()))
        .await?;
    world
        .update_metadata(&NodeMetadata::new(wiki, json!({"role": "main"})))
        .await?;
    fs::write(world.workspace.join("assets/sample.txt"), "asset content").await?;
    assert!(world.is_dirty());
    world.save_world().await?;
    assert!(!world.is_dirty());
    let workspace = world.workspace.clone();
    world.close_world().await?;
    assert!(!workspace.exists());
    let mut world =
        WorldProject::open_world(dir.path().join("Test World.kazmas"), dir.path()).await?;
    assert_eq!(world.get_document(id).await?.content, content);
    assert_eq!(
        world.get_metadata(wiki).await?.data,
        json!({"role": "main"})
    );
    assert_eq!(
        fs::read_to_string(world.workspace.join("assets/sample.txt")).await?,
        "asset content"
    );
    assert!(!world.is_dirty());
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn rolls_back_partial_entry_when_document_insert_fails() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Rollback", dir.path(), dir.path()).await?;
    sqlx::raw_sql("CREATE TRIGGER reject_document BEFORE INSERT ON documents BEGIN SELECT RAISE(ABORT, 'injected failure'); END;")
        .execute(&mut world.conn).await?;
    assert!(
        world
            .create_manuscript_entry(Some("Rejected"), None)
            .await
            .is_err()
    );
    assert!(!world.is_dirty());
    let nodes: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM nodes WHERE name = 'Rejected'")
        .fetch_one(&mut world.conn)
        .await?;
    let metadata: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM node_metadata")
        .fetch_one(&mut world.conn)
        .await?;
    assert_eq!(nodes, 0);
    assert_eq!(metadata, 3);
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn trash_restore_and_permanent_deletion_persist_after_save_and_reopen() -> TestResult {
    let dir = temp_dir()?;
    let package = dir.path().join("Trash.kazmas");
    let mut world = WorldProject::create_world("Trash", dir.path(), dir.path()).await?;
    let id = world.create_wiki_entry(Some("Character"), None).await?;
    let content = json!({"type": "doc", "content": [{"type": "paragraph"}]});
    world
        .update_document(&Document::new(id, content.clone()))
        .await?;
    assert!(world.delete_node(id).await?);
    world.save_world().await?;
    world.close_world().await?;

    let mut world = WorldProject::open_world(&package, dir.path()).await?;
    assert_eq!(world.get_trash().await?[0].id, id);
    assert!(
        world
            .get_node_descendants_by_kind(NodeKind::Wiki)
            .await?
            .is_empty()
    );
    assert!(world.restore_node(id).await?);
    assert!(world.is_dirty());
    assert_eq!(world.get_document(id).await?.content, content);
    world.save_world().await?;
    world.close_world().await?;

    let mut world = WorldProject::open_world(&package, dir.path()).await?;
    assert!(world.get_trash().await?.is_empty());
    assert_eq!(
        world.get_node_descendants_by_kind(NodeKind::Wiki).await?[0].id,
        id
    );
    assert!(world.delete_node(id).await?);
    world.save_world().await?;
    assert!(world.empty_trash().await?);
    assert!(world.is_dirty());
    world.save_world().await?;
    world.close_world().await?;

    let mut world = WorldProject::open_world(&package, dir.path()).await?;
    assert!(world.get_trash().await?.is_empty());
    assert!(world.get_document(id).await.is_err());
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn updates_document_and_timestamp_atomically() -> TestResult {
    let dir = temp_dir()?;
    let mut world = WorldProject::create_world("Atomic", dir.path(), dir.path()).await?;
    let id = world.create_manuscript_entry(None, None).await?;
    sqlx::query("UPDATE nodes SET modified_at = 1 WHERE id = ?")
        .bind(id)
        .execute(&mut world.conn)
        .await?;
    world.save_world().await?;
    let content = json!({"type": "doc", "content": []});
    assert!(
        world
            .update_document(&Document::new(id, content.clone()))
            .await?
    );
    assert!(world.get_node(id).await?.modified_at.timestamp() > 1);
    world.save_world().await?;
    sqlx::raw_sql("CREATE TRIGGER reject_update BEFORE UPDATE ON nodes BEGIN SELECT RAISE(ABORT, 'injected failure'); END;")
        .execute(&mut world.conn).await?;
    assert!(
        world
            .update_document(&Document::new(id, json!({"changed": true})))
            .await
            .is_err()
    );
    assert_eq!(world.get_document(id).await?.content, content);
    assert!(!world.is_dirty());
    assert!(
        !world
            .update_document(&Document::new(Uuid::now_v7(), json!({})))
            .await?
    );
    world.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn save_as_preserves_original_and_restores_target_after_failure() -> TestResult {
    let dir = temp_dir()?;
    let original = dir.path().join("Original.kazmas");
    let copy = dir.path().join("Copy.kazmas");
    let mut world = WorldProject::create_world("Original", dir.path(), dir.path()).await?;
    let bytes = fs::read(&original).await?;
    let id = world
        .create_manuscript_entry(Some("New chapter"), None)
        .await?;
    world.save_world_as(&copy).await?;
    assert_eq!(fs::read(&original).await?, bytes);
    let blocked = dir.path().join("blocked.kazmas");
    fs::create_dir(&blocked).await?;
    world
        .update_document(&Document::new(id, json!({"type": "doc"})))
        .await?;
    assert!(world.save_world_as(&blocked).await.is_err());
    assert_eq!(world.package, copy);
    assert!(world.is_dirty());
    world.save_world().await?;
    world.close_world().await?;
    let mut reopened = WorldProject::open_world(&copy, dir.path()).await?;
    assert_eq!(reopened.get_node(id).await?.name, "New chapter");
    reopened.close_world().await?;
    Ok(())
}

#[tokio::test]
async fn opens_worlds_with_case_insensitive_extensions() -> TestResult {
    let dir = temp_dir()?;
    let world = WorldProject::create_world("Extensions", dir.path(), dir.path()).await?;
    let id = world.id();
    world.close_world().await?;
    let original = dir.path().join("Extensions.kazmas");

    for extension in ["KAZMAS", "Kazmas", "kazmas"] {
        let path = dir.path().join(format!("Reopened.{extension}"));
        fs::copy(&original, &path).await?;
        let world = WorldProject::open_world(&path, dir.path()).await?;
        assert_eq!(world.id(), id);
        world.close_world().await?;
    }
    Ok(())
}

#[tokio::test]
async fn rejects_existing_target_invalid_extension_missing_and_corrupt_packages() -> TestResult {
    let dir = temp_dir()?;
    let world = WorldProject::create_world("Existing", dir.path(), dir.path()).await?;
    let bytes = fs::read(dir.path().join("Existing.kazmas")).await?;
    assert!(
        WorldProject::create_world("Existing", dir.path(), dir.path())
            .await
            .is_err()
    );
    assert_eq!(fs::read(dir.path().join("Existing.kazmas")).await?, bytes);
    world.close_world().await?;
    assert!(
        WorldProject::open_world(dir.path().join("missing.kazmas"), dir.path())
            .await
            .is_err()
    );
    assert!(
        WorldProject::open_world(dir.path().join("wrong.zip"), dir.path())
            .await
            .is_err()
    );
    let corrupt = dir.path().join("corrupt.kazmas");
    fs::write(&corrupt, "invalid zip").await?;
    assert!(WorldProject::open_world(corrupt, dir.path()).await.is_err());
    Ok(())
}

#[tokio::test]
async fn missing_database_cleans_workspace_and_preserves_package() -> TestResult {
    let dir = temp_dir()?;
    let workspace = dir.path().join("incomplete");
    fs::create_dir(&workspace).await?;
    let manifest = WorldManifest::new("Incomplete");
    write_manifest(&manifest, &workspace).await?;
    let package = dir.path().join("incomplete.kazmas");
    pack_world(&workspace, &package)?;
    let original = fs::read(&package).await?;
    let temp = dir.path().join("workspaces");
    for _ in 0..2 {
        assert!(matches!(
            WorldProject::open_world(&package, &temp).await,
            Err(KazmasError::Invalid(message)) if message == "world package has no database file"
        ));
        let mut workspaces = fs::read_dir(temp.join(manifest.id.simple().to_string())).await?;
        assert!(workspaces.next_entry().await?.is_none());
    }
    assert_eq!(fs::read(package).await?, original);
    Ok(())
}
