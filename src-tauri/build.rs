fn main() {
    // Skip icon requirements for development
    #[cfg(not(target_os = "windows"))]
    tauri_build::build();
    
    #[cfg(target_os = "windows")]
    {
        // Skip Windows resource file generation for now
        // This allows development without proper icons
        tauri_build::try_build(tauri_build::Attributes::new()).ok();
    }
}

