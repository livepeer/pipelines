use std::process::{Command, Stdio};
use crate::virtual_camera::VirtualCameraError;
use std::path::Path;
use std::sync::Once;
use std::time::Duration;
use serde::{Serialize, Deserialize};

const OBS_PATH: &str = "/Applications/OBS.app/Contents/MacOS/obs";
const OBS_PLUGIN_PATH: &str = "/Library/CoreMediaIO/Plug-Ins/DAL";
const OBS_VIRTUAL_CAM_PIPE: &str = "/tmp/obs_virtual_camera_pipe";
const OBS_WEBSOCKET_PORT: u16 = 4455;
const OBS_WEBSOCKET_PASSWORD: &str = "daydream-virtual-camera-2025";
static START_VIRTUAL_CAMERA: Once = Once::new();
static mut VIRTUAL_CAMERA_RUNNING: bool = false;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ObsStatus {
    installed: bool,
    websocket_plugin_available: bool,
    websocket_enabled: bool,
    virtual_camera_plugin_available: bool,
    version: String,
    version_supported: bool,  // true if >= 30.0
    message: String,
}

pub fn is_obs_installed() -> bool {
    let path_exists = Path::new(OBS_PATH).exists();
    println!("🔍 Checking if OBS is installed at: {} => {}", OBS_PATH, path_exists);
    path_exists
}

pub fn is_obs_plugin_installed() -> bool {
    let dal_dir = Path::new(OBS_PLUGIN_PATH);
    let path_exists = dal_dir.exists();
    println!("🔍 Checking if OBS plugin is installed at: {} => {}", OBS_PLUGIN_PATH, path_exists);
    path_exists
}

pub fn get_obs_status() -> ObsStatus {
    let obs_installed = is_obs_installed();
    let virtual_camera_plugin_available = is_obs_plugin_installed();
    let websocket_plugin_available = check_obs_websocket_plugin();
    let websocket_enabled = check_obs_websocket_enabled();
    
    let (version, version_supported) = if obs_installed {
        get_obs_version()
    } else {
        ("Not installed".to_string(), false)
    };
    
    let message = if !obs_installed {
        "OBS is not installed. Please install OBS Studio from https://obsproject.com".to_string()
    } else if !version_supported {
        format!("OBS version {} is too old. Version 30.0 or later is required.", version)
    } else if !virtual_camera_plugin_available {
        "OBS virtual camera plugin is not installed. Please ensure OBS is set up correctly.".to_string()
    } else if !websocket_plugin_available {
        "OBS WebSocket plugin is not found. Please install from https://github.com/obsproject/obs-websocket/releases".to_string()
    } else if !websocket_enabled {
        "WebSocket server is not enabled in OBS. Please enable it in Tools > WebSocket Server Settings.".to_string()
    } else {
        format!("OBS {} is properly installed and configured", version)
    };
    
    ObsStatus {
        installed: obs_installed,
        websocket_plugin_available,
        websocket_enabled,
        virtual_camera_plugin_available,
        version,
        version_supported,
        message,
    }
}

fn check_for_obs_processes() -> bool {
    let output = Command::new("pgrep")
        .args(&["-l", "-f", "OBS.app"])
        .output();
    
    if let Ok(out) = output {
        if !out.stdout.is_empty() {
            let processes = String::from_utf8_lossy(&out.stdout);
            println!("🔍 Found existing OBS processes: {}", processes);
            return true;
        }
    }
    
    println!("🔍 No existing OBS processes found");
    false
}

fn terminate_obs_processes() -> bool {
    println!("🛑 Terminating all OBS processes...");
    let output = Command::new("pkill")
        .args(&["-f", "OBS.app"])
        .output();
    
    if let Ok(out) = output {
        if out.status.success() {
            println!("✅ Successfully terminated OBS processes");
            std::thread::sleep(Duration::from_secs(1));
            return true;
        } else {
            println!("ℹ️ No OBS processes needed to be terminated");
        }
    } else {
        println!("⚠️ Failed to run pkill command");
    }
    
    false
}

fn check_obs_websocket_plugin() -> bool {
    let obs_plugins_dir = Path::new("/Applications/OBS.app/Contents/PlugIns");
    
    let websocket_plugin_path = obs_plugins_dir.join("obs-websocket.plugin");
    
    if websocket_plugin_path.exists() {
        println!("✅ Found WebSocket plugin at: {:?}", websocket_plugin_path);
        return true;
    }
    
    let alt_path = Path::new("/Applications/OBS.app/Contents/Plugins/obs-websocket.plugin");
    if alt_path.exists() {
        println!("✅ Found WebSocket plugin at alternative location: {:?}", alt_path);
        return true;
    }
    
    let bundled_plugins_dir = Path::new("/Applications/OBS.app/Contents/Resources/obs-plugins");
    if bundled_plugins_dir.exists() {
        println!("🔍 Checking bundled plugins directory: {:?}", bundled_plugins_dir);
        
        if bundled_plugins_dir.join("obs-websocket").exists() {
            println!("✅ Found WebSocket plugin in bundled plugins");
            return true;
        }
        
        if let Ok(entries) = std::fs::read_dir(bundled_plugins_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let file_name = entry.file_name();
                    let file_name_str = file_name.to_string_lossy();
                    if file_name_str.contains("websocket") {
                        println!("✅ Found WebSocket plugin file: {}", file_name_str);
                        return true;
                    }
                }
            }
        }
    }
    
    println!("❌ WebSocket plugin not found in OBS installation");
    println!("ℹ️ Please ensure the obs-websocket plugin is installed in OBS");
    println!("ℹ️ You can download it from: https://github.com/obsproject/obs-websocket/releases");
    println!("ℹ️ Or enable it in OBS under Tools > WebSocket Server Settings");
    
    false
}

fn check_obs_websocket_enabled() -> bool {
    println!("ℹ️ Check will happen on connection)");
    return true;
}

pub fn start_obs_with_websocket() -> Result<(), VirtualCameraError> {
    let status = get_obs_status();
    
    if !status.installed {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    if !status.virtual_camera_plugin_available {
        return Err(VirtualCameraError::NotImplemented);
    }
    
    if !status.websocket_plugin_available {
        println!("⚠️ WebSocket plugin not found, but continuing anyway...");
        println!("ℹ️ We'll try command line arguments, but this may fail");
    }
    
    if check_for_obs_processes() {
        println!("🔄 OBS is already running, using existing instance");
        unsafe { VIRTUAL_CAMERA_RUNNING = true; }
        return Ok(());
    }
    
    // Only start a new OBS instance if one is not already running
    println!("🎥 Starting new OBS instance with virtual camera");
    
    let version_output = Command::new(OBS_PATH)
        .args(&["--version"])
        .output();
    
    if let Ok(output) = version_output {
        let version = String::from_utf8_lossy(&output.stdout);
        println!("ℹ️ OBS Version: {}", version.trim());
    }
    
    let args: Vec<String> = vec![
        "--minimize-to-tray".to_string(),
        "--disable-shutdown-check".to_string(),
        "--multi".to_string(),
        "--portable".to_string(),
    ];
    
    println!("🚀 Starting OBS with arguments: {:?}", args);
    
    match Command::new(OBS_PATH)
        .args(&args)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn() {
            Ok(child) => {
                println!("🎥 OBS started with PID: {:?}", child.id());
                unsafe { VIRTUAL_CAMERA_RUNNING = true; }
                
                std::thread::sleep(Duration::from_secs(3));
                if check_for_obs_processes() {
                    println!("✅ Confirmed OBS is running");
                } else {
                    println!("⚠️ OBS process may have failed to start properly");
                }
            }
            Err(e) => {
                println!("❌ Failed to start OBS: {}", e);
            }
        }
        
    std::thread::sleep(Duration::from_secs(1));
    
    if unsafe { VIRTUAL_CAMERA_RUNNING } {
        Ok(())
    } else {
        Err(VirtualCameraError::FailedToStart)
    }
}

pub fn start_obs_virtual_camera() -> Result<(), VirtualCameraError> {
    println!("ℹ️ start_obs_virtual_camera called - using WebSocket version instead");
    start_obs_with_websocket()
}

pub fn is_virtual_camera_running() -> bool {
    unsafe { VIRTUAL_CAMERA_RUNNING }
}

pub fn stop_obs_virtual_camera() -> Result<(), VirtualCameraError> {
    if !unsafe { VIRTUAL_CAMERA_RUNNING } {
        println!("ℹ️ OBS virtual camera is not running, nothing to stop");
        return Ok(());
    }
    
    println!("🛑 Stopping OBS Virtual Camera");
    
    match force_kill_obs_processes() {
        Ok(_) => {
            println!("💥 Successfully terminated all OBS processes");
        },
        Err(e) => {
            println!("⚠️ Error killing OBS processes: {:?}", e);
        }
    }
    
    if Path::new(OBS_VIRTUAL_CAM_PIPE).exists() {
        match std::fs::remove_file(OBS_VIRTUAL_CAM_PIPE) {
            Ok(_) => println!("✅ Removed virtual camera pipe"),
            Err(e) => println!("⚠️ Failed to remove pipe: {}", e)
        }
    }
    
    unsafe { VIRTUAL_CAMERA_RUNNING = false; }
    
    println!("✅ OBS Virtual Camera stopped successfully");
    Ok(())
}

pub fn force_kill_obs_processes() -> Result<(), crate::virtual_camera::VirtualCameraError> {
    use std::process::Command;
    
    println!("🔍 Looking for OBS processes to forcefully terminate on macOS");
    
    let kill_output = Command::new("killall")
        .args(["-9", "obs"])
        .output();
        
    match kill_output {
        Ok(output) => {
            if output.status.success() {
                println!("💥 Successfully terminated OBS processes with SIGKILL");
            } else {
                println!("ℹ️ No OBS processes needed to be terminated (or killall failed)");
            }
        },
        Err(e) => {
            println!("⚠️ Error executing killall command: {}", e);
        }
    }
    
    let kill_websocket = Command::new("killall")
        .args(["-9", "obs-websocket"])
        .output();
        
    if let Ok(output) = kill_websocket {
        if output.status.success() {
            println!("💥 Terminated obs-websocket processes");
        }
    }
    
    let kill_vcam = Command::new("killall")
        .args(["-9", "obs-virtual-cam"])
        .output();
        
    if let Ok(output) = kill_vcam {
        if output.status.success() {
            println!("💥 Terminated obs-virtual-cam processes");
        }
    }
    
    println!("✅ OBS process termination complete");
    Ok(())
}

fn get_obs_version() -> (String, bool) {
    let version_output = Command::new(OBS_PATH)
        .args(&["--version"])
        .output();
    
    if let Ok(output) = version_output {
        let version_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        let version_parts: Vec<&str> = version_str.split('-').collect();
        if version_parts.len() > 1 {
            let version_number = version_parts[1].trim();
            
            if let Some(major_version) = version_number.split('.').next() {
                if let Ok(major) = major_version.parse::<u32>() {
                    return (version_str, major >= 30);
                }
            }
        }
        
        return (version_str, false); // Could not parse version properly
    }
    
    ("Unknown".to_string(), false)
} 