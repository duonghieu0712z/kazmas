mod error;
mod menu;
mod state;
mod window;

pub(crate) use error::{KazmasError, KazmasResult};
pub(crate) use menu::create_menu;
pub(crate) use state::AppState;
pub(crate) use window::handle_window_event;
