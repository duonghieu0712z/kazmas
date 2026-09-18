use sqlx::{AssertSqlSafe, Connection, SqlSafeStr, Sqlite, SqliteConnection, Transaction};

use crate::app::{KazmasError, KazmasResult};

const APPLICATION_ID: i64 = 0x4B5A_4D53; // KZMS
const USER_VERSION: i64 = 0;

const PRAGMA_APPLICATION_ID: &str = "PRAGMA application_id;";
const PRAGMA_USER_VERSION: &str = "PRAGMA user_version;";

const BEGIN_IMMEDIATE: &str = "BEGIN IMMEDIATE;";

const SELECT_SCHEMA_OBJECT_COUNT: &str = r"
SELECT COUNT(*)
FROM sqlite_schema
WHERE name NOT LIKE 'sqlite_%'
";

const SELECT_SCHEMA_OBJECTS: &str = r"
SELECT type, name, tbl_name
FROM sqlite_schema
WHERE name NOT LIKE 'sqlite_%'
ORDER BY type, name
";

const SELECT_TABLE_COLUMNS: &str = r"
SELECT name, type
FROM pragma_table_info(?)
ORDER BY cid
";

const SCHEMA_SQL: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/resources/sql/schema.sql"
));

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum SchemaKind {
    Empty,
    Current,
    Unknown,
}

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
        (0, USER_VERSION, SchemaKind::Empty) => initialize_current_schema(conn).await,
        (0, USER_VERSION, SchemaKind::Current) => claim_legacy_schema(conn).await,
        (APPLICATION_ID, USER_VERSION, SchemaKind::Current) => Ok(()),
        (_, _, SchemaKind::Empty) => Err(KazmasError::Invalid(
            "database schema is empty but metadata is set".to_owned(),
        )),
        _ => Err(KazmasError::Invalid(
            "database schema is not a recognized Kazmas schema".to_owned(),
        )),
    }
}

async fn initialize_current_schema(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let mut tx = conn.begin_with(BEGIN_IMMEDIATE).await?;
    sqlx::raw_sql(SCHEMA_SQL).execute(&mut *tx).await?;
    write_metadata(&mut tx).await?;
    tx.commit().await?;
    Ok(())
}

async fn claim_legacy_schema(conn: &mut SqliteConnection) -> KazmasResult<()> {
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

async fn inspect_schema(conn: &mut SqliteConnection) -> KazmasResult<SchemaKind> {
    let object_count: i64 = sqlx::query_scalar(SELECT_SCHEMA_OBJECT_COUNT)
        .fetch_one(&mut *conn)
        .await?;

    if object_count == 0 {
        return Ok(SchemaKind::Empty);
    }

    let expected_objects = [
        ("index", "idx_nodes_kind", "nodes"),
        ("index", "idx_nodes_parent_id", "nodes"),
        ("table", "documents", "documents"),
        ("table", "node_metadata", "node_metadata"),
        ("table", "nodes", "nodes"),
    ];
    let objects: Vec<(String, String, String)> = sqlx::query_as(SELECT_SCHEMA_OBJECTS)
        .fetch_all(&mut *conn)
        .await?;

    if objects.len() != expected_objects.len()
        || objects
            .iter()
            .zip(expected_objects)
            .any(|(actual, expected)| {
                actual.0 != expected.0 || actual.1 != expected.1 || actual.2 != expected.2
            })
    {
        return Ok(SchemaKind::Unknown);
    }

    let nodes = read_columns(&mut *conn, "nodes").await?;
    let metadata = read_columns(&mut *conn, "node_metadata").await?;
    let documents = read_columns(&mut *conn, "documents").await?;

    let is_current = nodes
        == [
            ("id".to_owned(), "BLOB".to_owned()),
            ("parent_id".to_owned(), "BLOB".to_owned()),
            ("kind".to_owned(), "TEXT".to_owned()),
            ("name".to_owned(), "TEXT".to_owned()),
            ("created_at".to_owned(), "INTEGER".to_owned()),
            ("modified_at".to_owned(), "INTEGER".to_owned()),
            ("deleted_at".to_owned(), "INTEGER".to_owned()),
        ]
        && metadata
            == [
                ("node_id".to_owned(), "BLOB".to_owned()),
                ("data".to_owned(), "BLOB".to_owned()),
            ]
        && documents
            == [
                ("node_id".to_owned(), "BLOB".to_owned()),
                ("content".to_owned(), "BLOB".to_owned()),
            ];

    Ok(if is_current {
        SchemaKind::Current
    } else {
        SchemaKind::Unknown
    })
}

async fn read_columns(
    conn: &mut SqliteConnection,
    table: &str,
) -> KazmasResult<Vec<(String, String)>> {
    let columns = sqlx::query_as(SELECT_TABLE_COLUMNS)
        .bind(table)
        .fetch_all(conn)
        .await?;
    Ok(columns)
}

async fn read_scalar(conn: &mut SqliteConnection, statement: impl SqlSafeStr) -> KazmasResult<i64> {
    let (value,) = sqlx::query_as(statement).fetch_one(conn).await?;
    Ok(value)
}
