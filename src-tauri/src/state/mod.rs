mod app;
#[cfg(target_os = "macos")]
mod menu;
mod project;
mod registry;

pub(crate) use app::{AppState, get_state};
