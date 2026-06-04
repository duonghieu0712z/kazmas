use serde::{Serialize, Serializer};
use specta::{
    Type, Types,
    datatype::{DataType, Primitive},
};
use thiserror::Error;

pub(crate) type KazmasResult<T> = Result<T, KazmasError>;

#[derive(Debug, Error)]
pub(crate) enum KazmasError {
    #[error("application state lock was poisoned")]
    StatePoisoned,

    #[error(transparent)]
    Tauri(#[from] tauri::Error),
}

impl Serialize for KazmasError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

impl Type for KazmasError {
    fn definition(_: &mut Types) -> DataType {
        DataType::Primitive(Primitive::str)
    }
}
