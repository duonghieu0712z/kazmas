use std::{
    fs,
    path::{Path, PathBuf},
};

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

pub(crate) fn create_package_path(name: &str, path: impl AsRef<Path>) -> PathBuf {
    path.as_ref().join(format!("{name}.{EXTENSION}"))
}

pub(crate) fn create_workspace_path(id: &Uuid, path: impl AsRef<Path>) -> KazmasResult<PathBuf> {
    let path = path
        .as_ref()
        .join(id.simple().to_string())
        .join(Uuid::now_v7().simple().to_string());
    fs::create_dir_all(&path)?;
    Ok(path)
}
