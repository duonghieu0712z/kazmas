use std::{
    fs,
    path::{Path, PathBuf},
};

use uuid::Uuid;

use super::{
    archive::{pack_world, unpack_world},
    manifest::{WorldManifest, read_manifest, write_manifest},
};
use crate::app::KazmasResult;

const EXTENSION: &str = "kazmas";

#[derive(Debug)]
pub(crate) struct WorldProject {
    pub(crate) manifest: WorldManifest,

    pub(crate) package: PathBuf,
    pub(crate) workspace: PathBuf,
}

impl WorldProject {
    pub(crate) fn create_world(
        name: &str,
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let manifest = WorldManifest::new(name);
        let package_path = create_package_path(name, path);

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir)?;

        write_manifest(&manifest, &workspace_path)?;
        create_assets_dir(&manifest, &workspace_path)?;
        pack_world(&workspace_path, &package_path)?;

        Ok(Self {
            manifest,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) fn open_world(
        path: impl AsRef<Path>,
        temp_dir: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let package_path = path.as_ref().to_path_buf();
        let manifest = read_manifest(&package_path)?;

        let workspace_path = create_workspace_path(&manifest.id, &temp_dir)?;

        unpack_world(&package_path, &workspace_path)?;

        Ok(Self {
            manifest,
            package: package_path,
            workspace: workspace_path,
        })
    }

    pub(crate) fn save_world(&self) -> KazmasResult<()> {
        pack_world(&self.workspace, &self.package)
    }
}

fn create_package_path(name: &str, path: impl AsRef<Path>) -> PathBuf {
    path.as_ref().join(format!("{name}.{EXTENSION}"))
}

fn create_workspace_path(id: &Uuid, path: impl AsRef<Path>) -> KazmasResult<PathBuf> {
    let path = path
        .as_ref()
        .join(id.simple().to_string())
        .join(Uuid::now_v7().simple().to_string());
    fs::create_dir_all(&path)?;
    Ok(path)
}

fn create_assets_dir(manifest: &WorldManifest, path: impl AsRef<Path>) -> KazmasResult<PathBuf> {
    let path = path.as_ref().join(manifest.assets_path());
    fs::create_dir_all(&path)?;
    Ok(path)
}
