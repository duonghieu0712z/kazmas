mod app;
mod command;
mod menu;
mod state;
mod world;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let specta_builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(command::commands())
        .typ::<menu::MenuCommand>()
        .typ::<menu::MenuGroup>()
        .typ::<menu::MenuItem>();

    #[cfg(all(debug_assertions, not(mobile)))]
    {
        use specta_typescript::Typescript;

        specta_builder
            .export(Typescript::default(), "../src/generated/bindings.ts")
            .unwrap();
    }

    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(
        app::handle_single_instance_launch,
    ));

    let builder = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_prevent_default::debug());

    #[cfg(debug_assertions)]
    let builder = builder.plugin(tauri_plugin_devtools::init());

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

    builder
        .manage(state::AppState::default())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            let handle = app.handle();

            #[cfg(target_os = "macos")]
            menu::create_menu(handle)?;

            #[cfg(desktop)]
            tauri::async_runtime::block_on(app::open_initial_windows(handle))?;

            #[cfg(not(desktop))]
            tauri::async_runtime::block_on(app::spawn_window(handle, None))?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
