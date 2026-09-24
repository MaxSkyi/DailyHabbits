use chrono::{Duration, Local, Timelike};
use std::sync::atomic::{AtomicU32, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WindowEvent,
};

static DAY_ROLLOVER_HOUR: AtomicU32 = AtomicU32::new(3);

#[tauri::command]
fn minimize_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_maximize_window(app_handle: AppHandle) -> Result<bool, String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let is_max = window.is_maximized().unwrap_or(false);
        if is_max {
            window.unmaximize().map_err(|e| e.to_string())?;
            Ok(false)
        } else {
            window.maximize().map_err(|e| e.to_string())?;
            Ok(true)
        }
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn close_to_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn get_rollover_hour() -> u32 {
    DAY_ROLLOVER_HOUR.load(Ordering::Relaxed)
}

#[tauri::command]
fn set_rollover_hour(hour: u32) -> Result<(), String> {
    if hour > 23 {
        return Err("Година повинна бути від 0 до 23".into());
    }
    DAY_ROLLOVER_HOUR.store(hour, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
fn get_logical_today(rollover_hour: Option<u32>) -> String {
    let cutoff = rollover_hour.unwrap_or_else(|| DAY_ROLLOVER_HOUR.load(Ordering::Relaxed));
    let now = Local::now();
    let effective_date = if now.hour() < cutoff {
        (now - Duration::days(1)).date_naive()
    } else {
        now.date_naive()
    };
    effective_date.format("%Y-%m-%d").to_string()
}

#[tauri::command]
fn export_backup_file(content: String, default_filename: String) -> Result<bool, String> {
    let file = rfd::FileDialog::new()
        .set_file_name(&default_filename)
        .add_filter("JSON Files", &["json"])
        .save_file();

    if let Some(path) = file {
        std::fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Ok(false) // User cancelled dialog
    }
}

#[tauri::command]
fn import_backup_file() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("JSON Files", &["json"])
        .pick_file();

    if let Some(path) = file {
        let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None) // User cancelled dialog
    }
}

#[tauri::command]
fn restart_app(app_handle: AppHandle) {
    app_handle.restart();
}

fn calculate_current_logical_date(cutoff: u32) -> String {
    let now = Local::now();
    let effective_date = if now.hour() < cutoff {
        (now - Duration::days(1)).date_naive()
    } else {
        now.date_naive()
    };
    effective_date.format("%Y-%m-%d").to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            toggle_maximize_window,
            close_to_tray,
            show_window,
            get_rollover_hour,
            set_rollover_hour,
            get_logical_today,
            export_backup_file,
            import_backup_file,
            restart_app,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();

            let is_minimized_launch = std::env::args().any(|arg| arg == "--minimized" || arg == "-m");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.center();
                if !is_minimized_launch {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            // Setup Tray Menu
            let open_item = MenuItem::with_id(app, "open", "Відкрити", true, None::<&str>)?;
            let settings_item =
                MenuItem::with_id(app, "settings", "Налаштування", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Вийти", true, None::<&str>)?;

            let tray_menu =
                Menu::with_items(app, &[&open_item, &settings_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .tooltip("Трекер Звичок");

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            tray_builder
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            let _ = window.emit("open-settings", ());
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let is_minimized = window.is_minimized().unwrap_or(false);
                                if is_minimized {
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                } else {
                                    let _ = window.hide();
                                }
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Background Midnight Daemon
            let bg_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let mut last_date = calculate_current_logical_date(3);

                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(30)).await;

                    let cutoff = DAY_ROLLOVER_HOUR.load(Ordering::Relaxed);
                    let current_date = calculate_current_logical_date(cutoff);

                    if current_date != last_date {
                        last_date = current_date.clone();
                        let payload = serde_json::json!({
                            "logical_date": current_date,
                            "cutoff_hour": cutoff
                        });
                        let _ = bg_handle.emit("day-changed", payload);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent window from closing, hide to system tray instead
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
