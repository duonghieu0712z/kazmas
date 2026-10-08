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
async fn selects_only_empty_windows_and_prefers_the_focused_one() -> TestResult {
    let registry = WindowRegistry::default();
    assert_eq!(registry.empty_window().await, None);

    let occupied = Uuid::now_v7();
    registry
        .register_window(occupied, Some(Uuid::now_v7()))
        .await?;
    registry.set_focus(Some(occupied)).await;
    assert_eq!(registry.empty_window().await, None);

    let first = Uuid::now_v7();
    registry.register_window(first, None).await?;
    assert_eq!(registry.empty_window().await, Some(first));

    let second = Uuid::now_v7();
    registry.register_window(second, None).await?;
    registry.set_focus(Some(second)).await;
    assert_eq!(registry.empty_window().await, Some(second));

    registry.replace_project(second, Uuid::now_v7()).await?;
    assert_eq!(registry.empty_window().await, Some(first));
    registry.unregister_window(first).await;
    assert_eq!(registry.empty_window().await, None);
    Ok(())
}

#[tokio::test]
async fn concurrent_claims_preserve_the_winning_project() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let first = Uuid::now_v7();
    let second = Uuid::now_v7();
    registry.register_window(window, None).await?;

    let (left, right) = tokio::join!(
        registry.claim_empty_window(window, first),
        registry.claim_empty_window(window, second)
    );
    let left = left?;
    let right = right?;
    assert_ne!(left, right);
    let (winner, loser) = if left {
        (first, second)
    } else {
        (second, first)
    };
    assert_eq!(registry.get_project_id(window).await, Some(winner));
    assert_eq!(registry.get_window_id(winner).await, Some(window));
    assert_eq!(registry.get_window_id(loser).await, None);
    assert_eq!(registry.empty_window().await, None);
    Ok(())
}

#[tokio::test]
async fn claims_reject_missing_windows_and_duplicate_projects() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let owner = Uuid::now_v7();
    let project = Uuid::now_v7();
    assert!(!registry.claim_empty_window(window, project).await?);
    registry.register_window(window, None).await?;
    registry.register_window(owner, Some(project)).await?;
    assert!(registry.claim_empty_window(window, project).await.is_err());
    assert_eq!(registry.get_project_id(window).await, None);
    assert_eq!(registry.get_window_id(project).await, Some(owner));
    assert_eq!(registry.empty_window().await, Some(window));
    Ok(())
}

#[tokio::test]
async fn releasing_a_claim_makes_the_window_available_again() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let project = Uuid::now_v7();
    registry.register_window(window, None).await?;
    registry.set_focus(Some(window)).await;
    assert!(registry.claim_empty_window(window, project).await?);

    registry.release_window_claim(window, project).await;
    assert_eq!(registry.get_project_id(window).await, None);
    assert_eq!(registry.get_window_id(project).await, None);
    assert_eq!(registry.empty_window().await, Some(window));
    assert_eq!(registry.focused_window().await, Some(window));
    assert!(registry.claim_empty_window(window, Uuid::now_v7()).await?);
    Ok(())
}

#[tokio::test]
async fn releasing_a_stale_claim_preserves_the_current_owner() -> TestResult {
    let registry = WindowRegistry::default();
    let window = Uuid::now_v7();
    let other_window = Uuid::now_v7();
    let project = Uuid::now_v7();
    let replacement = Uuid::now_v7();
    registry.register_window(window, None).await?;
    assert!(registry.claim_empty_window(window, project).await?);
    registry.replace_project(window, replacement).await?;
    registry
        .register_window(other_window, Some(project))
        .await?;

    registry.release_window_claim(window, project).await;
    assert_eq!(registry.get_project_id(window).await, Some(replacement));
    assert_eq!(registry.get_window_id(replacement).await, Some(window));
    assert_eq!(registry.get_window_id(project).await, Some(other_window));

    registry.unregister_window(window).await;
    registry.release_window_claim(window, project).await;
    assert_eq!(registry.get_window_id(project).await, Some(other_window));
    assert!(registry.replace_project(window, replacement).await.is_err());
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
