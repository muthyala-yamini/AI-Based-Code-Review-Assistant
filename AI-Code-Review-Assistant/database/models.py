import json
import uuid
from .database import get_db_connection

class ReviewModel:
    @staticmethod
    def create(language, code, score, bugs_count, security_count, performance_count, quality_count, summary, improved_code, details_json):
        review_id = "rev_" + str(uuid.uuid4())[:8]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reviews (id, language, code, score, bugs_count, security_count, performance_count, quality_count, summary, improved_code, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            review_id,
            language,
            code,
            score,
            bugs_count,
            security_count,
            performance_count,
            quality_count,
            summary,
            improved_code,
            json.dumps(details_json) if isinstance(details_json, dict) else str(details_json)
        ))
        conn.commit()
        conn.close()
        return review_id

    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, language, score, bugs_count, security_count, performance_count, quality_count, summary, created_at FROM reviews ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_id(review_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reviews WHERE id = ?", (review_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        item = dict(row)
        if item.get("details_json"):
            try:
                item["details"] = json.loads(item["details_json"])
            except Exception:
                item["details"] = {}
        return item

    @staticmethod
    def delete(review_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted
