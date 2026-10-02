import sqlite3
import os
from config import Config

def get_db_connection():
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        score INTEGER NOT NULL,
        bugs_count INTEGER DEFAULT 0,
        security_count INTEGER DEFAULT 0,
        performance_count INTEGER DEFAULT 0,
        quality_count INTEGER DEFAULT 0,
        summary TEXT,
        improved_code TEXT,
        details_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()
