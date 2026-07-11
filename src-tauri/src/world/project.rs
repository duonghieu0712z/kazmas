use std::path::{Path, PathBuf};

use sqlx::{Acquire, SqliteConnection};
use tokio::fs;
use uuid::Uuid;

use super::{
    archive::{pack_world, unpack_world},
    manifest::{WorldManifest, read_manifest, write_manifest},
};
use crate::{
    app::{KazmasError, KazmasResult},
    database,
    model::{Document, Node, NodeKind, NodeMetadata},
    store,
};

pub(crate) const EXTENSION: &str = "kazmas";

#[derive(Debug)]
pub(crate) struct WorldProject {
    manifest: WorldManifest,
    conn: SqliteConnection,
    dirty: bool,

    package: PathBuf,
    workspace: PathBuf,
}

impl WorldProject {
    pub(crate) fn id(&self) -> Uuid {
        self.manifest.id
    }

    pub(crate) fn manifest(&self) -> WorldManifest {
        self.manifest.clone()
    }

    pub(crate) fn is_dirty(&self) -> bool {
        self.dirty
    }

    pub(crate) async fn create_world(
        name: &str,
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let package_path = create_package_path(name, path);
        if fs::try_exists(&package_path).await? {
            return Err(KazmasError::AlreadyExists(format!(
                "world with name {name} already exists at {}",
                package_path.to_string_lossy()
            )));
        }

        let manifest = WorldManifest::new(name);

        let workspace_path = create_workspace_path(manifest.id, &temp_dir).await?;
        write_manifest(&manifest, &workspace_path).await?;
        create_assets_dir(&manifest, &workspace_path).await?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = database::open_database(world_db).await?;
        database::initialize_schema(&mut conn).await?;
        seed_world_nodes(&mut conn, &manifest).await?;

        database::checkpoint_wal(&mut conn).await?;
        pack_world(&workspace_path, &package_path)?;

        Ok(Self {
            manifest,
            conn,
            dirty: false,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) async fn open_world(
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let package_path = path.as_ref().to_path_buf();
        if package_path.extension() != Some(EXTENSION.as_ref()) {
            return Err(KazmasError::Invalid(format!(
                "expected .{EXTENSION} file: {}",
                package_path.to_string_lossy()
            )));
        }

        if !fs::try_exists(&package_path).await? {
            return Err(KazmasError::NotFound(format!(
                "world not found at {}",
                package_path.to_string_lossy()
            )));
        }

        if !fs::metadata(&package_path).await?.is_file() {
            return Err(KazmasError::Invalid(format!(
                "expected file path: {}",
                package_path.to_string_lossy()
            )));
        }

        let mut manifest = read_manifest(&package_path)?;

        let workspace_path = create_workspace_path(manifest.id, &temp_dir).await?;
        unpack_world(&package_path, &workspace_path)?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = database::open_database(world_db).await?;
        database::validate_database(&mut conn).await?;

        database::checkpoint_wal(&mut conn).await?;
        manifest.open();
        write_manifest(&manifest, &workspace_path).await?;
        pack_world(&workspace_path, &package_path)?;

        Ok(Self {
            manifest,
            conn,
            dirty: false,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) async fn save_world(&mut self) -> KazmasResult<()> {
        database::checkpoint_wal(&mut self.conn).await?;

        self.manifest.modify();
        write_manifest(&self.manifest, &self.workspace).await?;

        pack_world(&self.workspace, &self.package)?;
        self.dirty = false;
        Ok(())
    }

    pub(crate) async fn save_world_as(&mut self, path: impl AsRef<Path>) -> KazmasResult<()> {
        let package = self.package.clone();
        self.package = path.as_ref().into();
        if let Err(error) = self.save_world().await {
            self.package = package;
            return Err(error);
        }

        Ok(())
    }

    pub(crate) async fn close_world(self) -> KazmasResult<()> {
        database::close_database(self.conn).await?;
        fs::remove_dir_all(&self.workspace).await?;
        Ok(())
    }

    pub(crate) async fn get_node(&mut self, id: Uuid) -> KazmasResult<Node> {
        store::get_node(&mut self.conn, id).await
    }

    pub(crate) async fn get_node_descendants_by_kind(
        &mut self,
        kind: NodeKind,
    ) -> KazmasResult<Vec<Node>> {
        store::get_node_descendants_by_kind(&mut self.conn, kind).await
    }

    pub(crate) async fn get_metadata(&mut self, node_id: Uuid) -> KazmasResult<NodeMetadata> {
        store::get_metadata(&mut self.conn, node_id).await
    }

    pub(crate) async fn get_document(&mut self, node_id: Uuid) -> KazmasResult<Document> {
        store::get_document(&mut self.conn, node_id).await
    }

    pub(crate) async fn create_folder(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        let mut tx = self.conn.begin().await?;

        let node = Node::new(NodeKind::Folder, name, parent_id);
        store::create_node(&mut tx, &node).await?;
        store::create_metadata(&mut tx, &NodeMetadata::new(node.id, serde_json::json!({}))).await?;

        tx.commit().await?;
        self.dirty = true;

        Ok(node.id)
    }

    pub(crate) async fn create_manuscript_entry(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        self.create_entry(
            name,
            parent_id,
            NodeKind::Manuscript,
            NodeKind::ManuscriptEntry,
        )
        .await
    }

    pub(crate) async fn create_wiki_entry(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        self.create_entry(name, parent_id, NodeKind::Wiki, NodeKind::WikiEntry)
            .await
    }

    async fn create_entry(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
        parent_kind: NodeKind,
        entry_kind: NodeKind,
    ) -> KazmasResult<Uuid> {
        let mut tx = self.conn.begin().await?;

        let parent_id = match parent_id {
            Some(parent_id) => Some(parent_id),
            None => Some(store::get_node_by_kind(&mut tx, parent_kind).await?.id),
        };
        let node = Node::new(entry_kind, name, parent_id);

        store::create_node(&mut tx, &node).await?;
        store::create_metadata(&mut tx, &NodeMetadata::new(node.id, serde_json::json!({}))).await?;
        store::create_document(&mut tx, &Document::new(node.id, serde_json::json!({}))).await?;

        tx.commit().await?;
        self.dirty = true;

        Ok(node.id)
    }

    pub(crate) async fn update_node(&mut self, node: &Node) -> KazmasResult<bool> {
        let updated = store::update_node(&mut self.conn, node).await?;
        if updated {
            self.dirty = true;
        }
        Ok(updated)
    }

    pub(crate) async fn update_metadata(&mut self, metadata: &NodeMetadata) -> KazmasResult<bool> {
        let mut tx = self.conn.begin().await?;
        let updated = store::update_metadata(&mut tx, metadata).await?;
        if !updated {
            tx.rollback().await?;
            return Ok(false);
        }

        let node_updated = store::update_node_modified_at(&mut tx, metadata.node_id).await?;
        tx.commit().await?;
        if node_updated {
            self.dirty = true;
        }
        Ok(node_updated)
    }

    pub(crate) async fn update_document(&mut self, document: &Document) -> KazmasResult<bool> {
        let mut tx = self.conn.begin().await?;
        let updated = store::update_document(&mut tx, document).await?;
        if !updated {
            tx.rollback().await?;
            return Ok(false);
        }

        let node_updated = store::update_node_modified_at(&mut tx, document.node_id).await?;
        tx.commit().await?;
        if node_updated {
            self.dirty = true;
        }
        Ok(node_updated)
    }

    pub(crate) async fn delete_node(&mut self, id: Uuid) -> KazmasResult<bool> {
        let deleted = store::delete_node(&mut self.conn, id).await?;
        if deleted {
            self.dirty = true;
        }
        Ok(deleted)
    }

    pub(crate) async fn restore_node(&mut self, id: Uuid) -> KazmasResult<bool> {
        let restored = store::restore_node(&mut self.conn, id).await?;
        if restored {
            self.dirty = true;
        }
        Ok(restored)
    }

    pub(crate) async fn purge_node(&mut self, id: Uuid) -> KazmasResult<bool> {
        let purged = store::purge_node(&mut self.conn, id).await?;
        if purged {
            self.dirty = true;
        }
        Ok(purged)
    }
}

fn create_package_path(name: &str, path: impl AsRef<Path>) -> PathBuf {
    path.as_ref().join(format!("{name}.{EXTENSION}"))
}

async fn create_workspace_path(id: Uuid, path: impl AsRef<Path>) -> KazmasResult<PathBuf> {
    let path = path
        .as_ref()
        .join(id.simple().to_string())
        .join(Uuid::now_v7().simple().to_string());
    fs::create_dir_all(&path).await?;
    Ok(path)
}

async fn create_world_url(
    manifest: &WorldManifest,
    path: impl AsRef<Path>,
) -> KazmasResult<PathBuf> {
    let path = path.as_ref().join(manifest.world_path());
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await?;
    }
    Ok(path)
}

async fn create_assets_dir(
    manifest: &WorldManifest,
    path: impl AsRef<Path>,
) -> KazmasResult<PathBuf> {
    let path = path.as_ref().join(manifest.assets_path());
    fs::create_dir_all(&path).await?;
    Ok(path)
}

async fn seed_world_nodes(
    conn: &mut SqliteConnection,
    manifest: &WorldManifest,
) -> KazmasResult<()> {
    let mut tx = conn.begin().await?;

    let mut world = Node::new(NodeKind::World, Some(&manifest.name), None);
    world.id = manifest.id;
    let manuscript = Node::new(NodeKind::Manuscript, Some("Manuscript"), Some(world.id));
    let wiki = Node::new(NodeKind::Wiki, Some("Wiki"), Some(world.id));

    for node in [&world, &manuscript, &wiki] {
        store::create_node(&mut tx, node).await?;
        store::create_metadata(&mut tx, &NodeMetadata::new(node.id, serde_json::json!({}))).await?;
    }

    tx.commit().await?;
    Ok(())
}
