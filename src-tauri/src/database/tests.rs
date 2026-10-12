use super::{
    close_database, open_database, prepare_database,
    validation::{SchemaKind, inspect_schema},
};
use crate::test_support::{TestResult, temp_dir};

#[tokio::test]
async fn initializes_empty_database_and_preserves_existing_data() -> TestResult {
    let dir = temp_dir()?;
    let path = dir.path().join("world.db");
    let mut conn = open_database(&path).await?;
    assert_eq!(inspect_schema(&mut conn).await?, SchemaKind::Empty);
    prepare_database(&mut conn).await?;
    assert_eq!(inspect_schema(&mut conn).await?, SchemaKind::Current);
    let id: i64 = sqlx::query_scalar("PRAGMA application_id")
        .fetch_one(&mut conn)
        .await?;
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(id, 0x4B5A_4D53);
    assert_eq!(version, 1);
    let node = crate::model::Node::new(crate::model::NodeKind::Folder, Some("Saved folder"), None);
    crate::store::create_node(&mut conn, &node).await?;
    prepare_database(&mut conn).await?;
    close_database(conn).await?;
    let mut reopened = open_database(path).await?;
    prepare_database(&mut reopened).await?;
    assert_eq!(
        crate::store::get_node(&mut reopened, node.id).await?.name,
        "Saved folder"
    );
    close_database(reopened).await?;
    Ok(())
}

#[tokio::test]
async fn recognizes_legacy_schema_without_losing_rows() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = open_database(dir.path().join("legacy.db")).await?;
    sqlx::raw_sql(super::schema::SCHEMA_SQL)
        .execute(&mut conn)
        .await?;
    prepare_database(&mut conn).await?;
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut conn)
        .await?;
    assert_eq!(version, 1);
    close_database(conn).await?;
    Ok(())
}

#[tokio::test]
async fn rejects_foreign_future_and_unrecognized_databases() -> TestResult {
    let dir = temp_dir()?;
    for (index, sql) in [
        "PRAGMA application_id = 42",
        "PRAGMA user_version = 2",
        "PRAGMA application_id = 1264209235",
        "CREATE TABLE unrelated (id INTEGER)",
    ]
    .iter()
    .enumerate()
    {
        let mut conn = open_database(dir.path().join(format!("invalid-{index}.db"))).await?;
        sqlx::raw_sql(*sql).execute(&mut conn).await?;
        assert!(prepare_database(&mut conn).await.is_err());
        close_database(conn).await?;
    }
    Ok(())
}

#[tokio::test]
async fn rejects_schema_with_missing_index_or_changed_constraint() -> TestResult {
    let dir = temp_dir()?;
    let mut conn = crate::test_support::database(&dir.path().join("changed.db")).await?;
    sqlx::raw_sql("DROP INDEX idx_nodes_kind")
        .execute(&mut conn)
        .await?;
    assert_eq!(inspect_schema(&mut conn).await?, SchemaKind::Unknown);
    assert!(prepare_database(&mut conn).await.is_err());
    close_database(conn).await?;
    let mut conn = open_database(dir.path().join("constraint.db")).await?;
    let changed = super::schema::SCHEMA_SQL.replace("CHECK (length(trim(name)) > 0)", "");
    sqlx::raw_sql(sqlx::AssertSqlSafe(changed))
        .execute(&mut conn)
        .await?;
    assert_eq!(inspect_schema(&mut conn).await?, SchemaKind::Unknown);
    close_database(conn).await?;
    Ok(())
}
