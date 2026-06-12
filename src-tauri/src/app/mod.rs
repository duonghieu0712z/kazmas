mod error;
mod window;

pub(crate) use error::{KazmasError, KazmasResult};
pub(crate) use window::{
    choose_project_placement, confirm_project_transition, place_project, spawn_window,
};
