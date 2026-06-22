use tauri::{
    AppHandle, Wry,
    menu::{
        CheckMenuItemBuilder, Menu, MenuItemBuilder, MenuItemKind, PredefinedMenuItem, Submenu,
        SubmenuBuilder,
    },
};

use super::{
    command::MenuCommand,
    descriptor::{MenuItem as MenuItemDescriptor, MenuSection},
};
use crate::app::{KazmasError, KazmasResult};

pub(crate) fn build_menu(
    app: &AppHandle,
    menu_sections: Vec<MenuSection>,
) -> KazmasResult<Menu<Wry>> {
    let menu = Menu::new(app)?;
    for section in menu_sections {
        menu.append(&build_menu_section(app, section)?)?;
    }
    menu.set_as_app_menu()?;
    Ok(menu)
}

fn build_menu_section(app: &AppHandle, section: MenuSection) -> KazmasResult<Submenu<Wry>> {
    let submenu = SubmenuBuilder::with_id(app, section.id, section.text).build()?;
    for item in section.items {
        submenu.append(&build_menu_item(app, item)?)?;
    }
    Ok(submenu)
}

fn build_menu_item(app: &AppHandle, item: MenuItemDescriptor) -> KazmasResult<MenuItemKind<Wry>> {
    match item {
        MenuItemDescriptor::Predefined { id, text } => predefined_item(app, id, text.as_deref()),
        MenuItemDescriptor::Item {
            id,
            text,
            shortcut,
            enabled,
        } => build_item(app, id, text, shortcut, enabled),
        MenuItemDescriptor::Check {
            id,
            text,
            shortcut,
            checked,
            enabled,
        } => build_check_item(app, id, text, shortcut, checked, enabled),
        MenuItemDescriptor::Submenu {
            id,
            text,
            items,
            enabled,
        } => build_submenu(app, id, text, items, enabled),
        MenuItemDescriptor::Separator { .. } => build_separator(app),
    }
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

fn build_item(
    app: &AppHandle,
    command: MenuCommand,
    text: String,
    shortcut: Option<&'static str>,
    enabled: bool,
) -> KazmasResult<MenuItemKind<Wry>> {
    let mut builder = MenuItemBuilder::with_id(command.as_ref(), text).enabled(enabled);
    if let Some(shortcut) = shortcut {
        builder = builder.accelerator(shortcut);
    }
    let item = builder.build(app)?;

    Ok(MenuItemKind::MenuItem(item))
}

fn build_check_item(
    app: &AppHandle,
    command: MenuCommand,
    text: String,
    shortcut: Option<&'static str>,
    checked: bool,
    enabled: bool,
) -> KazmasResult<MenuItemKind<Wry>> {
    let mut builder = CheckMenuItemBuilder::with_id(command.as_ref(), text)
        .enabled(enabled)
        .checked(checked);
    if let Some(shortcut) = shortcut {
        builder = builder.accelerator(shortcut);
    }
    let item = builder.build(app)?;

    Ok(MenuItemKind::Check(item))
}

fn build_submenu(
    app: &AppHandle,
    command: MenuCommand,
    text: String,
    items: Vec<MenuItemDescriptor>,
    enabled: bool,
) -> KazmasResult<MenuItemKind<Wry>> {
    let submenu = SubmenuBuilder::with_id(app, command.as_ref(), text)
        .enabled(enabled)
        .build()?;
    for item in items {
        submenu.append(&build_menu_item(app, item)?)?;
    }

    Ok(MenuItemKind::Submenu(submenu))
}

fn build_separator(app: &AppHandle) -> KazmasResult<MenuItemKind<Wry>> {
    Ok(MenuItemKind::Predefined(PredefinedMenuItem::separator(
        app,
    )?))
}
