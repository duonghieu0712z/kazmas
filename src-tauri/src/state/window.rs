use std::{collections::HashMap, sync::Arc};

use tokio::sync::Mutex;
use uuid::Uuid;

pub(super) type SharedWindowRegistry = Arc<WindowRegistry>;

#[derive(Default)]
pub(super) struct WindowRegistry {
    inner: Mutex<WindowRegistryInner>,
}

#[derive(Default)]
struct WindowRegistryInner {
    sessions: HashMap<Uuid, WindowSession>,
    project_windows: HashMap<Uuid, Uuid>,
    last_window: Option<Uuid>,
}

struct WindowSession {
    window_id: Uuid,
    project_id: Uuid,
}
