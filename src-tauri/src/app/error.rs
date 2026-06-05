use thiserror::Error;

pub(crate) type KazmasResult<T> = Result<T, KazmasError>;

#[derive(Debug, Error)]
pub(crate) enum KazmasError {
    #[error("application state lock was poisoned")]
    StateLockPoisoned,

    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error(transparent)]
    StripPrefix(#[from] std::path::StripPrefixError),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),

    #[error(transparent)]
    WalkDir(#[from] walkdir::Error),

    #[error(transparent)]
    Zip(#[from] zip::result::ZipError),
}
