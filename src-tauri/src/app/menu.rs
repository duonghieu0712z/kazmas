use std::str::FromStr;

use strum::{AsRefStr, EnumString};
use tauri::{
    AppHandle, Result, Wry,
    async_runtime::spawn,
    image::Image,
    menu::{
        AboutMetadata, AboutMetadataBuilder, HELP_SUBMENU_ID, MenuBuilder, MenuEvent, MenuItem,
        MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder, WINDOW_SUBMENU_ID,
    },
};

use super::error::KazmasResult;
use crate::state::spawn_window;

pub(crate) fn create_menu(app: &AppHandle) -> Result<()> {
    let menu = MenuBuilder::new(app)
        .items(&[
            #[cfg(target_os = "macos")]
            &create_app_menu(app)?,
            &create_file_menu(app)?,
            &create_edit_menu(app)?,
            &create_window_menu(app)?,
            &create_help_menu(app)?,
        ])
        .build()?;

    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let app = app.clone();
        let event = event.clone();
        spawn(async move {
            if let Err(error) = handle_menu_event(&app, event).await {
                log::error!("{error}");
            }
        });
    });

    Ok(())
}

#[cfg(target_os = "macos")]
fn create_app_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let name = &app.package_info().name;
    let menu = SubmenuBuilder::new(app, name)
        .about_with_text(format!("About {name}"), Some(about_metadata(app)?))
        .item(&menu_item(app, MenuCommand::Updates)?)
        .separator()
        .item(&menu_item(app, MenuCommand::Settings)?)
        .separator()
        .services()
        .separator()
        .hide_with_text(format!("Hide {name}"))
        .hide_others()
        .show_all()
        .separator()
        .quit_with_text(format!("Quit {name}"))
        .build()?;

    Ok(menu)
}

fn create_file_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = SubmenuBuilder::new(app, "File")
        .items(&[
            &menu_item(app, MenuCommand::NewFile)?,
            &menu_item(app, MenuCommand::NewWorld)?,
            &menu_item(app, MenuCommand::NewWindow)?,
            &PredefinedMenuItem::separator(app)?,
            &menu_item(app, MenuCommand::OpenWorld)?,
            &menu_item(app, MenuCommand::RecentWorlds)?,
            &PredefinedMenuItem::separator(app)?,
            &menu_item(app, MenuCommand::Save)?,
            &menu_item(app, MenuCommand::SaveAs)?,
            #[cfg(not(target_os = "macos"))]
            &separator,
            #[cfg(not(target_os = "macos"))]
            &menu_item(app, MenuCommand::Settings)?,
            &separator,
            &menu_item(app, MenuCommand::CloseWorld)?,
            &PredefinedMenuItem::close_window(app, None)?,
            #[cfg(not(target_os = "macos"))]
            &separator,
            #[cfg(not(target_os = "macos"))]
            &PredefinedMenuItem::quit(app, None)?,
        ])
        .build()?;

    Ok(menu)
}

fn create_edit_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let menu = SubmenuBuilder::new(app, "Edit")
        .undo_with_text("&Undo")
        .redo_with_text("&Redo")
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .select_all()
        .build()?;

    Ok(menu)
}

fn create_window_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let builder = SubmenuBuilder::new(app, "Window")
        .id(WINDOW_SUBMENU_ID)
        .minimize()
        .maximize();

    #[cfg(target_os = "macos")]
    let builder = builder
        .separator()
        .fullscreen()
        .separator()
        .bring_all_to_front();

    let menu = builder.build()?;
    Ok(menu)
}

fn create_help_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let builder = SubmenuBuilder::new(app, "Help").id(HELP_SUBMENU_ID);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .item(&menu_item(app, MenuCommand::Updates)?)
        .separator()
        .about_with_text(
            format!("&About {}", app.package_info().name),
            Some(about_metadata(app)?),
        );

    let menu = builder.build()?;
    Ok(menu)
}

fn about_metadata(app: &AppHandle) -> Result<AboutMetadata<'static>> {
    let icon = Image::from_bytes(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/icons/icon.png"
    )))?;
    let name = app.package_info().name.clone();
    let version = app.package_info().version.to_string();
    let about = AboutMetadataBuilder::new()
        .name(Some(name))
        .version(Some(version))
        .icon(Some(icon))
        .build();

    Ok(about)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumString, AsRefStr)]
#[strum(serialize_all = "kebab-case", prefix = "menu:")]
enum MenuCommand {
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
    fn text(self) -> &'static str {
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

    fn accelerator(self) -> Option<&'static str> {
        match self {
            Self::CloseWorld => Some("CmdOrCtrl+W"),
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

fn menu_item(app: &AppHandle, command: MenuCommand) -> Result<MenuItem<Wry>> {
    let builder = MenuItemBuilder::with_id(command.as_ref(), command.text());
    log::debug!("{command:?} {}", command.as_ref());

    if let Some(accelerator) = command.accelerator() {
        builder.accelerator(accelerator).build(app)
    } else {
        builder.build(app)
    }
}

async fn handle_menu_event(app: &AppHandle, event: MenuEvent) -> KazmasResult<()> {
    let Some(id) = event.id.as_ref().strip_prefix("menu:") else {
        return Ok(());
    };

    let command = MenuCommand::from_str(id)?;
    match command {
        MenuCommand::NewWindow => spawn_window(app, None).await?,
        MenuCommand::NewWorld => {}
        MenuCommand::OpenWorld => {}
        MenuCommand::CloseWorld => {}
        _ => log::debug!("Menu item {} not handled", command.as_ref()),
    }

    Ok(())
}
