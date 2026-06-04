use std::sync::{Mutex, MutexGuard};

use super::{KazmasError, KazmasResult};

pub(crate) fn lock_mutex<'a, T>(mutex: &'a Mutex<T>) -> KazmasResult<MutexGuard<'a, T>> {
    mutex.lock().map_err(|_| KazmasError::StateLockPoisoned)
}
