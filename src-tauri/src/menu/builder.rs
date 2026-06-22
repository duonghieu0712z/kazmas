use tauri::{
    AppHandle, Result, Wry,
    menu::{
        CheckMenuItemBuilder, Menu, MenuItemBuilder, MenuItemKind, PredefinedMenuItem, Submenu,
        SubmenuBuilder,
    },
};

use super::{
    command::MenuCommand,
    descriptor::{MenuItem as MenuItemDescriptor, MenuSection},
};

pub(crate) fn build_menu(app: &AppHandle, menu_sections: Vec<MenuSection>) -> Result<Menu<Wry>> {
    let menu = Menu::new(app)?;
    for section in menu_sections {
        menu.append(&build_menu_section(app, section)?)?;
    }
    menu.set_as_app_menu()?;
    Ok(menu)
}

fn build_menu_section(app: &AppHandle, section: MenuSection) -> Result<Submenu<Wry>> {
    let submenu = SubmenuBuilder::with_id(app, section.id, section.text).build()?;
    for item in section.items {
        submenu.append(&build_menu_item(app, item)?)?;
    }
    Ok(submenu)
}

fn build_menu_item(app: &AppHandle, item: MenuItemDescriptor) -> Result<MenuItemKind<Wry>> {
    match item {
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
        } => {
            let mut builder = CheckMenuItemBuilder::with_id(id.as_ref(), text)
                .enabled(enabled)
                .checked(checked);
            if let Some(shortcut) = shortcut {
                builder = builder.accelerator(shortcut);
            }
            let item = builder.build(app)?;
            Ok(MenuItemKind::Check(item))
        }
        MenuItemDescriptor::Submenu {
            id,
            text,
            items,
            enabled,
        } => {
            let submenu = SubmenuBuilder::with_id(app, id.as_ref(), text)
                .enabled(enabled)
                .build()?;
            for item in items {
                submenu.append(&build_menu_item(app, item)?)?;
            }
            Ok(MenuItemKind::Submenu(submenu))
        }
        MenuItemDescriptor::Separator { .. } => Ok(MenuItemKind::Predefined(
            PredefinedMenuItem::separator(app)?,
        )),
    }
}

fn build_item(
    app: &AppHandle,
    command: MenuCommand,
    text: String,
    shortcut: Option<&'static str>,
    enabled: bool,
) -> Result<MenuItemKind<Wry>> {
    if let Some(item) = predefined_item(app, command, &text)? {
        return Ok(MenuItemKind::Predefined(item));
    }

    let mut builder = MenuItemBuilder::with_id(command.as_ref(), text).enabled(enabled);
    if let Some(shortcut) = shortcut {
        builder = builder.accelerator(shortcut);
    }
    let item = builder.build(app)?;

    Ok(MenuItemKind::MenuItem(item))
}

fn predefined_item(
    app: &AppHandle,
    command: MenuCommand,
    text: &str,
) -> Result<Option<PredefinedMenuItem<Wry>>> {
    let text = predefined_text(command, text);
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
        _ => return Ok(None),
    };

    Ok(Some(item))
}

fn predefined_text(command: MenuCommand, text: &str) -> Option<&str> {
    match command {
        MenuCommand::BringAllToFront
        | MenuCommand::Fullscreen
        | MenuCommand::HideOthers
        | MenuCommand::Maximize
        | MenuCommand::Minimize
        | MenuCommand::Services
        | MenuCommand::ShowAll => None,
        _ => Some(text),
    }
}
