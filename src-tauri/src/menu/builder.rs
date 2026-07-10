use tauri::{
    AppHandle, Wry,
    menu::{
        HELP_SUBMENU_ID, IsMenuItem, Menu, MenuBuilder, MenuItemBuilder, MenuItemKind,
        PredefinedMenuItem, Submenu, SubmenuBuilder, WINDOW_SUBMENU_ID,
    },
};

use super::MenuCommand;
use crate::app::{KazmasError, KazmasResult};

pub(crate) fn build_menu(app: &AppHandle) -> KazmasResult<Menu<Wry>> {
    let menu = MenuBuilder::new(app)
        .items(&[
            &build_app_menu(app)?,
            &build_file_menu(app)?,
            &build_edit_menu(app)?,
            &build_project_menu(app)?,
            &build_window_menu(app)?,
            &build_help_menu(app)?,
        ])
        .build()?;
    menu.set_as_app_menu()?;

    Ok(menu)
}

fn build_app_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, "app", &app.package_info().name, &[
        &item(app, MenuCommand::About)?,
        &item(app, MenuCommand::Updates)?,
        &separator(app)?,
        &item(app, MenuCommand::Settings)?,
        &separator(app)?,
        &predefined(app, MenuCommand::Services)?,
        &separator(app)?,
        &predefined(app, MenuCommand::Hide)?,
        &predefined(app, MenuCommand::HideOthers)?,
        &predefined(app, MenuCommand::ShowAll)?,
        &separator(app)?,
        &predefined(app, MenuCommand::Quit)?,
    ])
}

fn build_file_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, "file", "File", &[
        &item(app, MenuCommand::NewWorld)?,
        &item(app, MenuCommand::NewWindow)?,
        &separator(app)?,
        &item(app, MenuCommand::OpenWorld)?,
        &build_recent_worlds_menu(app)?,
        &separator(app)?,
        &item(app, MenuCommand::Save)?,
        &item(app, MenuCommand::SaveAs)?,
        &separator(app)?,
        &item(app, MenuCommand::CloseWorld)?,
        &predefined(app, MenuCommand::CloseWindow)?,
    ])
}

fn build_recent_worlds_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    submenu(app, MenuCommand::RecentWorlds, &[&item(
        app,
        MenuCommand::ClearWorlds,
    )?])
}

fn build_edit_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, "edit", "Edit", &[
        &predefined(app, MenuCommand::Undo)?,
        &predefined(app, MenuCommand::Redo)?,
        &separator(app)?,
        &predefined(app, MenuCommand::Cut)?,
        &predefined(app, MenuCommand::Copy)?,
        &predefined(app, MenuCommand::Paste)?,
        &separator(app)?,
        &predefined(app, MenuCommand::SelectAll)?,
    ])
}

fn build_project_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, "project", "Project", &[
        &build_new_file_menu(app)?,
        &item(app, MenuCommand::NewFolder)?,
        &separator(app)?,
        &item(app, MenuCommand::ProjectSettings)?,
        &separator(app)?,
        &item(app, MenuCommand::EmptyTrash)?,
    ])
}

fn build_new_file_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    submenu(app, MenuCommand::NewFile, &[
        &item(app, MenuCommand::NewManuscriptEntry)?,
        &item(app, MenuCommand::NewWikiEntry)?,
    ])
}

fn build_window_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, WINDOW_SUBMENU_ID, "Window", &[
        &predefined(app, MenuCommand::Minimize)?,
        &predefined(app, MenuCommand::Maximize)?,
        &separator(app)?,
        &predefined(app, MenuCommand::Fullscreen)?,
        &separator(app)?,
        &predefined(app, MenuCommand::BringAllToFront)?,
    ])
}

fn build_help_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    menu(app, HELP_SUBMENU_ID, "Help", &[&item(
        app,
        MenuCommand::ToggleDevtools,
    )?])
}

fn menu(
    app: &AppHandle,
    id: &str,
    text: &str,
    items: &[&dyn IsMenuItem<Wry>],
) -> KazmasResult<Submenu<Wry>> {
    Ok(SubmenuBuilder::with_id(app, id, text)
        .items(items)
        .build()?)
}

fn submenu(
    app: &AppHandle,
    command: MenuCommand,
    items: &[&dyn IsMenuItem<Wry>],
) -> KazmasResult<Submenu<Wry>> {
    let text = command.text(&app.package_info().name).unwrap_or_default();
    Ok(SubmenuBuilder::with_id(app, command.as_ref(), text)
        .items(items)
        .build()?)
}

fn item(app: &AppHandle, command: MenuCommand) -> KazmasResult<MenuItemKind<Wry>> {
    let text = command.text(&app.package_info().name).unwrap_or_default();
    let mut builder = MenuItemBuilder::with_id(command.as_ref(), text);
    if let Some(shortcut) = command.accelerator().as_deref() {
        builder = builder.accelerator(shortcut);
    }

    Ok(MenuItemKind::MenuItem(builder.build(app)?))
}

fn predefined(app: &AppHandle, command: MenuCommand) -> KazmasResult<MenuItemKind<Wry>> {
    let text = command.text(&app.package_info().name);
    let item = match command {
        MenuCommand::BringAllToFront => {
            PredefinedMenuItem::bring_all_to_front(app, text.as_deref())?
        }
        MenuCommand::CloseWindow => PredefinedMenuItem::close_window(app, text.as_deref())?,
        MenuCommand::Copy => PredefinedMenuItem::copy(app, text.as_deref())?,
        MenuCommand::Cut => PredefinedMenuItem::cut(app, text.as_deref())?,
        MenuCommand::Fullscreen => PredefinedMenuItem::fullscreen(app, text.as_deref())?,
        MenuCommand::Hide => PredefinedMenuItem::hide(app, text.as_deref())?,
        MenuCommand::HideOthers => PredefinedMenuItem::hide_others(app, text.as_deref())?,
        MenuCommand::Maximize => PredefinedMenuItem::maximize(app, text.as_deref())?,
        MenuCommand::Minimize => PredefinedMenuItem::minimize(app, text.as_deref())?,
        MenuCommand::Paste => PredefinedMenuItem::paste(app, text.as_deref())?,
        MenuCommand::Quit => PredefinedMenuItem::quit(app, text.as_deref())?,
        MenuCommand::Redo => PredefinedMenuItem::redo(app, text.as_deref())?,
        MenuCommand::SelectAll => PredefinedMenuItem::select_all(app, text.as_deref())?,
        MenuCommand::Services => PredefinedMenuItem::services(app, text.as_deref())?,
        MenuCommand::ShowAll => PredefinedMenuItem::show_all(app, text.as_deref())?,
        MenuCommand::Undo => PredefinedMenuItem::undo(app, text.as_deref())?,
        _ => {
            return Err(KazmasError::Invalid(format!(
                "menu command {} is not predefined",
                command.as_ref()
            )));
        }
    };

    Ok(MenuItemKind::Predefined(item))
}

fn separator(app: &AppHandle) -> KazmasResult<MenuItemKind<Wry>> {
    Ok(MenuItemKind::Predefined(PredefinedMenuItem::separator(
        app,
    )?))
}
