use tauri_specta::Builder;

mod command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let specta_builder = Builder::<tauri::Wry>::new().commands(command::commands());

    #[cfg(all(debug_assertions, not(mobile)))]
    {
        use specta_typescript::Typescript;

        specta_builder
            .export(Typescript::default(), "../src/generated/bindings.ts")
            .unwrap();
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;

                _app.get_webview_window("main").unwrap().open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
