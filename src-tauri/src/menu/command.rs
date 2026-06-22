use serde::{Deserialize, Serialize};
use specta::Type;
use strum::{AsRefStr, EnumString};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type, EnumString, AsRefStr)]
#[serde(rename_all = "kebab-case")]
#[strum(serialize_all = "kebab-case", prefix = "menu:")]
pub(crate) enum MenuCommand {
    About,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    BringAllToFront,
    ClearWorlds,
    CloseWorld,
    CloseWindow,
    Copy,
    Cut,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Fullscreen,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Hide,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    HideOthers,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Maximize,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Minimize,
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
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Services,
    SelectAll,
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    ShowAll,
    Undo,
    Updates,
}

impl MenuCommand {
    pub(super) fn text(self, app_name: &str) -> Option<String> {
        match self {
            Self::About => Some(format!("About {app_name}")),
            Self::ClearWorlds => Some("Clear Worlds...".into()),
            Self::CloseWorld => Some("Close World".into()),
            Self::CloseWindow => Some("Close Window".into()),
            Self::Copy => Some("Copy".into()),
            Self::Cut => Some("Cut".into()),
            #[cfg(target_os = "macos")]
            Self::Hide => Some(format!("Hide {app_name}")),
            Self::NewFile => Some("New File...".into()),
            Self::NewWindow => Some("New Window...".into()),
            Self::NewWorld => Some("New World...".into()),
            Self::OpenWorld => Some("Open World...".into()),
            Self::Paste => Some("Paste".into()),
            #[cfg(target_os = "macos")]
            Self::Quit => Some(format!("Quit {app_name}")),
            #[cfg(not(target_os = "macos"))]
            Self::Quit => Some("Exit".into()),
            Self::Redo => Some("Redo".into()),
            Self::RecentWorlds => Some("Recent Worlds".into()),
            Self::Save => Some("Save".into()),
            Self::SaveAs => Some("Save As...".into()),
            Self::Settings => Some("Settings...".into()),
            Self::SelectAll => Some("Select All".into()),
            Self::Undo => Some("Undo".into()),
            Self::Updates => Some("Check for Updates...".into()),
            #[cfg(target_os = "macos")]
            _ => None,
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
