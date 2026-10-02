import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.utils import secure_filename
from config import Config
from database.database import init_db
from database.models import ReviewModel
from agents.graph import execute_review_pipeline
from rag.retriever import retrieve_context
from rag.vector_store import build_vector_store, get_vector_store

app = Flask(__name__)
app.config.from_object(Config)

# Ensure essential directories exist
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["VECTOR_DB_DIR"], exist_ok=True)

# Initialize database
init_db()

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/history")
def history():
    reviews = ReviewModel.get_all()
    return render_template("history.html", reviews=reviews)

@app.route("/review/<review_id>")
def view_review(review_id):
    review = ReviewModel.get_by_id(review_id)
    if not review:
        flash("Review not found.", "warning")
        return redirect(url_for("history"))
    return render_template("review.html", review=review)

@app.route("/knowledge")
def knowledge():
    try:
        store = get_vector_store()
        total_chunks = len(store.metadata)
    except Exception:
        total_chunks = 0
    return render_template("knowledge.html", total_chunks=total_chunks)

@app.route("/about")
def about():
    return render_template("about.html")

# API Endpoints
@app.route("/api/review", methods=["POST"])
def api_review():
    data = request.get_json() or {}
    code = data.get("code", "").strip()
    language = data.get("language", "Python").strip()

    if not code:
        return jsonify({"error": "Code cannot be empty"}), 400

    try:
        # Run LangGraph multi-agent pipeline
        pipeline_result = execute_review_pipeline(code=code, language=language)
        final_review = pipeline_result.get("final_review", {})
        rag_context = pipeline_result.get("rag_context", [])
        agent_activity = pipeline_result.get("agent_activity", [])

        # Persist review into database
        review_id = ReviewModel.create(
            language=language,
            code=code,
            score=final_review.get("overall_score", 85),
            bugs_count=len(final_review.get("bugs", [])),
            security_count=len(final_review.get("security_issues", [])),
            performance_count=len(final_review.get("performance_issues", [])),
            quality_count=len(final_review.get("quality_issues", [])),
            summary=final_review.get("summary", ""),
            improved_code=final_review.get("improved_code", code),
            details_json={
                "bugs": final_review.get("bugs", []),
                "security_issues": final_review.get("security_issues", []),
                "performance_issues": final_review.get("performance_issues", []),
                "quality_issues": final_review.get("quality_issues", []),
                "recommendations": final_review.get("recommendations", []),
                "severity_summary": final_review.get("severity_summary", {}),
                "rag_context": rag_context,
                "agent_activity": agent_activity
            }
        )

        response_payload = {
            "id": review_id,
            "overall_score": final_review.get("overall_score", 85),
            "summary": final_review.get("summary", ""),
            "severity_summary": final_review.get("severity_summary", {}),
            "bugs": final_review.get("bugs", []),
            "security_issues": final_review.get("security_issues", []),
            "performance_issues": final_review.get("performance_issues", []),
            "quality_issues": final_review.get("quality_issues", []),
            "recommendations": final_review.get("recommendations", []),
            "improved_code": final_review.get("improved_code", code),
            "rag_context": rag_context,
            "agent_activity": agent_activity
        }
        return jsonify(response_payload)
    except Exception as e:
        app.logger.error(f"Review error: {e}")
        return jsonify({"error": f"Failed to complete review: {str(e)}"}), 500

@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        ext = filename.rsplit(".", 1)[1].lower()
        
        ext_to_lang = {
            "py": "Python",
            "js": "JavaScript",
            "ts": "TypeScript",
            "java": "Java",
            "cpp": "C++",
            "c": "C",
            "html": "HTML",
            "css": "CSS",
            "sql": "SQL"
        }
        
        content = file.read().decode("utf-8", errors="ignore")
        return jsonify({
            "filename": filename,
            "language": ext_to_lang.get(ext, "Python"),
            "code": content,
            "size": len(content)
        })
    else:
        return jsonify({"error": "Invalid file type. Allowed: py, js, java, cpp, c, html, css, ts, sql"}), 400

@app.route("/api/rag/search", methods=["POST"])
def api_rag_search():
    data = request.get_json() or {}
    query = data.get("query", "").strip()
    language = data.get("language", "Python").strip()
    
    if not query:
        return jsonify({"error": "Query cannot be empty"}), 400
        
    results = retrieve_context(query=query, language=language, top_k=3)
    return jsonify({"query": query, "language": language, "results": results})

@app.route("/api/review/<review_id>", methods=["DELETE"])
def api_delete_review(review_id):
    success = ReviewModel.delete(review_id)
    if success:
        return jsonify({"message": "Review deleted successfully"})
    return jsonify({"error": "Review not found"}), 404

if __name__ == "__main__":
    print("Initializing FAISS Vector Store...")
    try:
        build_vector_store()
        print("FAISS Vector Store initialized successfully.")
    except Exception as e:
        print(f"Warning: Vector store initialization: {e}")
        
    print("Starting AI Code Review Assistant on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
