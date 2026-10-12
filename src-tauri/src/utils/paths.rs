use std::path::PathBuf;

use tauri::{AppHandle, Manager};
use tokio::fs;

use crate::app::KazmasResult;

pub(crate) async fn app_temp_dir(app: &AppHandle) -> KazmasResult<PathBuf> {
    #[cfg(feature = "desktop-tests")]
    if let Some(path) = std::env::var_os("KAZMAS_TEST_TEMP_DIR") {
        let path = PathBuf::from(path);
        if !path.is_absolute() {
            return Err(crate::app::KazmasError::Invalid(
                "test directory must be absolute".into(),
            ));
        }
        fs::create_dir_all(&path).await?;
        return Ok(path);
    }
    let path = app.path().temp_dir()?.join(&app.config().identifier);
    fs::create_dir_all(&path).await?;
    Ok(path)
}
