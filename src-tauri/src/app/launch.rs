use std::{
    env,
    path::{Path, PathBuf},
};

use tauri::{AppHandle, Manager, RunEvent, async_runtime::spawn};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

use super::{
    error::KazmasResult,
    window::{focus_existing_world, focus_window, open_project_in_window, spawn_window},
};
use crate::{
    state::get_state,
    utils::{app_temp_dir, current_window},
    world::{WorldProject, is_world_path},
};

pub(crate) async fn open_initial_windows(app: &AppHandle) -> KazmasResult<()> {
    let paths = launch_world_paths(
        env::args().collect(),
        env::current_dir().unwrap_or_default(),
    );
    let opened = open_world_paths(app, paths).await;

    if !opened {
        spawn_window(app, None).await?;
    }

    Ok(())
}

pub(crate) fn handle_single_instance_launch(app: &AppHandle, args: Vec<String>, cwd: String) {
    let paths = launch_world_paths(args, cwd);
    handle_world_paths(app, paths);
}

#[cfg(target_os = "macos")]
pub(crate) fn run_event_handler() -> impl FnMut(&AppHandle, RunEvent) {
    let mut pending = Some(Vec::new());
    move |app, event| match event {
        RunEvent::Ready => {
            if let Some(paths) = pending.take()
                && !paths.is_empty()
            {
                handle_world_paths(app, paths);
            }
        },
        RunEvent::Opened { urls } => {
            let paths = opened_world_paths(urls);
            if let Some(pending) = &mut pending {
                pending.extend(paths);
            } else {
                handle_world_paths(app, paths);
            }
        },
        _ => {},
    }
}

#[cfg(not(target_os = "macos"))]
pub(crate) fn run_event_handler() -> impl FnMut(&AppHandle, RunEvent) {
    |_, _| {}
}

#[cfg(any(target_os = "macos", test))]
fn opened_world_paths(urls: Vec<tauri::Url>) -> Vec<PathBuf> {
    urls.into_iter()
        .filter_map(|url| url.to_file_path().ok())
        .filter(|path| is_world_path(path))
        .collect()
}

fn handle_world_paths(app: &AppHandle, paths: Vec<PathBuf>) {
    let app = app.clone();
    spawn(async move {
        if !open_world_paths(&app, paths).await
            && let Err(error) = focus_existing_window(&app).await
        {
            log::error!("{error}");
        }
    });
}

async fn open_world_paths(app: &AppHandle, paths: Vec<PathBuf>) -> bool {
    let mut opened = false;
    let mut errors = Vec::new();
    for path in paths {
        match open_world_path(app, &path).await {
            Ok(()) => opened = true,
            Err(error) => {
                log::error!("failed to open {}: {error}", path.display());
                errors.push(format!("{}\n{error}", path.display()));
            },
        }
    }

    if !errors.is_empty() {
        app.dialog()
            .message(errors.join("\n\n"))
            .title("Unable to Open World")
            .kind(MessageDialogKind::Error)
            .show(|_| {});
    }

    opened
}

async fn focus_existing_window(app: &AppHandle) -> KazmasResult<()> {
    let state = get_state(app);
    let registry = state.registry();

    let window_id = registry.focused_window().await;
    if let Some(window) = current_window(app, window_id) {
        focus_window(&window)?;
        return Ok(());
    }

    if let Some(window) = app.webview_windows().into_values().next() {
        focus_window(&window)?;
    }

    Ok(())
}

async fn open_world_path(app: &AppHandle, file: impl AsRef<Path>) -> KazmasResult<()> {
    let state = get_state(app);
    let project_manager = state.project_manager();

    if focus_existing_world(app, &file).await? {
        return Ok(());
    }

    let temp_dir = app_temp_dir(app).await?;
    let project = WorldProject::open_world(&file, &temp_dir).await?;
    let project_id = project.id();
    let empty_window_id = state.registry().empty_window().await;
    if let Some(window) = current_window(app, empty_window_id) {
        let name = project.manifest().name;
        open_project_in_window(app, state, empty_window_id, project, false).await?;
        window.set_title(&name)?;
        window.reload()?;
        focus_window(&window)?;
        return Ok(());
    }

    project_manager
        .open_project_or_close(project, async { spawn_window(app, Some(project_id)).await })
        .await?;

    Ok(())
}

fn launch_world_paths(args: Vec<String>, cwd: impl AsRef<Path>) -> Vec<PathBuf> {
    let cwd = cwd.as_ref();
    args.into_iter()
        .skip(1)
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

#[cfg(test)]
#[path = "launch_tests.rs"]
mod tests;
