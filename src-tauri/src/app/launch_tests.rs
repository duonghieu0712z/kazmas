use super::*;
use crate::test_support::{TestResult, temp_dir};

#[test]
fn launch_paths_skip_executable_flags_and_unrelated_files() -> TestResult {
    let dir = temp_dir()?;
    let absolute = dir.path().join("Absolute.KAZMAS");
    let paths = launch_world_paths(
        vec![
            "executable.kazmas".into(),
            "--ignored.kazmas".into(),
            "notes.txt".into(),
            "Relative World.kazmas".into(),
            absolute.to_string_lossy().into_owned(),
        ],
        dir.path(),
    );
    assert_eq!(paths, vec![
        dir.path().join("Relative World.kazmas"),
        absolute
    ]);
    Ok(())
}

#[test]
fn opened_urls_decode_file_paths_and_ignore_unrelated_resources() -> TestResult {
    let dir = temp_dir()?;
    let path = dir.path().join("World #1 100%.KAZMAS");
    let urls = vec![
        tauri::Url::from_file_path(&path).map_err(|()| "invalid file URL")?,
        tauri::Url::from_file_path(dir.path().join("notes.txt"))
            .map_err(|()| "invalid file URL")?,
        tauri::Url::parse("https://example.com/world.kazmas")?,
    ];
    assert_eq!(opened_world_paths(urls), vec![path]);
    Ok(())
}
