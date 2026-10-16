use font_kit::source::SystemSource;

use super::error::CommandResult;
use crate::app::KazmasResult;

#[tauri::command(async)]
#[specta::specta]
pub(super) fn get_system_fonts() -> CommandResult<Vec<String>> {
    Ok(load_system_fonts()?)
}

fn load_system_fonts() -> KazmasResult<Vec<String>> {
    let mut families = SystemSource::new().all_families()?;

    families.retain(|family| !family.trim().is_empty());
    families.sort_unstable_by_key(|family| family.to_lowercase());
    families.dedup_by(|left, right| left.to_lowercase() == right.to_lowercase());

    Ok(families)
}
