use serde::Serialize;

const APPLE_II_EXTENSIONS: &[&str] = &["gr", "dgr", "hgr", "dhgr", "pixmap", "bitmap"];
const RASTER_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp", "gif", "bmp"];

#[derive(Serialize)]
struct OpenedFile {
    name: String,
    data: Vec<u8>,
}

#[tauri::command]
async fn open_file() -> Result<Option<OpenedFile>, String> {
    let selection = rfd::AsyncFileDialog::new()
        .set_title("Open image")
        .add_filter("Apple II images", APPLE_II_EXTENSIONS)
        .add_filter("Modern images", RASTER_EXTENSIONS)
        .pick_file()
        .await;

    let Some(file) = selection else {
        return Ok(None);
    };
    let name = file.file_name();
    let data = file.read().await;
    Ok(Some(OpenedFile { name, data }))
}

#[tauri::command]
async fn choose_save_path(default_name: String) -> Result<Option<String>, String> {
    let selection = rfd::AsyncFileDialog::new()
        .set_title("Save image")
        .set_file_name(&default_name)
        .add_filter("Apple II images", APPLE_II_EXTENSIONS)
        .add_filter("Modern images", &["png", "jpg", "jpeg", "webp"])
        .save_file()
        .await;

    selection
        .map(|file| {
            file.path()
                .to_str()
                .map(ToOwned::to_owned)
                .ok_or_else(|| "The selected path is not valid Unicode".to_string())
        })
        .transpose()
}

#[tauri::command]
fn write_file(path: String, data: Vec<u8>) -> Result<(), String> {
    std::fs::write(path, data).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file,
            choose_save_path,
            write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running the application");
}
