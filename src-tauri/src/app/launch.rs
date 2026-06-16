use std::{
    env,
    path::{Path, PathBuf},
};

use tauri::{AppHandle, async_runtime::spawn};

use super::{KazmasResult, focus_existing_window, open_world_path, spawn_window};
use crate::world::EXTENSION;

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
