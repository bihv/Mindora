const AI_KEYCHAIN_SERVICE: &str = "com.biho.mindora.ai";
const AI_KEYCHAIN_USER: &str = "openai-compatible-api-key";

#[tauri::command]
pub fn get_ai_api_key() -> Result<Option<String>, String> {
    let entry = get_ai_key_entry()?;

    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(format!(
            "Unable to read the saved AI API key from the system keychain: {}",
            error
        )),
    }
}

#[tauri::command]
pub fn set_ai_api_key(api_key: String) -> Result<(), String> {
    let trimmed_api_key = api_key.trim();
    if trimmed_api_key.is_empty() {
        return Err("AI API key cannot be empty.".to_string());
    }

    let entry = get_ai_key_entry()?;
    entry.set_password(trimmed_api_key).map_err(|error| {
        format!(
            "Unable to save the AI API key to the system keychain: {}",
            error
        )
    })
}

#[tauri::command]
pub fn delete_ai_api_key() -> Result<(), String> {
    let entry = get_ai_key_entry()?;

    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!(
            "Unable to remove the saved AI API key from the system keychain: {}",
            error
        )),
    }
}

fn get_ai_key_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(AI_KEYCHAIN_SERVICE, AI_KEYCHAIN_USER).map_err(|error| {
        format!(
            "Unable to access the system keychain for AI credentials: {}",
            error
        )
    })
}
