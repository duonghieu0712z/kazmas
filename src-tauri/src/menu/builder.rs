use tauri::{
    AppHandle, Wry,
    menu::{
        HELP_SUBMENU_ID, Menu, MenuItemBuilder, MenuItemKind, PredefinedMenuItem, Submenu,
        SubmenuBuilder, WINDOW_SUBMENU_ID,
    },
};

use super::MenuCommand;
use crate::app::{KazmasError, KazmasResult};

pub(crate) fn build_menu(app: &AppHandle) -> KazmasResult<Menu<Wry>> {
    let app_name = app.package_info().name.as_str();
    let menu = Menu::new(app)?;

    menu.append(&build_app_menu(app, app_name)?)?;
    menu.append(&build_file_menu(app)?)?;
    menu.append(&build_edit_menu(app)?)?;
    menu.append(&build_project_menu(app)?)?;
    menu.append(&build_window_menu(app)?)?;
    menu.append(&build_help_menu(app)?)?;
    menu.set_as_app_menu()?;

    Ok(menu)
}

fn build_app_menu(app: &AppHandle, app_name: &str) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, "app", app_name)?;

    append_item(app, &menu, MenuCommand::About)?;
    append_item(app, &menu, MenuCommand::Updates)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::Settings)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::Services)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::Hide)?;
    append_predefined(app, &menu, MenuCommand::HideOthers)?;
    append_predefined(app, &menu, MenuCommand::ShowAll)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::Quit)?;

    Ok(menu)
}

fn build_file_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, "file", "File")?;
    let recent_worlds = command_submenu(app, MenuCommand::RecentWorlds)?;

    append_item(app, &menu, MenuCommand::NewWorld)?;
    append_item(app, &menu, MenuCommand::NewWindow)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::OpenWorld)?;
    append_item(app, &recent_worlds, MenuCommand::ClearWorlds)?;
    menu.append(&recent_worlds)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::Save)?;
    append_item(app, &menu, MenuCommand::SaveAs)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::CloseWorld)?;
    append_predefined(app, &menu, MenuCommand::CloseWindow)?;

    Ok(menu)
}

fn build_edit_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, "edit", "Edit")?;

    append_predefined(app, &menu, MenuCommand::Undo)?;
    append_predefined(app, &menu, MenuCommand::Redo)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::Cut)?;
    append_predefined(app, &menu, MenuCommand::Copy)?;
    append_predefined(app, &menu, MenuCommand::Paste)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::SelectAll)?;

    Ok(menu)
}

fn build_project_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, "project", "Project")?;
    let new_file = command_submenu(app, MenuCommand::NewFile)?;

    append_item(app, &new_file, MenuCommand::NewManuscriptEntry)?;
    append_item(app, &new_file, MenuCommand::NewWikiEntry)?;
    menu.append(&new_file)?;
    append_item(app, &menu, MenuCommand::NewFolder)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::ProjectSettings)?;
    append_separator(app, &menu)?;
    append_item(app, &menu, MenuCommand::EmptyTrash)?;

    Ok(menu)
}

fn build_window_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, WINDOW_SUBMENU_ID, "Window")?;

    append_predefined(app, &menu, MenuCommand::Minimize)?;
    append_predefined(app, &menu, MenuCommand::Maximize)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::Fullscreen)?;
    append_separator(app, &menu)?;
    append_predefined(app, &menu, MenuCommand::BringAllToFront)?;

    Ok(menu)
}

fn build_help_menu(app: &AppHandle) -> KazmasResult<Submenu<Wry>> {
    let menu = submenu_with_id(app, HELP_SUBMENU_ID, "Help")?;

    append_item(app, &menu, MenuCommand::ToggleDevtools)?;

    Ok(menu)
}

fn submenu_with_id(app: &AppHandle, id: &str, text: &str) -> KazmasResult<Submenu<Wry>> {
    Ok(SubmenuBuilder::with_id(app, id, text).build()?)
}

fn command_submenu(app: &AppHandle, command: MenuCommand) -> KazmasResult<Submenu<Wry>> {
    let text = command.text(&app.package_info().name).unwrap_or_default();
    Ok(SubmenuBuilder::with_id(app, command.as_ref(), text).build()?)
}

fn append_item(app: &AppHandle, menu: &Submenu<Wry>, command: MenuCommand) -> KazmasResult<()> {
    let text = command.text(&app.package_info().name).unwrap_or_default();
    let mut builder = MenuItemBuilder::with_id(command.as_ref(), text);
    if let Some(shortcut) = command.accelerator().as_deref() {
        builder = builder.accelerator(shortcut);
    }

    menu.append(&MenuItemKind::MenuItem(builder.build(app)?))?;
    Ok(())
}

fn append_predefined(
    app: &AppHandle,
    menu: &Submenu<Wry>,
    command: MenuCommand,
) -> KazmasResult<()> {
    menu.append(&predefined_item(
        app,
        command,
        command.text(&app.package_info().name).as_deref(),
    )?)?;
    Ok(())
}

fn predefined_item(
    app: &AppHandle,
    command: MenuCommand,
    text: Option<&str>,
) -> KazmasResult<MenuItemKind<Wry>> {
    let item = match command {
        MenuCommand::BringAllToFront => PredefinedMenuItem::bring_all_to_front(app, text)?,
        MenuCommand::CloseWindow => PredefinedMenuItem::close_window(app, text)?,
        MenuCommand::Copy => PredefinedMenuItem::copy(app, text)?,
        MenuCommand::Cut => PredefinedMenuItem::cut(app, text)?,
        MenuCommand::Fullscreen => PredefinedMenuItem::fullscreen(app, text)?,
        MenuCommand::Hide => PredefinedMenuItem::hide(app, text)?,
        MenuCommand::HideOthers => PredefinedMenuItem::hide_others(app, text)?,
        MenuCommand::Maximize => PredefinedMenuItem::maximize(app, text)?,
        MenuCommand::Minimize => PredefinedMenuItem::minimize(app, text)?,
        MenuCommand::Paste => PredefinedMenuItem::paste(app, text)?,
        MenuCommand::Quit => PredefinedMenuItem::quit(app, text)?,
        MenuCommand::Redo => PredefinedMenuItem::redo(app, text)?,
        MenuCommand::SelectAll => PredefinedMenuItem::select_all(app, text)?,
        MenuCommand::Services => PredefinedMenuItem::services(app, text)?,
        MenuCommand::ShowAll => PredefinedMenuItem::show_all(app, text)?,
        MenuCommand::Undo => PredefinedMenuItem::undo(app, text)?,
        _ => {
            return Err(KazmasError::Invalid(format!(
                "menu command {} is not predefined",
                command.as_ref()
            )));
        }
    };

    Ok(MenuItemKind::Predefined(item))
}

fn append_separator(app: &AppHandle, menu: &Submenu<Wry>) -> KazmasResult<()> {
    menu.append(&MenuItemKind::Predefined(PredefinedMenuItem::separator(
        app,
    )?))?;
    Ok(())
}
