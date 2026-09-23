#![cfg(target_os = "macos")]

use objc2_app_kit::{NSWindow, NSWindowButton};
use tauri::{Runtime, WebviewWindow};

pub fn center_traffic_lights<R: Runtime>(
    window: &WebviewWindow<R>,
    leading_inset: f64,
    title_bar_height: f64,
) -> tauri::Result<()> {
    let native_window = window.clone();

    window.run_on_main_thread(move || {
        let Ok(ns_window) = native_window.ns_window() else {
            return;
        };

        // SAFETY: Tauri guarantees that `ns_window` is a valid NSWindow pointer while
        // `native_window` is alive. This closure runs on AppKit's main thread and keeps
        // the cloned WebviewWindow alive for the duration of every Objective-C call.
        let window = unsafe { &*ns_window.cast::<NSWindow>() };
        center_native_traffic_lights(window, leading_inset, title_bar_height);
    })
}

fn center_native_traffic_lights(window: &NSWindow, leading_inset: f64, title_bar_height: f64) {
    let Some(close) = window.standardWindowButton(NSWindowButton::CloseButton) else {
        return;
    };
    let Some(minimize) = window.standardWindowButton(NSWindowButton::MiniaturizeButton) else {
        return;
    };
    let Some(zoom) = window.standardWindowButton(NSWindowButton::ZoomButton) else {
        return;
    };
    // SAFETY: Standard window buttons are attached to AppKit's title-bar view hierarchy.
    let Some(button_group) = (unsafe { close.superview() }) else {
        return;
    };
    // SAFETY: The standard button group is attached to the title-bar container.
    let Some(title_bar_container) = (unsafe { button_group.superview() }) else {
        return;
    };

    let spacing = minimize.frame().origin.x - close.frame().origin.x;
    let mut container_frame = title_bar_container.frame();
    container_frame.size.height = title_bar_height;
    container_frame.origin.y = window.frame().size.height - title_bar_height;
    title_bar_container.setFrame(container_frame);

    for (index, button) in [close, minimize, zoom].into_iter().enumerate() {
        let frame = button.frame();
        let frame_in_container = button_group.convertRect_toView(frame, Some(&title_bar_container));
        let target_x = leading_inset + index as f64 * spacing;
        let target_y = (title_bar_height - frame_in_container.size.height) / 2.0;
        let mut origin = frame.origin;
        origin.x += target_x - frame_in_container.origin.x;
        origin.y += target_y - frame_in_container.origin.y;
        button.setFrameOrigin(origin);
        button.updateTrackingAreas();
    }

    title_bar_container.updateTrackingAreas();
}
