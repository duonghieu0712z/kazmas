use std::{
    env,
    path::{Path, PathBuf},
};

use tauri::{AppHandle, Manager, async_runtime::spawn};

use super::{
    error::KazmasResult,
    window::{focus_existing_world, focus_window, spawn_window},
};
use crate::{
    state::get_state,
    utils::{app_temp_dir, window_label},
    world::{EXTENSION, WorldProject},
};

pub(crate) async fn open_initial_windows(app: &AppHandle) -> KazmasResult<()> {
    let mut opened = false;
    let paths = launch_world_paths(
        env::args().collect(),
        env::current_dir().unwrap_or_default(),
    );

    for path in paths {
        match open_world_path(app, path).await {
            Ok(()) => opened = true,
            Err(error) => log::error!("{error}"),
        }
    }

    if !opened {
        spawn_window(app, None).await?;
    }

    Ok(())
}

pub(crate) fn handle_single_instance_launch(app: &AppHandle, args: Vec<String>, cwd: String) {
    let paths = launch_world_paths(args, cwd);
    let app = app.clone();

    spawn(async move {
        if paths.is_empty() {
            if let Err(error) = focus_existing_window(&app).await {
                log::error!("{error}");
            }
            return;
        }

        for path in paths {
            if let Err(error) = open_world_path(&app, path).await {
                log::error!("{error}");
            }
        }
    });
}

async fn focus_existing_window(app: &AppHandle) -> KazmasResult<()> {
    let state = get_state(app);
    let registry = state.registry();

    if let Some(window_id) = registry.focused_window().await {
        let label = window_label(&window_id);
        if let Some(window) = app.get_webview_window(&label) {
            focus_window(&window)?;
            return Ok(());
        }
    }

    if let Some(window) = app.webview_windows().into_values().next() {
        focus_window(&window)?;
    }

    Ok(())
}

async fn open_world_path(app: &AppHandle, file: PathBuf) -> KazmasResult<()> {
    let state = get_state(app);
    let project_manager = state.project_manager();

    let Some(manifest) = focus_existing_world(app, &file).await? else {
        return Ok(());
    };

    let temp_dir = app_temp_dir(app).await?;
    let project = WorldProject::open_world(&file, &temp_dir).await?;
    project_manager
        .open_project_or_close(project, async {
            spawn_window(app, Some(&manifest.id)).await
        })
        .await?;

    Ok(())
}

fn launch_world_paths(args: Vec<String>, cwd: impl AsRef<Path>) -> Vec<PathBuf> {
    let cwd = cwd.as_ref();
    args.into_iter()
        .filter(|arg| !arg.starts_with('-'))
        .map(PathBuf::from)
        .map(|path| {
            if path.is_absolute() {
                path
            } else {
                cwd.join(path)
            }
        })
        .filter(|path| is_world_path(path))
        .collect()
}

fn is_world_path(path: &Path) -> bool {
    path.extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case(EXTENSION))
}
