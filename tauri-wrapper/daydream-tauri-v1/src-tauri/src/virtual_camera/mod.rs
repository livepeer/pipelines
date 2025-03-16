use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use std::time::Duration;
use tokio::time::sleep;

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;
pub mod obs_client; // OBS WebSocket integration

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VirtualCameraError {
    NotImplemented,
    FailedToStart,
    InvalidInput,
    StreamNotFound,
    MP4Error,
}

#[tauri::command]
pub fn is_obs_installed() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos::is_obs_installed()
    }
    #[cfg(target_os = "windows")]
    {
        windows::is_obs_installed()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false // Not supported on other platforms
    }
}

#[tauri::command]
pub fn is_obs_plugin_installed() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos::is_obs_plugin_installed()
    }
    #[cfg(target_os = "windows")]
    {
        windows::is_obs_plugin_installed()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false // Not supported on other platforms
    }
}

pub fn init<R: Runtime>(_app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

#[tauri::command]
pub async fn start_obs_virtual_camera() -> Result<(), VirtualCameraError> {
    // Start OBS with WebSocket server enabled
    #[cfg(target_os = "macos")]
    {
        macos::start_obs_with_websocket()?;
    }
    #[cfg(target_os = "windows")]
    {
        windows::start_obs_with_websocket()?;
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    obs_client::initialize_obs_client().await?;
    
    Ok(())
}

#[tauri::command]
pub async fn stop_obs_virtual_camera() -> Result<(), VirtualCameraError> {

    match obs_client::reset_connection().await {
        Ok(_) => println!("🧹 Reset WebSocket connection without attempting to close it"),
        Err(e) => println!("⚠️ Error resetting WebSocket connection: {:?}", e)
    }
    
    #[cfg(target_os = "macos")]
    {
        macos::stop_obs_virtual_camera()?;
    }
    #[cfg(target_os = "windows")]
    {
        windows::stop_obs_virtual_camera()?;
    }
    
    Ok(())
}

#[tauri::command]
pub fn is_virtual_camera_running() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos::is_virtual_camera_running()
    }
    #[cfg(target_os = "windows")]
    {
        windows::is_virtual_camera_running()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false // Not supported on other platforms
    }
}

#[tauri::command]
pub async fn enable_virtual_camera_for_stream<R: Runtime>(
    _app_handle: AppHandle<R>,
    _stream_id: String,
    enable: bool,
) -> Result<(), VirtualCameraError> {    
    if enable {
        match start_obs_virtual_camera().await {
            Ok(_) => println!("🎥 Successfully started OBS virtual camera with WebSocket"),
            Err(e) => println!("⚠️ Failed to start OBS virtual camera with WebSocket: {:?}", e)
        }
    } else {
        match stop_obs_virtual_camera().await {
            Ok(_) => println!("🛑 Successfully stopped OBS virtual camera"),
            Err(e) => println!("⚠️ Failed to stop OBS virtual camera: {:?}", e)
        }
    }
    
    Ok(())
}

pub async fn set_obs_browser_source(url: String) -> Result<String, VirtualCameraError> {
    // Check if OBS is already running
    let was_running = is_virtual_camera_running();
    
    if !was_running {
        println!("OBS not running, starting OBS virtual camera");
        
        #[cfg(target_os = "macos")]
        macos::start_obs_with_websocket()?;
        
        #[cfg(target_os = "windows")]
        windows::start_obs_with_websocket()?;
        
        println!("⏳ Waiting for OBS to initialize...");
        std::thread::sleep(Duration::from_secs(5));
    }
    
    let mut attempts = 0;
    let max_attempts = 3;
    
    while attempts < max_attempts {
        match obs_client::set_browser_source(&url).await {
            Ok(_) => {
                println!("✅ Successfully set browser source to URL: {}", url);
                
                match obs_client::start_virtual_camera().await {
                    Ok(_) => println!("✅ Started virtual camera successfully"),
                    Err(e) => println!("⚠️ Warning: Failed to start virtual camera: {:?}", e)
                }
                
                return Ok(format!("Browser source set to: {}", url));
            },
            Err(e) => {
                attempts += 1;
                println!("⚠️ Attempt {}/{}: Failed to set browser source: {:?}", attempts, max_attempts, e);
                
                if attempts < max_attempts {
                    println!("⏳ Waiting before retrying...");
                    sleep(Duration::from_secs(2)).await;
                } else {
                    println!("❌ All attempts failed, giving up");
                    return Err(VirtualCameraError::FailedToStart);
                }
            }
        }
    }
    
    Err(VirtualCameraError::FailedToStart)
}

pub async fn cleanup_virtual_camera() -> Result<String, VirtualCameraError> {
    println!("🧹 Cleaning up virtual camera resources");
    
    match obs_client::remove_browser_source().await {
        Ok(_) => {
            println!("✅ Successfully cleaned up virtual camera resources");
            Ok("Virtual camera resources cleaned up successfully".to_string())
        },
        Err(e) => {
            println!("⚠️ Error cleaning up virtual camera: {:?}", e);
            Err(e)
        }
    }
}

pub async fn force_kill_obs() -> Result<String, VirtualCameraError> {
    println!("🔨 Forcefully terminating all OBS processes");
    
    match obs_client::reset_connection().await {
        Ok(_) => println!("🧹 Reset WebSocket connection without attempting to close it"),
        Err(e) => println!("⚠️ Error resetting WebSocket connection: {:?}", e)
    }
    
    #[cfg(target_os = "macos")]
    {
        if let Err(e) = macos::force_kill_obs_processes() {
            println!("⚠️ Error killing OBS processes on macOS: {:?}", e);
            return Err(VirtualCameraError::FailedToStart);
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = windows::force_kill_obs_processes() {
            println!("⚠️ Error killing OBS processes on Windows: {:?}", e);
            return Err(VirtualCameraError::FailedToStart);
        }
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    println!("💥 Successfully terminated all OBS processes");
    Ok("All OBS processes forcefully terminated".to_string())
} 