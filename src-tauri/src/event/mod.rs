use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::{Event, Events, collect_events};

use crate::menu::{MenuCommand, MenuSection};

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[tauri_specta(event_name = "menu-command")]
pub(crate) struct MenuCommandEvent(pub(crate) MenuCommand);

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[tauri_specta(event_name = "menu-changed")]
pub(crate) struct MenuChangedEvent(pub(crate) Vec<MenuSection>);

#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[tauri_specta(event_name = "world-changed")]
pub(crate) struct WorldChangedEvent(pub(crate) bool);

pub(crate) fn events() -> Events {
    collect_events![MenuCommandEvent, MenuChangedEvent, WorldChangedEvent]
}
