use std::{fs, path::Path};

use sqlx::SqliteConnection;
use tempfile::TempDir;

use crate::{app::KazmasResult, database};

pub(crate) type TestResult = Result<(), Box<dyn std::error::Error>>;

pub(crate) fn temp_dir() -> std::io::Result<TempDir> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../.artifacts/rust");
    fs::create_dir_all(&root)?;
    tempfile::Builder::new().prefix("run-").tempdir_in(root)
}

pub(crate) async fn database(path: &Path) -> KazmasResult<SqliteConnection> {
    let mut conn = database::open_database(path).await?;
    database::prepare_database(&mut conn).await?;
    Ok(conn)
}
