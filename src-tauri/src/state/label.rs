use uuid::Uuid;

use crate::app::KazmasResult;

const LABEL_PREFIX: &str = "kazmas-window:";

pub(super) fn window_label(id: &Uuid) -> String {
    format!("{LABEL_PREFIX}{id}")
}

pub(super) fn parse_window_label(label: &str) -> KazmasResult<Option<Uuid>> {
    let id = label
        .strip_prefix(LABEL_PREFIX)
        .map(Uuid::parse_str)
        .transpose()?;
    Ok(id)
}
