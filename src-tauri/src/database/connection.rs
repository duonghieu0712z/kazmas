use std::{path::Path, time::Duration};

use sqlx::{
    Connection, SqliteConnection,
    sqlite::{SqliteConnectOptions, SqliteJournalMode},
};

use crate::app::KazmasResult;

const BUSY_TIMEOUT: u64 = 5;

pub(crate) async fn open_database(url: impl AsRef<Path>) -> KazmasResult<SqliteConnection> {
    let options = SqliteConnectOptions::default()
        .filename(url)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal)
        .busy_timeout(Duration::from_secs(BUSY_TIMEOUT))
        .create_if_missing(true);

    let conn = SqliteConnection::connect_with(&options).await?;
    Ok(conn)
}

pub(crate) async fn close_database(conn: SqliteConnection) -> KazmasResult<()> {
    conn.close().await?;
    Ok(())
}
