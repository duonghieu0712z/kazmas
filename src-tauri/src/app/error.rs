use thiserror::Error;

pub(crate) type KazmasResult<T> = Result<T, KazmasError>;

#[derive(Debug, Error)]
pub(crate) enum KazmasError {
    // Internal errors
    #[error("already exists: {0}")]
    AlreadyExists(String),

    #[error("invalid: {0}")]
    Invalid(String),

    #[error("not found: {0}")]
    NotFound(String),

    // External errors
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error(transparent)]
    Sqlite(#[from] sqlx::Error),

    #[error(transparent)]
    StripPrefix(#[from] std::path::StripPrefixError),

    #[error(transparent)]
    Strum(#[from] strum::ParseError),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    Uuid(#[from] uuid::Error),

    #[error(transparent)]
    WalkDir(#[from] walkdir::Error),

    #[error(transparent)]
    Zip(#[from] zip::result::ZipError),
}
