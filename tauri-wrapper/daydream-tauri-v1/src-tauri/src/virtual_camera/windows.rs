use std::path::Path;
use std::process::{Command, Stdio};
use std::io::Write;
use std::fs::File;
use std::sync::Once;
use std::time::Duration;

use crate::virtual_camera::VirtualCameraError;

static START_VIRTUAL_CAMERA: Once = Once::new();
static mut VIRTUAL_CAMERA_RUNNING: bool = false;
const OBS_WEBSOCKET_PORT: u16 = 4455;

pub fn is_obs_installed() -> bool {
    let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    
    let obs_path_64 = format!("{}\\obs-studio\\bin\\64bit\\obs64.exe", program_files);
    let obs_path_32 = format!("{}\\obs-studio\\bin\\64bit\\obs64.exe", program_files_x86);
    
    let exists_64 = Path::new(&obs_path_64).exists();
    let exists_32 = Path::new(&obs_path_32).exists();
    
    println!("🔍 Checking if OBS is installed at: {}", obs_path_64);
    println!("🔍 Checking if OBS is installed at: {}", obs_path_32);
    
    exists_64 || exists_32
}

fn get_obs_path() -> Option<String> {
    let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    
    let obs_path_64 = format!("{}\\obs-studio\\bin\\64bit\\obs64.exe", program_files);
    let obs_path_32 = format!("{}\\obs-studio\\bin\\64bit\\obs64.exe", program_files_x86);
    
    if Path::new(&obs_path_64).exists() {
        Some(obs_path_64)
    } else if Path::new(&obs_path_32).exists() {
        Some(obs_path_32)
    } else {
        None
    }
}

pub fn is_obs_plugin_installed() -> bool {
    is_obs_installed()
}

pub fn start_obs_with_websocket() -> Result<(), VirtualCameraError> {
    if !is_obs_installed() {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    let obs_path = match get_obs_path() {
        Some(path) => path,
        None => return Err(VirtualCameraError::NotImplemented),
    };
    
    println!("🎥 Starting OBS with WebSocket server enabled");
    
    match Command::new(obs_path)
        .args(&[
            "--startVirtualCam",
            "--minimize-to-tray",
            "--websocket_port", &OBS_WEBSOCKET_PORT.to_string()
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn() {
            Ok(child) => {
                println!("🎥 OBS started with PID: {:?}", child.id());
                unsafe { VIRTUAL_CAMERA_RUNNING = true; }
            },
            Err(e) => {
                println!("❌ Failed to start OBS: {}", e);
            }
        }
        
    std::thread::sleep(Duration::from_secs(2));
    
    if unsafe { VIRTUAL_CAMERA_RUNNING } {
        Ok(())
    } else {
        Err(VirtualCameraError::FailedToStart)
    }
}

pub fn start_obs_virtual_camera() -> Result<(), VirtualCameraError> {
    if !is_obs_installed() {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    let obs_path = match get_obs_path() {
        Some(path) => path,
        None => return Err(VirtualCameraError::NotImplemented),
    };
    
    START_VIRTUAL_CAMERA.call_once(|| {
        println!("🎥 Starting OBS Virtual Camera in headless mode");
        
        match Command::new(obs_path)
            .args(&["--startVirtualCam", "--minimize-to-tray"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn() {
                Ok(child) => {
                    println!("🎥 OBS Virtual Camera started with PID: {:?}", child.id());
                    unsafe { VIRTUAL_CAMERA_RUNNING = true; }
                },
                Err(e) => {
                    println!("❌ Failed to start OBS Virtual Camera: {}", e);
                }
            }
            
        std::thread::sleep(Duration::from_secs(2));
    });
    
    if unsafe { VIRTUAL_CAMERA_RUNNING } {
        Ok(())
    } else {
        Err(VirtualCameraError::FailedToStart)
    }
}

pub fn is_virtual_camera_running() -> bool {
    unsafe { VIRTUAL_CAMERA_RUNNING }
}

pub fn send_frame_to_virtual_camera(frame_data: &[u8]) -> Result<(), VirtualCameraError> {
    if !is_virtual_camera_running() {
        return Err(VirtualCameraError::StreamNotFound);
    }
    
    println!("⚠️ Legacy send_frame_to_virtual_camera called - using WebSocket instead");
    
    Ok(())
}

pub fn stop_obs_virtual_camera() -> Result<(), VirtualCameraError> {
    if !unsafe { VIRTUAL_CAMERA_RUNNING } {
        return Ok(());
    }
    
    println!("🛑 Stopping OBS Virtual Camera");
    
    match force_kill_obs_processes() {
        Ok(_) => {
            println!("💥 Successfully terminated all OBS processes");
            unsafe { VIRTUAL_CAMERA_RUNNING = false; }
            Ok(())
        },
        Err(e) => {
            println!("⚠️ Error killing OBS processes: {:?}", e);
            unsafe { VIRTUAL_CAMERA_RUNNING = false; }
            Ok(())
        }
    }
}

pub fn force_kill_obs_processes() -> Result<(), crate::virtual_camera::VirtualCameraError> {
    use std::process::Command;
    
    println!("🔍 Looking for OBS processes to forcefully terminate on Windows");
    
    let kill_output = Command::new("taskkill")
        .args(["/F", "/IM", "obs64.exe"])
        .output();
        
    match kill_output {
        Ok(output) => {
            if output.status.success() {
                println!("💥 Successfully terminated obs64.exe processes");
            } else {
                println!("ℹ️ No obs64.exe processes needed to be terminated (or taskkill failed)");
            }
        },
        Err(e) => {
            println!("⚠️ Error executing taskkill command for obs64.exe: {}", e);
        }
    }
    
    let kill_32bit = Command::new("taskkill")
        .args(["/F", "/IM", "obs32.exe"])
        .output();
        
    if let Ok(output) = kill_32bit {
        if output.status.success() {
            println!("💥 Terminated obs32.exe processes");
        }
    }
    
    for process_name in &["obs-websocket.exe", "obs-virtual-cam.exe"] {
        let kill_helper = Command::new("taskkill")
            .args(["/F", "/IM", process_name])
            .output();
            
        if let Ok(output) = kill_helper {
            if output.status.success() {
                println!("💥 Terminated {} processes", process_name);
            }
        }
    }
    
    println!("✅ OBS process termination complete");
    Ok(())
} 