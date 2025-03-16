use std::sync::Arc;
use once_cell::sync::Lazy;
use tokio::time::{sleep, Duration};
use crate::virtual_camera::VirtualCameraError;
use serde_json::{json, Value};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::Mutex as TokioMutex;
use uuid::Uuid;
use sha2::{Sha256, Digest};
use base64::{engine::general_purpose, Engine as _};

const OBS_WEBSOCKET_HOST: &str = "localhost";
const OBS_WEBSOCKET_PORT: u16 = 4455;
const OBS_WEBSOCKET_PASSWORD: &str = "daydream-virtual-camera-2025";

const SCENE_NAME: &str = "VirtualCameraScene";
const BROWSER_SOURCE_NAME: &str = "LivepeerDaydreamSource";

pub static WS_CONNECTION: Lazy<Arc<TokioMutex<Option<WebSocketConnection>>>> = 
    Lazy::new(|| Arc::new(TokioMutex::new(None)));

pub struct WebSocketConnection {
    stream: tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>,
}

async fn wait_for_obs_response(expected_op: u64) -> Result<Value, VirtualCameraError> {
    let timeout = Duration::from_secs(10);
    let start_time = std::time::Instant::now();
    let mut last_message_time = start_time;
    
    let mut response_value: Option<Value> = None;
    
    println!("⏱️ Waiting for response with op code {}", expected_op);
    
    while start_time.elapsed() < timeout {
        if last_message_time.elapsed() > Duration::from_secs(2) {
            println!("🔍 No messages for 2 seconds, checking connection status...");
            let mut ws_connection = WS_CONNECTION.lock().await;
            if let Some(connection) = &mut *ws_connection {
                if let Ok(_) = connection.stream.send(Message::Ping(vec![])).await {
                    println!("📡 Sent ping to maintain connection");
                }
            }
            last_message_time = std::time::Instant::now();
        }
        
        let next_message = {
            let timeout_duration = Duration::from_millis(100);
            let mut ws_connection = WS_CONNECTION.lock().await;
            
            if let Some(connection) = &mut *ws_connection {
                match tokio::time::timeout(timeout_duration, connection.stream.next()).await {
                    Ok(result) => result,
                    Err(_) => None
                }
            } else {
                println!("❌ WebSocket connection not initialized");
                return Err(VirtualCameraError::NotImplemented);
            }
        };
        
        if let Some(message_result) = next_message {
            match message_result {
                Ok(Message::Text(text)) => {
                    println!("📥 Received response: {}", text);
                    last_message_time = std::time::Instant::now();
                    
                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let Some(op) = value.get("op").and_then(|op| op.as_u64()) {
                            if op == expected_op {
                                println!("✅ Received expected op code: {}", expected_op);
                                
                                if op == 7 {
                                    if let Some(status) = value.get("d").and_then(|d| d.get("requestStatus")).and_then(|s| s.get("result")) {
                                        if !status.as_bool().unwrap_or(false) {
                                            let error = value.get("d")
                                                .and_then(|d| d.get("requestStatus"))
                                                .and_then(|s| s.get("comment"))
                                                .and_then(|c| c.as_str())
                                                .unwrap_or("Unknown error");
                                            
                                            println!("❌ Request failed: {}", error);
                                            return Err(VirtualCameraError::FailedToStart);
                                        }
                                    }
                                }
                                
                                response_value = Some(value);
                                break;
                            } else {
                                println!("ℹ️ Received unexpected op code: {}, continuing to wait", op);
                            }
                        }
                    }
                },
                Ok(Message::Pong(_)) => {
                    println!("📡 Received pong response");
                    last_message_time = std::time::Instant::now();
                },
                Ok(_) => {
                    println!("📥 Received non-text message");
                    last_message_time = std::time::Instant::now();
                },
                Err(e) => {
                    println!("❌ WebSocket error: {}", e);
                    return Err(VirtualCameraError::FailedToStart);
                }
            }
        } else {
            sleep(Duration::from_millis(50)).await;
        }
    }
    
    if let Some(value) = response_value {
        Ok(value)
    } else {
        println!("⏱️ Timeout waiting for response with op code {}", expected_op);
        Err(VirtualCameraError::FailedToStart)
    }
}

async fn send_websocket_message(message: Message) -> Result<(), VirtualCameraError> {
    let mut ws_connection = WS_CONNECTION.lock().await;
    
    if let Some(connection) = &mut *ws_connection {
        connection.stream.send(message).await.map_err(|e| {
            println!("❌ Failed to send WebSocket message: {}", e);
            VirtualCameraError::FailedToStart
        })
    } else {
        println!("❌ WebSocket connection not initialized");
        Err(VirtualCameraError::NotImplemented)
    }
}

async fn send_identify_with_auth(challenge: String, salt: String) -> Result<(), VirtualCameraError> {
    let auth_response = calculate_auth_response(OBS_WEBSOCKET_PASSWORD, &challenge, &salt);
    
    let identify = json!({
        "op": 1,
        "d": {
            "rpcVersion": 1,
            "authentication": auth_response,
            "eventSubscriptions": 33
        }
    });
    
    println!("📤 Sending OBS WebSocket Identify message with authentication");
    
    let ws_stream_option = {
        let mut ws_connection = WS_CONNECTION.lock().await;
        if let Some(connection) = &mut *ws_connection {
            println!("🔓 Got lock, sending message");
            match connection.stream.send(Message::Text(identify.to_string())).await {
                Ok(_) => {
                    println!("✅ Identify message sent successfully");
                    true
                },
                Err(e) => {
                    println!("❌ Failed to send Identify message: {}", e);
                    return Err(VirtualCameraError::FailedToStart);
                }
            }
        } else {
            println!("❌ WebSocket connection not initialized");
            return Err(VirtualCameraError::NotImplemented);
        }
    };
    
    if ws_stream_option {
        println!("⏱️ Waiting briefly for response");
        sleep(Duration::from_millis(1000)).await;
    }
    
    Ok(())
}

async fn send_identify() -> Result<(), VirtualCameraError> {
    let identify = json!({
        "op": 1,
        "d": {
            "rpcVersion": 1,
            "authentication": null,
            "eventSubscriptions": 33
        }
    });
    
    println!("📤 Sending OBS WebSocket Identify message without authentication");
    
    send_websocket_message(Message::Text(identify.to_string())).await
}

async fn send_request(request_type: &str, data: Option<Value>) -> Result<Value, VirtualCameraError> {
    let request_id = Uuid::new_v4().to_string();
    
    let request = json!({
        "op": 6,
        "d": {
            "requestType": request_type,
            "requestId": request_id,
            "requestData": data.unwrap_or(json!({}))
        }
    });
    
    println!("📤 Sending OBS WebSocket request: {}", request_type);
    println!("📄 Request data: {}", request);
    
    send_websocket_message(Message::Text(request.to_string())).await?;
    
    let response = wait_for_obs_response(7).await?;
    
    println!("✅ Request completed successfully");
    Ok(response)
}

async fn get_message_with_timeout(timeout_duration: Duration) -> Result<Option<Message>, VirtualCameraError> {
    let mut ws_connection = WS_CONNECTION.lock().await;
    
    if let Some(connection) = &mut *ws_connection {
        match tokio::time::timeout(timeout_duration, connection.stream.next()).await {
            Ok(Some(result)) => {
                match result {
                    Ok(message) => Ok(Some(message)),
                    Err(e) => {
                        println!("❌ WebSocket error: {}", e);
                        Err(VirtualCameraError::FailedToStart)
                    }
                }
            },
            Ok(None) => {
                println!("📡 WebSocket stream ended");
                Ok(None)
            },
            Err(_) => {
                Ok(None)
            }
        }
    } else {
        println!("❌ WebSocket connection not initialized");
        Err(VirtualCameraError::NotImplemented)
    }
}

pub async fn initialize_obs_client() -> Result<(), VirtualCameraError> {
    sleep(Duration::from_secs(5)).await;
    
    let ws_url = format!("ws://{}:{}", OBS_WEBSOCKET_HOST, OBS_WEBSOCKET_PORT);
    println!("🔄 Attempting to connect to OBS WebSocket at {}", ws_url);
    println!("🔑 Using password (obscured): {}***", &OBS_WEBSOCKET_PASSWORD[0..4]);
    
    let mut retry_count = 0;
    let max_retries = 5;
    let mut last_error = None;
    let mut auth_challenge: Option<(String, String)> = None;
    
    while retry_count < max_retries {
        match connect_async(&ws_url).await {
            Ok((mut ws_stream, _)) => {
                println!("✅ Connected to OBS WebSocket on attempt {}", retry_count + 1);
                
                println!("📥 Waiting for Hello message from server...");
                
                if let Some(Ok(message)) = ws_stream.next().await {
                    match message {
                        Message::Text(text) => {
                            println!("📥 Received message: {}", text);
                            
                            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                                if let Some(op) = value.get("op").and_then(|op| op.as_u64()) {
                                    if op == 0 {
                                        println!("✅ Received Hello message (op 0)");
                                        
                                        let auth_required = value
                                            .get("d")
                                            .and_then(|d| d.get("authentication"))
                                            .and_then(|auth| auth.get("required"))
                                            .and_then(|req| req.as_bool())
                                            .unwrap_or(false);
                                        
                                        println!("ℹ️ Authentication required: {}", auth_required);
                                        
                                        let has_auth_info = value
                                            .get("d")
                                            .and_then(|d| d.get("authentication"))
                                            .and_then(|auth| auth.get("challenge"))
                                            .is_some();
                                        
                                        if has_auth_info {
                                            println!("🔐 Authentication fields present, extracting challenge and salt");
                                            
                                            let challenge = value
                                                .get("d")
                                                .and_then(|d| d.get("authentication"))
                                                .and_then(|auth| auth.get("challenge"))
                                                .and_then(|c| c.as_str())
                                                .unwrap_or("");
                                                
                                            let salt = value
                                                .get("d")
                                                .and_then(|d| d.get("authentication"))
                                                .and_then(|auth| auth.get("salt"))
                                                .and_then(|s| s.as_str())
                                                .unwrap_or("");
                                                
                                            if !challenge.is_empty() && !salt.is_empty() {
                                                println!("✅ Got challenge and salt from server");
                                                auth_challenge = Some((challenge.to_string(), salt.to_string()));
                                            } else {
                                                println!("❌ Failed to extract challenge or salt");
                                            }
                                        }

                                        if let Some((challenge, _)) = &auth_challenge {
                                            println!("🔐 Authentication challenge: {}", challenge);
                                        }
                                        
                                        let mut ws_connection = WS_CONNECTION.lock().await;
                                        *ws_connection = Some(WebSocketConnection {
                                            stream: ws_stream,
                                        });
                                        println!("🔐 Created WebSocket connection");
                                        drop(ws_connection);
                                        
                                        tokio::spawn(async {
                                            debug_message_receiver().await;
                                        });
                                        
                                        println!("🔄 Processing authentication...");
                                        
                                        sleep(Duration::from_millis(100)).await;
                                        
                                        match &auth_challenge {
                                            Some((challenge, salt)) => {
                                                println!("🔑 Using authentication with challenge: {}", challenge);
                                                send_identify_with_auth(challenge.clone(), salt.clone()).await?
                                            },
                                            None => {
                                                if auth_required {
                                                    println!("⚠️ Authentication is required but challenge extraction failed");
                                                    return Err(VirtualCameraError::FailedToStart);
                                                } else {
                                                    println!("🔓 No authentication required");
                                                    send_identify().await?;
                                                }
                                            }
                                        }
                                        
                                        println!("🕒 Waiting for authentication response...");
                                        
                                        let auth_timeout = Duration::from_secs(10);
                                        let auth_start = std::time::Instant::now();
                                        let mut identified = false;
                                        
                                        while auth_start.elapsed() < auth_timeout && !identified {
                                            match get_message_with_timeout(Duration::from_millis(500)).await {
                                                Ok(Some(Message::Text(text))) => {
                                                    println!("📡 Auth response: {}", text);
                                                    
                                                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                                                        if let Some(op) = value.get("op").and_then(|op| op.as_u64()) {
                                                            if op == 2 {
                                                                println!("✅ Successfully authenticated with OBS");
                                                                identified = true;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                },
                                                Ok(Some(_)) => println!("📡 Received non-text message during auth"),
                                                Ok(None) => {
                                                    println!("⏳ Still waiting for authentication response...");
                                                    sleep(Duration::from_millis(500)).await;
                                                },
                                                Err(e) => {
                                                    println!("⚠️ Error checking for auth response: {:?}", e);
                                                    sleep(Duration::from_millis(500)).await;
                                                }
                                            }
                                        }
                                        
                                        if !identified {
                                            println!("❌ Failed to authenticate: timeout waiting for response");
                                            return Err(VirtualCameraError::FailedToStart);
                                        }
                                        
                                        println!("✅ OBS WebSocket connection established successfully");
                                        return Ok(());
                                    } else {
                                        println!("❌ Unexpected op code: {}", op);
                                    }
                                }
                            }
                        },
                        _ => println!("❌ Received non-text message")
                    }
                } else {
                    println!("❌ Failed to receive Hello message from server");
                }
            },
            Err(e) => {
                println!("⚠️ Failed to connect on attempt {}: {}", retry_count + 1, e);
                last_error = Some(e);
                retry_count += 1;
                
                if retry_count < max_retries {
                    let delay = 2 + retry_count as u64;
                    println!("🔄 Retrying in {} seconds...", delay);
                    sleep(Duration::from_secs(delay)).await;
                }
            }
        }
    }
    
    println!("❌ Failed to connect to OBS WebSocket after {} attempts", max_retries);
    if let Some(e) = last_error {
        println!("❌ Last error: {}", e);
    }
    
    Err(VirtualCameraError::FailedToStart)
}

fn calculate_auth_response(password: &str, challenge: &str, salt: &str) -> String {
    println!("🔐 Calculating authentication response");
    
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(salt.as_bytes());
    let secret = hasher.finalize();
    
    let secret_base64 = general_purpose::STANDARD.encode(secret);
    
    let mut auth_hasher = Sha256::new();
    auth_hasher.update(secret_base64.as_bytes());
    auth_hasher.update(challenge.as_bytes());
    let auth = auth_hasher.finalize();
    
    let auth_response = general_purpose::STANDARD.encode(auth);
    
    println!("✅ Generated authentication response");
    auth_response
}

pub async fn start_virtual_camera() -> Result<(), VirtualCameraError> {
    let vcam_status = send_request("GetVirtualCamStatus", None).await;
    
    let is_active = match vcam_status {
        Ok(response) => {
            response.get("d")
                .and_then(|d| d.get("responseData"))
                .and_then(|rd| rd.get("outputActive"))
                .and_then(|active| active.as_bool())
                .unwrap_or(false)
        },
        Err(_) => false
    };
    
    if is_active {
        println!("ℹ️ Virtual camera is already active");
        return Ok(());
    }
    
    let result = send_request("StartVirtualCam", None).await;
    
    match result {
        Ok(_) => {
            println!("🎥 Started OBS virtual camera");
            Ok(())
        },
        Err(e) => {
            println!("❌ Failed to start virtual camera: {:?}", e);
            Err(e)
        }
    }
}

pub async fn stop_virtual_camera() -> Result<(), VirtualCameraError> {
    send_request("StopVirtualCam", None).await?;
    
    println!("🛑 Stopped OBS virtual camera");
    Ok(())
}

pub async fn is_virtual_camera_active() -> Result<bool, VirtualCameraError> {
    let vcam_status = send_request("GetVirtualCamStatus", None).await;
    
    match vcam_status {
        Ok(response) => {
            let is_active = response.get("d")
                .and_then(|d| d.get("responseData"))
                .and_then(|rd| rd.get("outputActive"))
                .and_then(|active| active.as_bool())
                .unwrap_or(false);
                
            Ok(is_active)
        },
        Err(_) => Ok(false)
    }
}

async fn debug_message_receiver() {
    println!("🐛 Starting debug message receiver");
    
    let timeout = Duration::from_secs(60);
    let start = std::time::Instant::now();
    
    let ws_url = format!("ws://{}:{}", OBS_WEBSOCKET_HOST, OBS_WEBSOCKET_PORT);
    println!("🐛 Debug creating new connection to {}", ws_url);
    
    match connect_async(&ws_url).await {
        Ok((mut ws_stream, _)) => {
            println!("🐛 Debug WebSocket connected successfully");
            
            if let Some(Ok(message)) = ws_stream.next().await {
                match message {
                    Message::Text(text) => {
                        println!("🐛 Debug received Hello: {}", text);
                        
                        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(d) = value.get("d") {
                                if let Some(auth) = d.get("authentication") {
                                    let challenge = auth.get("challenge").and_then(|c| c.as_str()).unwrap_or("");
                                    let salt = auth.get("salt").and_then(|s| s.as_str()).unwrap_or("");
                                    
                                    if !challenge.is_empty() && !salt.is_empty() {
                                        println!("🐛 Debug sending authentication");
                                        
                                        let auth_response = calculate_auth_response(OBS_WEBSOCKET_PASSWORD, challenge, salt);
                                        let identify = json!({
                                            "op": 1,
                                            "d": {
                                                "rpcVersion": 1,
                                                "authentication": auth_response,
                                                "eventSubscriptions": 33
                                            }
                                        });
                                        
                                        if let Err(e) = ws_stream.send(Message::Text(identify.to_string())).await {
                                            println!("🐛 Debug failed to send auth: {}", e);
                                        } else {
                                            println!("🐛 Debug auth sent successfully");
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _ => println!("🐛 Debug received non-text hello message")
                }
            }
            
            while start.elapsed() < timeout {
                match tokio::time::timeout(Duration::from_secs(1), ws_stream.next()).await {
                    Ok(Some(Ok(Message::Text(text)))) => {
                        println!("🐛 Debug received: {}", text);
                        
                        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(op) = value.get("op").and_then(|op| op.as_u64()) {
                                println!("🐛 Debug message op code: {}", op);
                                
                                if op == 2 {
                                    println!("🐛 Debug: OBS identified us successfully!");
                                }
                            }
                        }
                    },
                    Ok(Some(Ok(_))) => println!("🐛 Debug received binary message"),
                    Ok(Some(Err(e))) => {
                        println!("🐛 Debug error: {}", e);
                        // Connection error, break out of the loop
                        println!("🐛 Debug connection error occurred, exiting monitoring loop");
                        break;
                    },
                    Ok(None) => {
                        println!("🐛 Debug connection closed");
                        break;
                    },
                    Err(_) => {
                        // Timeout waiting for a message, continue
                        sleep(Duration::from_millis(100)).await;
                    }
                }
            }
        },
        Err(e) => println!("🐛 Debug failed to connect: {}", e)
    }
    
    println!("🐛 Debug message receiver shutting down");
}

pub async fn disconnect() -> Result<(), VirtualCameraError> {
    let mut ws_connection = WS_CONNECTION.lock().await;
    
    if let Some(connection) = &mut *ws_connection {
        connection.stream.close(None).await.map_err(|e| {
            println!("❌ Failed to close WebSocket connection: {}", e);
            VirtualCameraError::FailedToStart
        })?;
        
        *ws_connection = None;
        
        println!("👋 Disconnected from OBS WebSocket");
    }
    
    Ok(())
}

pub async fn reset_connection() -> Result<(), VirtualCameraError> {
    // Reset the connection without trying to close it gracefully
    let mut ws_connection = WS_CONNECTION.lock().await;
    *ws_connection = None;
    println!("🧹 Reset WebSocket connection without attempting to close it");
    Ok(())
}

pub async fn set_browser_source(url: &str) -> Result<(), VirtualCameraError> {
    println!("🌐 Setting up browser source with URL: {}", url);
    
    create_browser_source(url).await
}

pub async fn create_browser_source(url: &str) -> Result<(), VirtualCameraError> {
    println!("🌐 Setting up browser source with URL: {}", url);
    
    let client_status = initialize_obs_client().await;
    if client_status.is_err() {
        println!("⚠️ Couldn't initialize OBS client, will retry once");
        sleep(Duration::from_secs(2)).await;
        initialize_obs_client().await?;
    }
    
    let scene_exists = check_if_scene_exists(SCENE_NAME).await?;
    
    if !scene_exists {
        println!("🔄 Creating new scene: {}", SCENE_NAME);
        let scene_result = send_request("CreateScene", Some(json!({
            "sceneName": SCENE_NAME
        }))).await;
        
        if let Err(e) = scene_result {
            println!("❌ Failed to create scene: {:?}", e);
            return Err(e);
        } else {
            println!("✅ Created scene: {}", SCENE_NAME);
        }
    } else {
        println!("ℹ️ Scene already exists: {}", SCENE_NAME);
    }
    
    let source_exists = check_if_source_exists(BROWSER_SOURCE_NAME).await?;
    
    if !source_exists {
        println!("🔄 Creating new browser source: {}", BROWSER_SOURCE_NAME);
        let source_result = send_request("CreateInput", Some(json!({
            "sceneName": SCENE_NAME,
            "inputName": BROWSER_SOURCE_NAME,
            "inputKind": "browser_source",
            "inputSettings": {
                "url": url,
                "width": 1920,
                "height": 1080,
                "fps": 30,
                "reroute_audio": false,
                "restart_when_active": true,
                "shutdown": true,
                "webpage_control_level": 1
            }
        }))).await;
        
        if let Err(e) = source_result {
            println!("❌ Failed to create browser source: {:?}", e);
            return Err(e);
        } else {
            println!("✅ Created browser source: {}", BROWSER_SOURCE_NAME);
        }
        
        position_source_in_scene().await?;
    } else {
        println!("ℹ️ Browser source already exists, updating URL");
        let update_result = update_browser_source_url(url).await;
        if let Err(e) = update_result {
            println!("❌ Failed to update browser source: {:?}", e);
            return Err(e);
        }
    }
    
    let scene_set_result = send_request("SetCurrentProgramScene", Some(json!({
        "sceneName": SCENE_NAME
    }))).await;
    
    if let Err(e) = scene_set_result {
        println!("❌ Failed to set current scene: {:?}", e);
        return Err(e);
    } else {
        println!("✅ Set current scene: {}", SCENE_NAME);
    }
    
    match start_virtual_camera().await {
        Ok(_) => println!("🎥 Started OBS virtual camera"),
        Err(e) => println!("⚠️ Failed to start OBS virtual camera: {:?}", e)
    }
    
    Ok(())
}

async fn update_browser_source_url(url: &str) -> Result<(), VirtualCameraError> {
    println!("🔄 Updating browser source URL to: {}", url);
    
    let update_result = send_request("SetInputSettings", Some(json!({
        "inputName": BROWSER_SOURCE_NAME,
        "inputSettings": {
            "url": url,
            "restart_when_active": true
        }
    }))).await;
    
    match update_result {
        Ok(_) => {
            println!("✅ Updated browser source URL");
            
            let refresh_result = send_request("PressInputPropertiesButton", Some(json!({
                "inputName": BROWSER_SOURCE_NAME,
                "propertyName": "refreshnocache"
            }))).await;
            
            if let Err(e) = refresh_result {
                println!("⚠️ Failed to refresh browser source: {:?}", e);
            } else {
                println!("🔄 Refreshed browser source");
            }
            
            Ok(())
        },
        Err(e) => {
            println!("❌ Failed to update browser source, error: {:?}", e);
            Err(e)
        }
    }
}

async fn position_source_in_scene() -> Result<(), VirtualCameraError> {
    let items_result = send_request("GetSceneItemList", Some(json!({
        "sceneName": SCENE_NAME
    }))).await;
    
    let scene_item_id = match items_result {
        Ok(response) => {
            if let Some(items) = response.get("d")
                .and_then(|d| d.get("responseData"))
                .and_then(|rd| rd.get("sceneItems"))
                .and_then(|s| s.as_array())
            {
                let mut item_id = None;
                for item in items {
                    if let Some(name) = item.get("sourceName").and_then(|n| n.as_str()) {
                        if name == BROWSER_SOURCE_NAME {
                            item_id = item.get("sceneItemId").and_then(|id| id.as_i64());
                            break;
                        }
                    }
                }
                item_id
            } else {
                None
            }
        },
        Err(_) => None
    };
    
    if let Some(id) = scene_item_id {
        let transform_result = send_request("SetSceneItemTransform", Some(json!({
            "sceneName": SCENE_NAME,
            "sceneItemId": id,
            "sceneItemTransform": {
                "positionX": 0,
                "positionY": 0,
                "rotation": 0,
                "scaleX": 1.0,
                "scaleY": 1.0,
                "boundsType": "OBS_BOUNDS_STRETCH",
                "boundsAlignment": 5,
                "boundsWidth": 1920,
                "boundsHeight": 1080
            }
        }))).await;
        
        if let Err(e) = transform_result {
            println!("⚠️ Failed to set transform: {:?}", e);
            return Err(e);
        }
        
        println!("✅ Positioned browser source to fill scene");
        Ok(())
    } else {
        println!("⚠️ Could not find scene item ID for browser source");
        Err(VirtualCameraError::InvalidInput)
    }
}

async fn get_current_scene() -> Result<String, VirtualCameraError> {
    let response = send_request("GetCurrentProgramScene", None).await?;
    
    if let Some(scene_name) = response.get("d")
        .and_then(|d| d.get("responseData"))
        .and_then(|rd| rd.get("sceneName"))
        .and_then(|name| name.as_str()) {
        Ok(scene_name.to_string())
    } else {
        Err(VirtualCameraError::InvalidInput)
    }
}

async fn create_scene(scene_name: &str) -> Result<(), VirtualCameraError> {
    send_request("CreateScene", Some(json!({
        "sceneName": scene_name
    }))).await?;
    
    println!("✅ Scene '{}' created", scene_name);
    Ok(())
}

async fn set_current_scene(scene_name: &str) -> Result<(), VirtualCameraError> {
    send_request("SetCurrentProgramScene", Some(json!({
        "sceneName": scene_name
    }))).await?;
    
    println!("✅ Set current scene to '{}'", scene_name);
    Ok(())
}

async fn set_source_visible(source_name: &str, visible: bool) -> Result<(), VirtualCameraError> {
    let current_scene = get_current_scene().await?;
    
    let response = send_request("GetSceneItemList", Some(json!({
        "sceneName": current_scene
    }))).await?;
    
    let item_id = response.get("d")
        .and_then(|d| d.get("responseData"))
        .and_then(|rd| rd.get("sceneItems"))
        .and_then(|items| items.as_array())
        .and_then(|items_array| {
            for item in items_array {
                if let Some(name) = item.get("sourceName").and_then(|n| n.as_str()) {
                    if name == source_name {
                        return item.get("sceneItemId").and_then(|id| id.as_i64());
                    }
                }
            }
            None
        });
    
    if let Some(id) = item_id {
        send_request("SetSceneItemEnabled", Some(json!({
            "sceneName": current_scene,
            "sceneItemId": id,
            "sceneItemEnabled": visible
        }))).await?;
        
        println!("✅ Set source '{}' visibility to {}", source_name, visible);
        Ok(())
    } else {
        println!("❌ Could not find scene item '{}'", source_name);
        Err(VirtualCameraError::InvalidInput)
    }
}

async fn check_if_scene_exists(scene_name: &str) -> Result<bool, VirtualCameraError> {
    let scene_list_result = send_request("GetSceneList", None).await;
    
    match &scene_list_result {
        Ok(response) => {
            let scenes = response.get("d")
                .and_then(|d| d.get("responseData"))
                .and_then(|rd| rd.get("scenes"))
                .and_then(|s| s.as_array());
            
            match scenes {
                Some(scene_array) => {
                    let exists = scene_array.iter().any(|scene| {
                        scene.get("sceneName")
                            .and_then(|name| name.as_str())
                            .map_or(false, |name| name == scene_name)
                    });
                    Ok(exists)
                },
                None => Ok(false)
            }
        },
        Err(e) => {
            println!("⚠️ Failed to get scene list: {:?}", e);
            Err(e.clone())
        }
    }
}

async fn check_if_source_exists(source_name: &str) -> Result<bool, VirtualCameraError> {
    let input_list_result = send_request("GetInputList", Some(json!({
        "inputKind": "browser_source"
    }))).await;
    
    match &input_list_result {
        Ok(response) => {
            let inputs = response.get("d")
                .and_then(|d| d.get("responseData"))
                .and_then(|rd| rd.get("inputs"))
                .and_then(|i| i.as_array());
            
            match inputs {
                Some(input_array) => {
                    let exists = input_array.iter().any(|input| {
                        input.get("inputName")
                            .and_then(|name| name.as_str())
                            .map_or(false, |name| name == source_name)
                    });
                    Ok(exists)
                },
                None => Ok(false)
            }
        },
        Err(e) => {
            println!("⚠️ Failed to get input list: {:?}", e);
            Err(e.clone())
        }
    }
}

pub async fn handle_stream_url(url: &str) -> Result<(), VirtualCameraError> {
    println!("📡 Received stream URL from frontend: {}", url);
    
    create_browser_source(url).await
}

pub async fn remove_browser_source() -> Result<(), VirtualCameraError> {
    println!("🗑️ Removing browser source");
    
    let client_status = initialize_obs_client().await;
    if client_status.is_err() {
        println!("⚠️ Couldn't initialize OBS client, will retry once");
        sleep(Duration::from_secs(2)).await;
        initialize_obs_client().await?;
    }
    
    match stop_virtual_camera().await {
        Ok(_) => println!("✅ Stopped virtual camera"),
        Err(e) => println!("⚠️ Failed to stop virtual camera: {:?}", e)
    }
    
    let source_exists = check_if_source_exists(BROWSER_SOURCE_NAME).await?;
    
    if source_exists {
        let remove_result = send_request("RemoveInput", Some(json!({
            "inputName": BROWSER_SOURCE_NAME
        }))).await;
        
        if let Err(e) = remove_result {
            println!("⚠️ Failed to remove browser source: {:?}", e);
            return Err(e);
        } else {
            println!("✅ Removed browser source: {}", BROWSER_SOURCE_NAME);
        }
    } else {
        println!("ℹ️ Browser source does not exist, nothing to remove");
    }
    
    let scene_exists = check_if_scene_exists(SCENE_NAME).await?;
    
    if scene_exists {
        let remove_scene_result = send_request("RemoveScene", Some(json!({
            "sceneName": SCENE_NAME
        }))).await;
        
        if let Err(e) = remove_scene_result {
            println!("⚠️ Failed to remove scene: {:?}", e);
        } else {
            println!("✅ Removed scene: {}", SCENE_NAME);
        }
    }
    
    disconnect().await?;
    
    println!("🧹 Cleanup completed successfully");
    Ok(())
} 
