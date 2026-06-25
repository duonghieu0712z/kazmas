use std::time::Duration;

use sqlx::SqliteConnection;
use tokio::time;

use crate::app::{KazmasError, KazmasResult};

const CHECKPOINT_WAL: &str = "PRAGMA wal_checkpoint(TRUNCATE);";
const CHECKPOINT_WAL_ATTEMPTS: u32 = 4;
const CHECKPOINT_WAL_BACKOFF_MS: u64 = 25;

pub(crate) async fn checkpoint_wal(conn: &mut SqliteConnection) -> KazmasResult<()> {
    let mut last_checkpoint = None;

    for attempt in 0..CHECKPOINT_WAL_ATTEMPTS {
        let (busy, log, checkpointed) = sqlx::query_as::<_, (i64, i64, i64)>(CHECKPOINT_WAL)
            .fetch_one(&mut *conn)
            .await?;
        if busy == 0 && checkpointed >= log {
            return Ok(());
        }

        last_checkpoint = Some((busy, log, checkpointed));

        if attempt + 1 < CHECKPOINT_WAL_ATTEMPTS {
            let delay = Duration::from_millis(CHECKPOINT_WAL_BACKOFF_MS * 2_u64.pow(attempt));
            time::sleep(delay).await;
        }
    }

    let Some((busy, log, checkpointed)) = last_checkpoint else {
        return Ok(());
    };

    Err(KazmasError::Invalid(format!(
        "WAL checkpoint incomplete: busy={busy}, log={log}, checkpointed={checkpointed}"
    )))
}
