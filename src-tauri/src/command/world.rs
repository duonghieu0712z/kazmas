use tauri::State;

use super::error::CommandResult;
use crate::{
    app::{self, AppState},
    dto::WorldDto,
    world::{WorldManifest, WorldProject, create_package_path, create_workspace_path},
};

#[tauri::command]
#[specta::specta]
pub(super) fn create_world(
    state: State<'_, AppState>,
    name: &str,
    path: &str,
) -> CommandResult<WorldDto> {
    let manifest = WorldManifest::new(name);
    let package_path = create_package_path(name, path);
    let workspace_path = create_workspace_path(&manifest.id, path)?;

    {
        let mut project = app::lock_mutex(&state.project)?;
        *project = Some(WorldProject {
            manifest: manifest.clone(),
            package: package_path,
            workspace: workspace_path,
        });
    }

    if let Some(project) = app::lock_mutex(&state.project)?.as_ref() {
        log::debug!("package path: {}", project.package.display());
        log::debug!("workspace path: {}", project.workspace.display());
    }

    Ok(manifest.into())
}
