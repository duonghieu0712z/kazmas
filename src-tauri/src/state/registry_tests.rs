use uuid::Uuid;

use super::WindowRegistry;
use crate::test_support::TestResult;

#[tokio::test]
async fn rejects_duplicate_windows_and_projects_without_changing_mapping() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let second = Uuid::now_v7();
    let project = Uuid::now_v7();
    registry.register_window(window, Some(project)).await?;
    assert!(registry.register_window(window, None).await.is_err());
    assert!(
        registry
            .register_window(second, Some(project))
            .await
            .is_err()
    );
    assert_eq!(registry.get_project_id(window).await, Some(project));
    assert_eq!(registry.get_window_id(project).await, Some(window));
    assert_eq!(registry.get_project_id(second).await, None);
    Ok(())
}

#[tokio::test]
async fn replaces_closes_and_unregisters_projects_consistently() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let second = Uuid::now_v7();
    let project = Uuid::now_v7();
    let replacement = Uuid::now_v7();
    registry.register_window(window, Some(project)).await?;
    registry.register_window(second, Some(replacement)).await?;
    assert!(registry.replace_project(window, replacement).await.is_err());
    assert_eq!(registry.get_project_id(window).await, Some(project));
    assert_eq!(registry.close_project(second).await, Some(replacement));
    assert_eq!(
        registry.replace_project(window, replacement).await?,
        Some(project)
    );
    assert_eq!(registry.get_window_id(project).await, None);
    assert_eq!(registry.get_window_id(replacement).await, Some(window));
    assert_eq!(registry.unregister_window(window).await, Some(replacement));
    assert_eq!(registry.get_window_id(replacement).await, None);
    assert!(registry.replace_project(window, project).await.is_err());
    Ok(())
}

#[tokio::test]
async fn concurrent_registration_allows_only_one_owner() -> TestResult {
    let registry = WindowRegistry::default();
    let project = Uuid::now_v7();
    let first = Uuid::now_v7();
    let second = Uuid::now_v7();
    let (left, right) = tokio::join!(
        registry.register_window(first, Some(project)),
        registry.register_window(second, Some(project))
    );
    assert_ne!(left.is_ok(), right.is_ok());
    assert_eq!(
        registry.get_window_id(project).await,
        Some(if left.is_ok() { first } else { second })
    );
    registry.set_focus(Some(first)).await;
    assert_eq!(registry.focused_window().await, Some(first));
    registry.set_focus(None).await;
    assert_eq!(registry.focused_window().await, None);
    Ok(())
}
