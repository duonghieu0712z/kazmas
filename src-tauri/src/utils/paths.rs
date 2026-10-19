use std::path::PathBuf;

use tauri::{AppHandle, Manager};
use tokio::fs;

use crate::app::KazmasResult;

pub(crate) async fn app_temp_dir(app: &AppHandle) -> KazmasResult<PathBuf> {
    let path = app.path().temp_dir()?.join(&app.config().identifier);
    fs::create_dir_all(&path).await?;
    Ok(path)
}
