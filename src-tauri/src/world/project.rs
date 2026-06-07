use std::path::{Path, PathBuf};

use sqlx::SqliteConnection;
use tokio::fs;
use uuid::Uuid;

use super::{
    archive::{pack_world, unpack_world},
    db::{checkpoint_wal, close_database, initialize_schema, open_database, validate_database},
    manifest::{WorldManifest, read_manifest, write_manifest},
};
use crate::app::KazmasResult;

const EXTENSION: &str = "kazmas";

#[derive(Debug)]
pub(crate) struct WorldProject {
    manifest: WorldManifest,
    conn: SqliteConnection,

    package: PathBuf,
    workspace: PathBuf,
}

impl WorldProject {
    pub(crate) fn manifest(&self) -> WorldManifest {
        self.manifest.clone()
    }

    pub(crate) async fn create_world(
        name: &str,
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let manifest = WorldManifest::new(name);
        let package_path = create_package_path(name, path);

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir).await?;
        write_manifest(&manifest, &workspace_path).await?;
        create_assets_dir(&manifest, &workspace_path).await?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = open_database(world_db).await?;
        initialize_schema(&mut conn).await?;

        pack_world(&workspace_path, &package_path)?;

        Ok(Self {
            manifest,
            conn,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) async fn open_world(
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let package_path = path.as_ref().to_path_buf();
        let manifest = read_manifest(&package_path)?;

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir).await?;
        unpack_world(&package_path, &workspace_path)?;

        let world_db = create_world_url(&manifest, &workspace_path).await?;
        let mut conn = open_database(world_db).await?;
        validate_database(&mut conn).await?;

        Ok(Self {
            manifest,
            conn,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) async fn save_world(&mut self) -> KazmasResult<()> {
        checkpoint_wal(&mut self.conn).await?;
        pack_world(&self.workspace, &self.package)
    }

    pub(crate) async fn close_world(self) -> KazmasResult<()> {
        close_database(self.conn).await?;
        fs::remove_dir_all(&self.workspace).await?;
        Ok(())
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
