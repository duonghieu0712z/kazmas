use serde::Serialize;
use specta::Type;

use crate::app::KazmasError;

pub(super) type CommandResult<T> = Result<T, CommandError>;

#[derive(Debug, Clone, Copy, Serialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub(super) enum CommandErrorCode {
    // Internal errors
    AlreadyExists,
    Invalid,
    // External errors
    Io,
    Json,
    Sqlite,
    StripPrefix,
    Strum,
    Tauri,
    WalkDir,
    Zip,
}

#[derive(Debug, Clone, Serialize, Type)]
pub(super) struct CommandError {
    code: CommandErrorCode,
    message: String,
}

impl From<KazmasError> for CommandError {
    fn from(error: KazmasError) -> Self {
        let code = match error {
            KazmasError::AlreadyExists(_) => CommandErrorCode::AlreadyExists,
            KazmasError::Invalid(_) => CommandErrorCode::Invalid,
            KazmasError::Io(_) => CommandErrorCode::Io,
            KazmasError::Json(_) => CommandErrorCode::Json,
            KazmasError::Sqlite(_) => CommandErrorCode::Sqlite,
            KazmasError::StripPrefix(_) => CommandErrorCode::StripPrefix,
            KazmasError::Strum(_) => CommandErrorCode::Strum,
            KazmasError::Tauri(_) => CommandErrorCode::Tauri,
            KazmasError::WalkDir(_) => CommandErrorCode::WalkDir,
            KazmasError::Zip(_) => CommandErrorCode::Zip,
        };

        Self {
            code,
            message: error.to_string(),
        }
    }
}
