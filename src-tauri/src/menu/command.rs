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
    NewChapter,
    NewFile,
    NewFolder,
    NewWindow,
    NewWorld,
    NewWikiEntry,
    OpenWorld,
    Paste,
    ProjectSettings,
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
    ToggleDevtools,
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
            Self::NewChapter => Some("New Chapter".into()),
            Self::NewFile => Some("New File...".into()),
            Self::NewFolder => Some("New Folder".into()),
            Self::NewWindow => Some("New Window...".into()),
            Self::NewWorld => Some("New World...".into()),
            Self::NewWikiEntry => Some("New Wiki".into()),
            Self::OpenWorld => Some("Open World...".into()),
            Self::Paste => Some("Paste".into()),
            Self::ProjectSettings => Some("Project Settings...".into()),
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
            Self::ToggleDevtools => Some("Toggle Developer Tools".into()),
            Self::Undo => Some("Undo".into()),
            Self::Updates => Some("Check for Updates...".into()),
            #[cfg(target_os = "macos")]
            _ => None,
        }
    }

    pub(super) fn accelerator(self) -> Option<String> {
        match self {
            Self::CloseWorld => Some("CmdOrCtrl+Alt+W".into()),
            Self::CloseWindow => Some("CmdOrCtrl+W".into()),
            Self::Copy => Some("CmdOrCtrl+C".into()),
            Self::Cut => Some("CmdOrCtrl+X".into()),
            Self::NewWindow => Some("CmdOrCtrl+Shift+W".into()),
            Self::NewWorld => Some("CmdOrCtrl+Shift+N".into()),
            Self::OpenWorld => Some("CmdOrCtrl+O".into()),
            Self::Paste => Some("CmdOrCtrl+V".into()),
            Self::ProjectSettings => Some("CmdOrCtrl+Shift+,".into()),
            Self::Redo => Some("CmdOrCtrl+Shift+Z".into()),
            Self::Save => Some("CmdOrCtrl+S".into()),
            Self::SaveAs => Some("CmdOrCtrl+Shift+S".into()),
            Self::Settings => Some("CmdOrCtrl+,".into()),
            Self::SelectAll => Some("CmdOrCtrl+A".into()),
            Self::Undo => Some("CmdOrCtrl+Z".into()),
            _ => None,
        }
    }
}
