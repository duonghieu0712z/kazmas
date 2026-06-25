use std::path::{Path, PathBuf};

use sqlx::SqliteConnection;
use tokio::fs;
use uuid::Uuid;

use super::{
    archive::{pack_world, unpack_world},
    manifest::{WorldManifest, read_manifest, write_manifest},
};
use crate::{
    app::{KazmasError, KazmasResult},
    database::{
        checkpoint_wal, close_database, initialize_schema, open_database, validate_database,
    },
    model::{Document, Node, NodeKind, NodeMetadata},
    store::{
        create_document, create_metadata, create_node, delete_node, get_document, get_metadata,
        get_node, purge_node, restore_node, update_document, update_metadata, update_node,
    },
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

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir).await?;
        write_manifest(&manifest, &workspace_path).await?;
        create_assets_dir(&manifest, &workspace_path).await?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = open_database(world_db).await?;
        initialize_schema(&mut conn).await?;

        checkpoint_wal(&mut conn).await?;
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

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir).await?;
        unpack_world(&package_path, &workspace_path)?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = open_database(world_db).await?;
        validate_database(&mut conn).await?;

        checkpoint_wal(&mut conn).await?;
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
        checkpoint_wal(&mut self.conn).await?;

        self.manifest.modify();
        write_manifest(&self.manifest, &self.workspace).await?;

        pack_world(&self.workspace, &self.package)?;
        self.dirty = false;
        Ok(())
    }

    pub(crate) async fn close_world(self) -> KazmasResult<()> {
        close_database(self.conn).await?;
        fs::remove_dir_all(&self.workspace).await?;
        Ok(())
    }

    pub(crate) async fn get_node(&mut self, id: &Uuid) -> KazmasResult<Node> {
        get_node(&mut self.conn, id).await
    }

    pub(crate) async fn get_metadata(&mut self, node_id: &Uuid) -> KazmasResult<NodeMetadata> {
        get_metadata(&mut self.conn, node_id).await
    }

    pub(crate) async fn get_document(&mut self, node_id: &Uuid) -> KazmasResult<Document> {
        get_document(&mut self.conn, node_id).await
    }

    async fn create_node(
        &mut self,
        name: Option<&str>,
        kind: NodeKind,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        let node = Node::new(kind, name, parent_id);
        create_node(&mut self.conn, &node).await?;
        create_metadata(
            &mut self.conn,
            &NodeMetadata::new(node.id, serde_json::json!({})),
        )
        .await?;
        Ok(node.id)
    }

    pub(crate) async fn create_folder(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        self.create_node(name, NodeKind::Folder, parent_id).await
    }

    pub(crate) async fn create_chapter(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        let id = self.create_node(name, NodeKind::Chapter, parent_id).await?;
        create_document(&mut self.conn, &Document::new(id, serde_json::json!({}))).await?;
        Ok(id)
    }

    pub(crate) async fn create_wiki_entry(
        &mut self,
        name: Option<&str>,
        parent_id: Option<Uuid>,
    ) -> KazmasResult<Uuid> {
        let id = self
            .create_node(name, NodeKind::WikiEntry, parent_id)
            .await?;
        create_document(&mut self.conn, &Document::new(id, serde_json::json!({}))).await?;
        Ok(id)
    }

    pub(crate) async fn update_node(&mut self, node: &Node) -> KazmasResult<bool> {
        update_node(&mut self.conn, node).await
    }

    pub(crate) async fn update_metadata(&mut self, metadata: &NodeMetadata) -> KazmasResult<bool> {
        update_metadata(&mut self.conn, metadata).await
    }

    pub(crate) async fn update_document(&mut self, document: &Document) -> KazmasResult<bool> {
        update_document(&mut self.conn, document).await
    }

    pub(crate) async fn delete_node(&mut self, id: &Uuid) -> KazmasResult<bool> {
        delete_node(&mut self.conn, id).await
    }

    pub(crate) async fn restore_node(&mut self, id: &Uuid) -> KazmasResult<bool> {
        restore_node(&mut self.conn, id).await
    }

    pub(crate) async fn purge_node(&mut self, id: &Uuid) -> KazmasResult<bool> {
        purge_node(&mut self.conn, id).await
    }
}

fn create_package_path(name: &str, path: impl AsRef<Path>) -> PathBuf {
    path.as_ref().join(format!("{name}.{EXTENSION}"))
}

async fn create_workspace_path(id: &Uuid, path: impl AsRef<Path>) -> KazmasResult<PathBuf> {
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
