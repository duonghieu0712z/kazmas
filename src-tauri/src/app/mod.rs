mod error;
mod menu;
mod window;

pub(crate) use error::{KazmasError, KazmasResult};
pub(crate) use menu::create_menu;
pub(crate) use window::handle_window_event;
