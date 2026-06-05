use thiserror::Error;

pub(crate) type KazmasResult<T> = Result<T, KazmasError>;

#[derive(Debug, Error)]
pub(crate) enum KazmasError {
    // Internal errors
    #[error("invalid error: {0}")]
    Invalid(String),

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
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    WalkDir(#[from] walkdir::Error),

    #[error(transparent)]
    Zip(#[from] zip::result::ZipError),
}
