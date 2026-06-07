use tauri::{
    AppHandle, Result, Wry,
    image::Image,
    menu::{
        AboutMetadata, AboutMetadataBuilder, HELP_SUBMENU_ID, MenuBuilder, MenuEvent, MenuItem,
        MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder, WINDOW_SUBMENU_ID,
    },
};

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
    app.on_menu_event(handle_menu_event);

    Ok(())
}

#[cfg(target_os = "macos")]
fn create_app_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let name = &app.package_info().name;
    let menu = SubmenuBuilder::new(app, name)
        .about_with_text(format!("&About {name}"), Some(about_metadata(app)?))
        .item(&create_updates_item(app)?)
        .separator()
        .item(&create_settings_item(app)?)
        .separator()
        .services()
        .separator()
        .hide_with_text(format!("&Hide {name}"))
        .hide_others()
        .show_all()
        .separator()
        .quit_with_text(format!("&Quit {name}"))
        .build()?;

    Ok(menu)
}

fn create_file_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let new_file_item = MenuItemBuilder::with_id("new-file", "&New File...")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let new_world_item = MenuItemBuilder::with_id("new-world", "New &World...")
        .accelerator("CmdOrCtrl+Shift+N")
        .build(app)?;
    let open_world_item = MenuItemBuilder::with_id("open-world", "&Open World...")
        .accelerator("CmdOrCtrl+O")
        .build(app)?;
    let recent_world_item =
        MenuItemBuilder::with_id("recent-world", "&Recent Worlds").build(app)?;

    let save_item = MenuItemBuilder::with_id("save", "&Save")
        .accelerator("CmdOrCtrl+S")
        .build(app)?;
    let save_as_item = MenuItemBuilder::with_id("save-as", "Save &As...")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(app)?;

    let separator = PredefinedMenuItem::separator(app)?;

    let builder = SubmenuBuilder::new(app, "File").items(&[
        &new_file_item,
        &new_world_item,
        &open_world_item,
        &recent_world_item,
        &separator,
        &save_item,
        &save_as_item,
    ]);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .separator()
        .item(&create_settings_item(app)?)
        .separator()
        .close_window_with_text("&Close")
        .separator()
        .quit();

    let menu = builder.build()?;
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
        .bring_all_to_front()
        .separator()
        .close_window();

    let menu = builder.build()?;
    Ok(menu)
}

fn create_help_menu(app: &AppHandle) -> Result<Submenu<Wry>> {
    let builder = SubmenuBuilder::new(app, "Help").id(HELP_SUBMENU_ID);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .item(&create_updates_item(app)?)
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

fn create_updates_item(app: &AppHandle) -> Result<MenuItem<Wry>> {
    MenuItemBuilder::with_id("updates", "Check for &Updates...").build(app)
}

fn create_settings_item(app: &AppHandle) -> Result<MenuItem<Wry>> {
    MenuItemBuilder::with_id("settings", "&Settings...")
        .accelerator("CmdOrCtrl+,")
        .build(app)
}

fn handle_menu_event(_: &AppHandle, event: MenuEvent) {
    log::debug!("Menu item {:?} not handled", event.id)
}
