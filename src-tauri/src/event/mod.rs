use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::{Event, Events, collect_events};

use crate::menu::MenuCommand;

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[tauri_specta(event_name = "menu-command")]
pub(crate) struct MenuCommandEvent(pub(crate) MenuCommand);

pub(crate) fn events() -> Events {
    collect_events![MenuCommandEvent]
}
