use sqlx::{AssertSqlSafe, Connection, SqlSafeStr, Sqlite, SqliteConnection, Transaction};

use super::validation::{SchemaKind, inspect_schema};
use crate::app::{KazmasError, KazmasResult};

const APPLICATION_ID: i64 = 0x4B5A_4D53; // KZMS
const USER_VERSION: i64 = 1;

const PRAGMA_APPLICATION_ID: &str = "PRAGMA application_id;";
const PRAGMA_USER_VERSION: &str = "PRAGMA user_version;";

const BEGIN_IMMEDIATE: &str = "BEGIN IMMEDIATE;";

pub(super) const SCHEMA_SQL: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/resources/sql/schema.sql"
));

pub(crate) async fn prepare_database(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let application_id = read_scalar(conn, PRAGMA_APPLICATION_ID).await?;
    let user_version = read_scalar(conn, PRAGMA_USER_VERSION).await?;

    if application_id != 0 && application_id != APPLICATION_ID {
        return Err(KazmasError::Invalid(format!(
            "unexpected application id {application_id}"
        )));
    }

    if user_version > USER_VERSION {
        return Err(KazmasError::Invalid(format!(
            "unsupported user version {user_version}"
        )));
    }

    let schema_kind = inspect_schema(conn).await?;
    match (application_id, user_version, schema_kind) {
        (0, 0, SchemaKind::Empty) => initialize_schema(conn).await,
        (0 | APPLICATION_ID, 0, SchemaKind::Current) => upgrade_schema_metadata(conn).await,
        (APPLICATION_ID, USER_VERSION, SchemaKind::Current) => Ok(()),
        (_, _, SchemaKind::Empty) => Err(KazmasError::Invalid(
            "database schema is empty but metadata is set".to_owned(),
        )),
        _ => Err(KazmasError::Invalid(
            "database schema is not a recognized Kazmas schema".to_owned(),
        )),
    }
}

async fn initialize_schema(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let mut tx = conn.begin_with(BEGIN_IMMEDIATE).await?;
    sqlx::raw_sql(SCHEMA_SQL).execute(&mut *tx).await?;
    write_metadata(&mut tx).await?;
    tx.commit().await?;
    Ok(())
}

async fn upgrade_schema_metadata(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let mut tx = conn.begin_with(BEGIN_IMMEDIATE).await?;
    write_metadata(&mut tx).await?;
    tx.commit().await?;
    Ok(())
}

async fn write_metadata(tx: &mut Transaction<'_, Sqlite>) -> KazmasResult<()> {
    let application_id = format!("PRAGMA application_id = {APPLICATION_ID};");
    let user_version = format!("PRAGMA user_version = {USER_VERSION};");

    sqlx::query(AssertSqlSafe(application_id))
        .execute(&mut **tx)
        .await?;
    sqlx::query(AssertSqlSafe(user_version))
        .execute(&mut **tx)
        .await?;
    Ok(())
}

async fn read_scalar(conn: &mut SqliteConnection, statement: impl SqlSafeStr) -> KazmasResult<i64> {
    let (value,) = sqlx::query_as(statement).fetch_one(conn).await?;
    Ok(value)
}
