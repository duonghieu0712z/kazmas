use tokio::sync::Mutex;

use crate::world::WorldProject;

#[derive(Default)]
pub(crate) struct AppState {
    pub(crate) project: Mutex<Option<WorldProject>>,
}
