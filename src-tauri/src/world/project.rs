use std::{
    fs,
    path::{Path, PathBuf},
};

use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

use super::manifest::WorldManifest;
use crate::app::KazmasResult;

const EXTENSION: &str = "kazmas";

#[derive(Debug)]
pub(crate) struct WorldProject {
    pub(crate) manifest: WorldManifest,

    pub(crate) package: PathBuf,
    pub(crate) workspace: PathBuf,
}

impl WorldProject {
    pub(crate) fn create_world<R: Runtime>(
        app: &AppHandle<R>,
        name: &str,
        path: impl AsRef<Path>,
    ) -> KazmasResult<Self> {
        let manifest = WorldManifest::new(name);
        let package_path = create_package_path(name, path);

        let temp_dir = app.path().temp_dir()?;
        let workspace_path = create_workspace_path(&manifest.id, temp_dir)?;

        Ok(Self {
            manifest,
            package: package_path,
            workspace: workspace_path,
        })
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
