use std::{path::Path, time::Duration};

use sqlx::{
    Connection, SqlSafeStr, SqliteConnection,
    sqlite::{SqliteConnectOptions, SqliteJournalMode},
};

use crate::app::{KazmasError, KazmasResult};

const APPLICATION_ID: i64 = 0x4B5A4D53;
const USER_VERSION: i64 = 0;

const BUSY_TIMEOUT: u64 = 5;

const PRAGMA_APPLICATION_ID: &str = "PRAGMA application_id;";
const PRAGMA_USER_VERSION: &str = "PRAGMA user_version;";
const CHECKPOINT_WAL: &str = "PRAGMA wal_checkpoint(TRUNCATE);";

const SCHEMA_SQL: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/resources/sql/schema.sql"
));

pub(super) async fn open_database(url: impl AsRef<Path>) -> KazmasResult<SqliteConnection> {
    let options = SqliteConnectOptions::default()
        .filename(url)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal)
        .busy_timeout(Duration::from_secs(BUSY_TIMEOUT))
        .create_if_missing(true);

    let conn = SqliteConnection::connect_with(&options).await?;
    Ok(conn)
}

pub(super) async fn initialize_schema(conn: &mut SqliteConnection) -> KazmasResult<()> {
    sqlx::query(SCHEMA_SQL).execute(conn).await?;
    Ok(())
}

pub(super) async fn validate_database(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let application_id = read_scalar(conn, PRAGMA_APPLICATION_ID).await?;
    let user_version = read_scalar(conn, PRAGMA_USER_VERSION).await?;

    if application_id != APPLICATION_ID {
        return Err(KazmasError::Invalid(format!(
            "unexpected application id {application_id}"
        )));
    }

    if user_version > USER_VERSION {
        return Err(KazmasError::Invalid(format!(
            "unsupported user version {user_version}"
        )));
    }

    if user_version < USER_VERSION {
        // TODO: migrate schema
    }

    Ok(())
}

async fn read_scalar(conn: &mut SqliteConnection, statement: impl SqlSafeStr) -> KazmasResult<i64> {
    let (value,) = sqlx::query_as(statement).fetch_one(conn).await?;
    Ok(value)
}

pub(super) async fn checkpoint_wal(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let (busy, log, checkpointed) = sqlx::query_as::<_, (i64, i64, i64)>(CHECKPOINT_WAL)
        .fetch_one(conn)
        .await?;
    if busy > 0 || checkpointed < log {
        return Err(KazmasError::Invalid(format!(
            "WAL checkpoint incomplete: busy={busy}, log={log}, checkpointed={checkpointed}"
        )));
    }

    Ok(())
}

pub(super) async fn close_database(conn: SqliteConnection) -> KazmasResult<()> {
    conn.close().await?;
    Ok(())
}
