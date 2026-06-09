use std::{collections::HashMap, sync::Arc};

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::world::WorldProject;

pub(super) type SharedProjectManager = Arc<ProjectManager>;

#[derive(Default)]
pub(super) struct ProjectManager {
    projects: Mutex<HashMap<Uuid, WorldProject>>,
}
