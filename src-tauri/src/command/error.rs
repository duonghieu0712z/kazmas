use serde::Serialize;
use specta::Type;

use crate::app::KazmasError;

pub(super) type CommandResult<T> = Result<T, CommandError>;

#[derive(Debug, Clone, Copy, Serialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub(super) enum CommandErrorCode {
    StateLockPoisoned,
    IoError,
    JsonError,
    StripPrefixError,
    TauriError,
    WalkDirError,
    ZipError,
}

#[derive(Debug, Clone, Serialize, Type)]
pub(super) struct CommandError {
    code: CommandErrorCode,
    message: String,
}

impl From<KazmasError> for CommandError {
    fn from(error: KazmasError) -> Self {
        let code = match error {
            KazmasError::StateLockPoisoned => CommandErrorCode::StateLockPoisoned,
            KazmasError::Io(_) => CommandErrorCode::IoError,
            KazmasError::Json(_) => CommandErrorCode::JsonError,
            KazmasError::StripPrefix(_) => CommandErrorCode::StripPrefixError,
            KazmasError::Tauri(_) => CommandErrorCode::TauriError,
            KazmasError::WalkDir(_) => CommandErrorCode::WalkDirError,
            KazmasError::Zip(_) => CommandErrorCode::ZipError,
        };

        Self {
            code,
            message: error.to_string(),
        }
    }
}
