use serde::{Deserialize, Serialize};
use specta::Type;
use strum::{AsRefStr, EnumString};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type, EnumString, AsRefStr)]
#[serde(rename_all = "kebab-case")]
#[strum(serialize_all = "kebab-case", prefix = "menu:")]
pub(crate) enum MenuCommand {
    About,
    CloseWorld,
    CloseWindow,
    Copy,
    Cut,
    NewFile,
    NewWindow,
    NewWorld,
    OpenWorld,
    Paste,
    Quit,
    Redo,
    RecentWorlds,
    Save,
    SaveAs,
    Settings,
    SelectAll,
    Undo,
    Updates,
}

impl MenuCommand {
    pub(super) fn text(self) -> &'static str {
        match self {
            Self::About => "About Kazmas",
            Self::CloseWorld => "Close World",
            Self::CloseWindow => "Close Window",
            Self::Copy => "Copy",
            Self::Cut => "Cut",
            Self::NewFile => "New File...",
            Self::NewWindow => "New Window...",
            Self::NewWorld => "New World...",
            Self::OpenWorld => "Open World...",
            Self::Paste => "Paste",
            Self::Quit => "Quit",
            Self::Redo => "Redo",
            Self::RecentWorlds => "Recent Worlds",
            Self::Save => "Save",
            Self::SaveAs => "Save As...",
            Self::Settings => "Settings...",
            Self::SelectAll => "Select All",
            Self::Undo => "Undo",
            Self::Updates => "Check for Updates...",
        }
    }

    pub(super) fn accelerator(self) -> Option<&'static str> {
        match self {
            Self::CloseWorld => Some("CmdOrCtrl+Alt+W"),
            Self::CloseWindow => Some("CmdOrCtrl+W"),
            Self::Copy => Some("CmdOrCtrl+C"),
            Self::Cut => Some("CmdOrCtrl+X"),
            Self::NewFile => Some("CmdOrCtrl+N"),
            Self::NewWindow => Some("CmdOrCtrl+Shift+W"),
            Self::NewWorld => Some("CmdOrCtrl+Shift+N"),
            Self::OpenWorld => Some("CmdOrCtrl+O"),
            Self::Paste => Some("CmdOrCtrl+V"),
            Self::Quit => Some("CmdOrCtrl+Q"),
            Self::Redo => Some("CmdOrCtrl+Shift+Z"),
            Self::Save => Some("CmdOrCtrl+S"),
            Self::SaveAs => Some("CmdOrCtrl+Shift+S"),
            Self::Settings => Some("CmdOrCtrl+,"),
            Self::SelectAll => Some("CmdOrCtrl+A"),
            Self::Undo => Some("CmdOrCtrl+Z"),
            _ => None,
        }
    }
}
