#[cfg(target_os = "macos")]
mod builder;
mod command;
mod descriptor;
mod handler;

#[cfg(target_os = "macos")]
pub(crate) use builder::build_menu;
pub(crate) use command::MenuCommand;
pub(crate) use descriptor::{MenuSection, menu_sections};
pub(crate) use handler::handle_command;
#[cfg(target_os = "macos")]
pub(crate) use handler::handle_menu_event;
