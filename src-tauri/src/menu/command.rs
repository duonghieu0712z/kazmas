use strum::{AsRefStr, EnumString};

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumString, AsRefStr)]
#[strum(serialize_all = "kebab-case", prefix = "menu:")]
pub(super) enum MenuCommand {
    CloseWorld,
    NewFile,
    NewWindow,
    NewWorld,
    OpenWorld,
    RecentWorlds,
    Save,
    SaveAs,
    Settings,
    Updates,
}

impl MenuCommand {
    pub(super) fn text(self) -> &'static str {
        match self {
            Self::CloseWorld => "&Close World",
            Self::NewFile => "New &File...",
            Self::NewWindow => "New &Window...",
            Self::NewWorld => "&New World...",
            Self::OpenWorld => "&Open World...",
            Self::RecentWorlds => "&Recent Worlds",
            Self::Save => "&Save",
            Self::SaveAs => "Save &As...",
            Self::Settings => "&Settings...",
            Self::Updates => "Check for &Updates...",
        }
    }

    pub(super) fn accelerator(self) -> Option<&'static str> {
        match self {
            Self::CloseWorld => Some("CmdOrCtrl+Alt+W"),
            Self::NewFile => Some("CmdOrCtrl+N"),
            Self::NewWindow => Some("CmdOrCtrl+Shift+W"),
            Self::NewWorld => Some("CmdOrCtrl+Shift+N"),
            Self::OpenWorld => Some("CmdOrCtrl+O"),
            Self::Save => Some("CmdOrCtrl+S"),
            Self::SaveAs => Some("CmdOrCtrl+Shift+S"),
            Self::Settings => Some("CmdOrCtrl+,"),
            _ => None,
        }
    }
}
