// T059: ScanJob DAO
use rusqlite::{Connection, params};
use crate::error::{PhotoManError, Result};

/// 扫描任务状态
#[derive(Debug, Clone, PartialEq)]
pub enum ScanJobStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl ScanJobStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ScanJobStatus::Running => "running",
            ScanJobStatus::Completed => "completed",
            ScanJobStatus::Failed => "failed",
            ScanJobStatus::Cancelled => "cancelled",
        }
    }
    
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "running" => Some(ScanJobStatus::Running),
            "completed" => Some(ScanJobStatus::Completed),
            "failed" => Some(ScanJobStatus::Failed),
            "cancelled" => Some(ScanJobStatus::Cancelled),
            _ => None,
        }
    }
}

/// 扫描任务记录
#[derive(Debug, Clone)]
pub struct ScanJob {
    pub id: Option<i64>,
    pub target_path: String,
    pub status: ScanJobStatus,
    pub total_files: i32,
    pub processed_files: i32,
    pub found_photos: i32,
    pub duplicates_skipped: i32,
    pub error_message: Option<String>,
    pub started_at: String,
    pub finished_at: Option<String>,
}

/// ScanJob数据访问对象
pub struct ScanJobDao;

impl ScanJobDao {
    /// 创建新的扫描任务
    pub fn create(conn: &Connection, target_path: &str) -> Result<i64> {
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO scan_jobs (target_path, status, started_at)
             VALUES (?1, ?2, ?3)",
            params![target_path, "running", now],
        )
        .map_err(|e| PhotoManError::database_error(format!("创建扫描任务失败: {}", e)))?;
        
        Ok(conn.last_insert_rowid())
    }
    
    /// 更新扫描任务进度
    pub fn update_progress(
        conn: &Connection,
        id: i64,
        total_files: i32,
        processed_files: i32,
        found_photos: i32,
        duplicates_skipped: i32,
    ) -> Result<()> {
        conn.execute(
            "UPDATE scan_jobs SET
                total_files = ?1,
                processed_files = ?2,
                found_photos = ?3,
                duplicates_skipped = ?4
             WHERE id = ?5",
            params![total_files, processed_files, found_photos, duplicates_skipped, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("更新扫描任务进度失败: {}", e)))?;
        
        Ok(())
    }
    
    /// 完成扫描任务
    pub fn complete(conn: &Connection, id: i64) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute(
            "UPDATE scan_jobs SET status = ?1, finished_at = ?2 WHERE id = ?3",
            params!["completed", now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("完成扫描任务失败: {}", e)))?;
        
        Ok(())
    }
    
    /// 标记扫描任务失败
    pub fn fail(conn: &Connection, id: i64, error_message: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        
        conn.execute(
            "UPDATE scan_jobs SET status = ?1, error_message = ?2, finished_at = ?3 WHERE id = ?4",
            params!["failed", error_message, now, id],
        )
        .map_err(|e| PhotoManError::database_error(format!("标记扫描任务失败: {}", e)))?;
        
        Ok(())
    }
    
    /// 获取最近的扫描任务
    pub fn get_recent(conn: &Connection, limit: i32) -> Result<Vec<ScanJob>> {
        let mut stmt = conn.prepare(
            "SELECT * FROM scan_jobs ORDER BY started_at DESC LIMIT ?1"
        )
        .map_err(|e| PhotoManError::database_error(format!("查询扫描任务失败: {}", e)))?;
        
        let jobs = stmt.query_map(params![limit], |row| {
            Ok(ScanJob {
                id: Some(row.get(0)?),
                target_path: row.get(1)?,
                status: ScanJobStatus::from_str(&row.get::<_, String>(2)?)
                    .unwrap_or(ScanJobStatus::Failed),
                total_files: row.get(3)?,
                processed_files: row.get(4)?,
                found_photos: row.get(5)?,
                duplicates_skipped: row.get(6)?,
                error_message: row.get(7)?,
                started_at: row.get(8)?,
                finished_at: row.get(9)?,
            })
        })
        .map_err(|e| PhotoManError::database_error(format!("映射扫描任务失败: {}", e)))?
        .filter_map(|r| r.ok())
        .collect();
        
        Ok(jobs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    fn setup_test_db() -> (TempDir, Connection) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let conn = Connection::open(&db_path).unwrap();
        
        conn.execute_batch(
            "CREATE TABLE scan_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_path TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                total_files INTEGER DEFAULT 0,
                processed_files INTEGER DEFAULT 0,
                found_photos INTEGER DEFAULT 0,
                duplicates_skipped INTEGER DEFAULT 0,
                error_message TEXT,
                started_at TEXT NOT NULL,
                finished_at TEXT
            )"
        ).unwrap();
        
        (temp_dir, conn)
    }
    
    #[test]
    fn test_create_scan_job() {
        let (_temp, conn) = setup_test_db();
        
        let id = ScanJobDao::create(&conn, "/test/path").unwrap();
        assert!(id > 0);
    }
    
    #[test]
    fn test_update_progress() {
        let (_temp, conn) = setup_test_db();
        
        let id = ScanJobDao::create(&conn, "/test/path").unwrap();
        ScanJobDao::update_progress(&conn, id, 100, 50, 40, 5).unwrap();
        
        let jobs = ScanJobDao::get_recent(&conn, 1).unwrap();
        assert_eq!(jobs[0].total_files, 100);
        assert_eq!(jobs[0].found_photos, 40);
    }
}

