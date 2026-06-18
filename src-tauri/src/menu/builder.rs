use tauri::{
    AppHandle, Result, Wry,
    image::Image,
    menu::{
        AboutMetadata, AboutMetadataBuilder, CheckMenuItemBuilder, Menu, MenuItemBuilder,
        MenuItemKind, PredefinedMenuItem, Submenu, SubmenuBuilder,
    },
};

use super::{
    command::MenuCommand,
    descriptor::{MenuGroup, MenuItem as MenuItemDescriptor},
};

pub(super) fn build_menu(app: &AppHandle) -> Result<()> {
    let menu = Menu::new(app)?;

    for group in super::app_menu(app) {
        menu.append(&native_menu_group(app, group)?)?;
    }

    app.set_menu(menu)?;
    Ok(())
}

fn native_menu_group(app: &AppHandle, group: MenuGroup) -> Result<Submenu<Wry>> {
    let submenu = SubmenuBuilder::with_id(app, group.id, group.text).build()?;

    for item in group.items {
        submenu.append(&native_menu_item(app, item)?)?;
    }

    Ok(submenu)
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

fn native_menu_item(app: &AppHandle, item: MenuItemDescriptor) -> Result<MenuItemKind<Wry>> {
    match item {
        MenuItemDescriptor::Item {
            id,
            text,
            shortcut,
            disabled,
        } => native_command_item(app, id, text, shortcut, !disabled),
        MenuItemDescriptor::Check {
            id,
            text,
            shortcut,
            checked,
            disabled,
        } => {
            let mut builder = CheckMenuItemBuilder::with_id(id.as_ref(), text)
                .enabled(!disabled)
                .checked(checked);
            if let Some(shortcut) = shortcut {
                builder = builder.accelerator(shortcut);
            }
            Ok(MenuItemKind::Check(builder.build(app)?))
        }
        MenuItemDescriptor::Submenu { id, text, items } => {
            let submenu = SubmenuBuilder::with_id(app, id, text).build()?;
            for item in items {
                submenu.append(&native_menu_item(app, item)?)?;
            }
            Ok(MenuItemKind::Submenu(submenu))
        }
        MenuItemDescriptor::Separator { .. } => Ok(MenuItemKind::Predefined(
            PredefinedMenuItem::separator(app)?,
        )),
    }
}

fn native_command_item(
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

    Ok(MenuItemKind::MenuItem(builder.build(app)?))
}

fn predefined_item(
    app: &AppHandle,
    command: MenuCommand,
    text: &str,
) -> Result<Option<PredefinedMenuItem<Wry>>> {
    let item = match command {
        MenuCommand::About => {
            PredefinedMenuItem::about(app, Some(text), Some(about_metadata(app)?))?
        }
        MenuCommand::CloseWindow => PredefinedMenuItem::close_window(app, Some(text))?,
        MenuCommand::Copy => PredefinedMenuItem::copy(app, Some(text))?,
        MenuCommand::Cut => PredefinedMenuItem::cut(app, Some(text))?,
        MenuCommand::Paste => PredefinedMenuItem::paste(app, Some(text))?,
        MenuCommand::Quit => PredefinedMenuItem::quit(app, Some(text))?,
        MenuCommand::Redo => PredefinedMenuItem::redo(app, Some(text))?,
        MenuCommand::SelectAll => PredefinedMenuItem::select_all(app, Some(text))?,
        MenuCommand::Undo => PredefinedMenuItem::undo(app, Some(text))?,
        MenuCommand::BringAllToFront => PredefinedMenuItem::bring_all_to_front(app, Some(text))?,
        MenuCommand::Fullscreen => PredefinedMenuItem::fullscreen(app, Some(text))?,
        MenuCommand::Hide => PredefinedMenuItem::hide(app, Some(text))?,
        MenuCommand::HideOthers => PredefinedMenuItem::hide_others(app, Some(text))?,
        MenuCommand::Maximize => PredefinedMenuItem::maximize(app, Some(text))?,
        MenuCommand::Minimize => PredefinedMenuItem::minimize(app, Some(text))?,
        MenuCommand::Services => PredefinedMenuItem::services(app, Some(text))?,
        MenuCommand::ShowAll => PredefinedMenuItem::show_all(app, Some(text))?,
        _ => return Ok(None),
    };

    Ok(Some(item))
}
