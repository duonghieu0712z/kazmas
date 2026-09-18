use sqlx::SqliteConnection;

use super::schema::SCHEMA_SQL;
use crate::app::KazmasResult;

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

const SELECT_TABLE_COLUMNS: &str = r#"
SELECT name, type, "notnull", dflt_value, pk
FROM pragma_table_info(?)
ORDER BY cid
"#;

const SELECT_TABLE_FOREIGN_KEYS: &str = r#"
SELECT id, seq, "table", "from", "to", on_update, on_delete, "match"
FROM pragma_foreign_key_list(?)
ORDER BY id, seq
"#;

const SELECT_INDEX_COLUMNS: &str = r"
SELECT seqno, cid, name
FROM pragma_index_info(?)
ORDER BY seqno
";

const SELECT_INDEX_PROPERTIES: &str = r#"
SELECT "unique", origin, partial
FROM pragma_index_list(?)
WHERE name = ?
"#;

const SELECT_SCHEMA_DEFINITION: &str = r"
SELECT sql
FROM sqlite_schema
WHERE name = ?
";

type ColumnDefinition = (String, String, i64, Option<String>, i64);
type ForeignKeyDefinition = (i64, i64, String, String, String, String, String, String);
type IndexColumnDefinition = (i64, i64, String);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum SchemaKind {
    Empty,
    Current,
    Unknown,
}

pub(super) async fn inspect_schema(conn: &mut SqliteConnection) -> KazmasResult<SchemaKind> {
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
            column("id", "BLOB", false, None, true),
            column("parent_id", "BLOB", false, None, false),
            column("kind", "TEXT", true, None, false),
            column("name", "TEXT", true, Some("'Untitled'"), false),
            column("created_at", "INTEGER", true, None, false),
            column("modified_at", "INTEGER", true, None, false),
            column("deleted_at", "INTEGER", false, None, false),
        ]
        && metadata
            == [
                column("node_id", "BLOB", false, None, true),
                column("data", "BLOB", true, None, false),
            ]
        && documents
            == [
                column("node_id", "BLOB", false, None, true),
                column("content", "BLOB", true, None, false),
            ]
        && foreign_keys_match(conn).await?
        && indexes_match(conn).await?
        && schema_definitions_match(conn).await?;

    Ok(if is_current {
        SchemaKind::Current
    } else {
        SchemaKind::Unknown
    })
}

async fn read_columns(
    conn: &mut SqliteConnection,
    table: &str,
) -> KazmasResult<Vec<ColumnDefinition>> {
    let columns = sqlx::query_as(SELECT_TABLE_COLUMNS)
        .bind(table)
        .fetch_all(conn)
        .await?;
    Ok(columns)
}

fn column(
    name: &str,
    data_type: &str,
    not_null: bool,
    default_value: Option<&str>,
    primary_key: bool,
) -> ColumnDefinition {
    (
        name.to_owned(),
        data_type.to_owned(),
        i64::from(not_null),
        default_value.map(str::to_owned),
        i64::from(primary_key),
    )
}

async fn foreign_keys_match(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    let nodes = read_foreign_keys(&mut *conn, "nodes").await?;
    let metadata = read_foreign_keys(&mut *conn, "node_metadata").await?;
    let documents = read_foreign_keys(&mut *conn, "documents").await?;

    Ok(nodes == [foreign_key("nodes", "parent_id", "id")]
        && metadata == [foreign_key("nodes", "node_id", "id")]
        && documents == [foreign_key("nodes", "node_id", "id")])
}

async fn read_foreign_keys(
    conn: &mut SqliteConnection,
    table: &str,
) -> KazmasResult<Vec<ForeignKeyDefinition>> {
    let foreign_keys = sqlx::query_as(SELECT_TABLE_FOREIGN_KEYS)
        .bind(table)
        .fetch_all(conn)
        .await?;
    Ok(foreign_keys)
}

fn foreign_key(table: &str, from: &str, to: &str) -> ForeignKeyDefinition {
    (
        0,
        0,
        table.to_owned(),
        from.to_owned(),
        to.to_owned(),
        "NO ACTION".to_owned(),
        "CASCADE".to_owned(),
        "NONE".to_owned(),
    )
}

async fn indexes_match(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    Ok(
        index_matches(conn, "nodes", "idx_nodes_parent_id", 1, "parent_id").await?
            && index_matches(conn, "nodes", "idx_nodes_kind", 2, "kind").await?,
    )
}

async fn index_matches(
    conn: &mut SqliteConnection,
    table: &str,
    index: &str,
    column_id: i64,
    column_name: &str,
) -> KazmasResult<bool> {
    let columns: Vec<IndexColumnDefinition> = sqlx::query_as(SELECT_INDEX_COLUMNS)
        .bind(index)
        .fetch_all(&mut *conn)
        .await?;
    let properties: Option<(i64, String, i64)> = sqlx::query_as(SELECT_INDEX_PROPERTIES)
        .bind(table)
        .bind(index)
        .fetch_optional(conn)
        .await?;

    Ok(columns == [(0, column_id, column_name.to_owned())]
        && properties == Some((0, "c".to_owned(), 0)))
}

async fn schema_definitions_match(conn: &mut SqliteConnection) -> KazmasResult<bool> {
    for name in [
        "nodes",
        "node_metadata",
        "documents",
        "idx_nodes_parent_id",
        "idx_nodes_kind",
    ] {
        let Some(expected) = expected_schema_definition(name) else {
            return Ok(false);
        };
        let actual: Option<String> = sqlx::query_scalar(SELECT_SCHEMA_DEFINITION)
            .bind(name)
            .fetch_optional(&mut *conn)
            .await?;

        if actual.is_none_or(|actual| normalize_sql(&actual) != normalize_sql(expected)) {
            return Ok(false);
        }
    }

    Ok(true)
}

fn expected_schema_definition(name: &str) -> Option<&str> {
    let prefix = match name {
        "nodes" => "CREATE TABLE IF NOT EXISTS nodes ",
        "node_metadata" => "CREATE TABLE IF NOT EXISTS node_metadata ",
        "documents" => "CREATE TABLE IF NOT EXISTS documents ",
        "idx_nodes_parent_id" => "CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ",
        "idx_nodes_kind" => "CREATE INDEX IF NOT EXISTS idx_nodes_kind ",
        _ => return None,
    };

    SCHEMA_SQL
        .split(';')
        .map(str::trim)
        .find(|statement| statement.starts_with(prefix))
}

fn normalize_sql(sql: &str) -> String {
    sql.trim()
        .trim_end_matches(';')
        .replace("IF NOT EXISTS ", "")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}
