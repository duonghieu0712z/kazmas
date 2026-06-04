use thiserror::Error;

pub(crate) type KazmasResult<T> = Result<T, KazmasError>;

#[derive(Debug, Error)]
pub(crate) enum KazmasError {
    #[error("application state lock was poisoned")]
    StateLockPoisoned,

    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),
}
