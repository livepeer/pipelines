#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate daydream_tauri_v1_lib as lib;

use tauri::{command};
use tauri_plugin_http::init as init_http;
use tauri_plugin_shell::init as init_shell;

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Daydream!", name)
}

#[command]
fn debug_info() -> String {
    format!("Tauri v2 app is running.")
}

#[command]
async fn handle_stream_url(url: String) -> Result<String, String> {
    println!("Received stream URL: {}", url);
    
    match lib::virtual_camera::set_obs_browser_source(url).await {
        Ok(message) => Ok(message),
        Err(err) => Err(format!("Error: {:?}", err))
    }
}

#[command]
async fn stop_virtual_camera() -> Result<String, String> {
    println!("Stopping virtual camera and cleaning up resources");
    
    match lib::virtual_camera::cleanup_virtual_camera().await {
        Ok(message) => Ok(message),
        Err(err) => Err(format!("Error stopping virtual camera: {:?}", err))
    }
}

#[command]
async fn force_kill_obs() -> Result<String, String> {
    println!("Forcefully killing all OBS processes");
    
    match lib::virtual_camera::force_kill_obs().await {
        Ok(message) => Ok(message),
        Err(err) => Err(format!("Error forcefully killing OBS: {:?}", err))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(init_http())
        .plugin(init_shell())
        .setup(|app| {
            let app_handle = app.handle();
            
            // Initialize the virtual camera module
            lib::virtual_camera::init(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            debug_info,
            handle_stream_url,
            lib::virtual_camera::is_obs_installed,
            lib::virtual_camera::is_obs_plugin_installed,
            lib::virtual_camera::start_obs_virtual_camera,
            lib::virtual_camera::stop_obs_virtual_camera,
            lib::virtual_camera::is_virtual_camera_running,
            lib::virtual_camera::enable_virtual_camera_for_stream,
            lib::virtual_camera::get_obs_status,
            stop_virtual_camera,
            force_kill_obs,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}

fn main() {
    run();
}
