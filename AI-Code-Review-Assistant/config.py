import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-ai-code-review")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Database
    DATABASE_PATH = os.path.join(BASE_DIR, "database", "reviews.db")
    
    # Vector DB & Knowledge Base
    KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, "knowledge_base")
    VECTOR_DB_DIR = os.path.join(BASE_DIR, "vector_db")
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB max
    ALLOWED_EXTENSIONS = {"py", "js", "java", "cpp", "c", "html", "css", "ts", "sql"}
