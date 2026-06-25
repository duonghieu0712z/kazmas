use sqlx::{SqlSafeStr, SqliteConnection};

use crate::app::{KazmasError, KazmasResult};

const APPLICATION_ID: i64 = 0x4B5A4D53;
const USER_VERSION: i64 = 0;

const PRAGMA_APPLICATION_ID: &str = "PRAGMA application_id;";
const PRAGMA_USER_VERSION: &str = "PRAGMA user_version;";

const SCHEMA_SQL: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/resources/sql/schema.sql"
));

pub(crate) async fn initialize_schema(conn: &mut SqliteConnection) -> KazmasResult<()> {
    sqlx::query(SCHEMA_SQL).execute(conn).await?;
    Ok(())
}

pub(crate) async fn validate_database(conn: &mut SqliteConnection) -> KazmasResult<()> {
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
