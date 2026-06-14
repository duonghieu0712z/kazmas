use tauri::{
    AppHandle, Result, Wry,
    image::Image,
    menu::{
        AboutMetadata, AboutMetadataBuilder, HELP_SUBMENU_ID, MenuBuilder, MenuItem,
        MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder, WINDOW_SUBMENU_ID,
    },
};

use super::command::MenuCommand;

pub(super) fn build_menu(app: &AppHandle) -> Result<()> {
    let menu = MenuBuilder::new(app)
        .items(&[
            &create_app_menu(app)?,
            &create_file_menu(app)?,
            &create_edit_menu(app)?,
            &create_window_menu(app)?,
            &create_help_menu(app)?,
        ])
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

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
            &PredefinedMenuItem::separator(app)?,
            &menu_item(app, MenuCommand::CloseWorld)?,
            &PredefinedMenuItem::close_window(app, None)?,
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

fn menu_item(app: &AppHandle, command: MenuCommand) -> Result<MenuItem<Wry>> {
    let builder = MenuItemBuilder::with_id(command.as_ref(), command.text());
    log::debug!("{command:?} {}", command.as_ref());

    if let Some(accelerator) = command.accelerator() {
        builder.accelerator(accelerator).build(app)
    } else {
        builder.build(app)
    }
}
