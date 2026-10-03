mod app;
mod command;
mod database;
mod event;
mod menu;
mod model;
mod state;
mod store;
mod utils;
mod world;

#[cfg(test)]
mod test_support;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(all(debug_assertions, not(feature = "desktop-tests")))]
    let devtools_plugin = tauri_plugin_devtools::init::<tauri::Wry>();

    let specta_builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(command::commands())
        .events(event::events())
        .constant("EXTENSION", world::EXTENSION)
        .constant("TITLE_BAR_HEIGHT", app::TITLE_BAR_HEIGHT);

    #[cfg(all(debug_assertions, not(mobile), not(feature = "desktop-tests")))]
    {
        use specta_typescript::Typescript;

        if let Err(error) =
            specta_builder.export(Typescript::default(), "../src/generated/bindings.ts")
        {
            log::error!("failed to export TypeScript bindings: {error}");
        }
    }

    let builder = tauri::Builder::default();

    #[cfg(feature = "desktop-tests")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(
        app::handle_single_instance_launch,
    ));

    let builder = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_prevent_default::debug());

    #[cfg(all(debug_assertions, not(feature = "desktop-tests")))]
    let builder = builder.plugin(devtools_plugin);

    #[cfg(not(debug_assertions))]
    let builder = builder.plugin(
        tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Info)
            .filter(|metadata| metadata.target().starts_with(env!("CARGO_CRATE_NAME")))
            .format(|out, message, record| {
                out.finish(format_args!(
                    "[{}]|{:<5}: {}",
                    chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                    record.level(),
                    message
                ))
            })
            .build(),
    );

    let invoke_handler = specta_builder.invoke_handler();

    #[cfg(feature = "desktop-tests")]
    #[allow(clippy::items_after_statements)]
    let testing_handler: fn(tauri::ipc::Invoke<tauri::Wry>) -> bool =
        tauri::generate_handler![command::testing::test_save_world_as];

    #[cfg(feature = "desktop-tests")]
    let invoke_handler = move |invoke: tauri::ipc::Invoke<tauri::Wry>| {
        if invoke.message.command() == "test_save_world_as" {
            testing_handler(invoke)
        } else {
            invoke_handler(invoke)
        }
    };

    if let Err(error) = builder
        .manage(state::AppState::default())
        .invoke_handler(invoke_handler)
        .setup(move |app| {
            let handle = app.handle();
            specta_builder.mount_events(handle);

            #[cfg(target_os = "macos")]
            {
                let state = state::get_state(handle);
                let menu_manager = state.menu_manager();
                tauri::async_runtime::block_on(menu_manager.init(handle))?;
            }

            #[cfg(desktop)]
            tauri::async_runtime::block_on(app::open_initial_windows(handle))?;

            #[cfg(not(desktop))]
            tauri::async_runtime::block_on(app::spawn_window(handle, None))?;

            Ok(())
        })
        .run(tauri::generate_context!())
    {
        log::error!("error while running Tauri application: {error}");
        std::process::exit(1);
    }
}
