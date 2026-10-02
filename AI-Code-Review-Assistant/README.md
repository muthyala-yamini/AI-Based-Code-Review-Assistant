# AI-Based Code Review Assistant

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/framework-Flask-lightgrey.svg)](https://flask.palletsprojects.com/)
[![LangGraph](https://img.shields.io/badge/orchestration-LangGraph-purple.svg)](https://langchain-ai.github.io/langgraph/)
[![RAG](https://img.shields.io/badge/retrieval-FAISS-green.svg)](https://github.com/facebookresearch/faiss)
[![Gemini](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-orange.svg)](https://ai.google.dev/)

An intelligent, multi-agent AI platform that automatically detects bugs, security vulnerabilities, performance bottlenecks, and coding-standard violations using **LangGraph**, **RAG (Retrieval-Augmented Generation with FAISS)**, and **Google Gemini 3.8 Flash**.

Designed & Developed by: **MUTHYALA YAMINI**  
Final Year B.Tech Computer Science & Engineering Capstone Project.

---

## 1. Project Overview

Manual code reviews are time-consuming and often inconsistent across large development teams. The **AI-Based Code Review Assistant** automates the inspection process by deploying a collaborative team of 5 specialized AI agents:
1. **Code Analyzer Agent**: Analyzes AST syntax, control flow invariants, and logic bugs.
2. **Security Agent**: Scans for OWASP Top 10 vulnerabilities (SQLi, hardcoded credentials, command injection, XSS).
3. **Quality & Performance Agent**: Evaluates cyclomatic complexity, algorithmic efficiency O(N^2), memory footprint, and maintainability.
4. **RAG Agent**: Retrieves authoritative industry coding guidelines (PEP 8, OWASP, Clean Code) from a local FAISS vector database.
5. **Review Orchestrator**: Deduplicates findings, assigns calibrated severity levels, computes a composite 0-100 quality score, and synthesizes refactored, production-ready code.

---

## 2. Core Features

* **Multi-Language Support**: Analyzes `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.sql`, `.html`, and `.css`.
* **Zero-Execution Static Sandbox**: Code is analyzed purely statically and via AI reasoning—never executed on host machines.
* **Agentic Workflow Animation**: Live visual feedback showing each agent progressing from standby to analysis to completion.
* **RAG Knowledge Citations**: Shows exact standards retrieved from the FAISS vector database with relevance scores (e.g., *PEP 8 - 94% Relevance*).
* **Side-by-Side Code Diff**: Compares submitted code with the AI-improved version, with 1-click **Copy** and **Download**.
* **Review History with SQLite**: Persists all historical reviews with date, language, quality score, and issue counts.
* **Interactive Knowledge Base Explorer**: Search the vector database directly with arbitrary queries.
* **One-Click Demo Code**: Instantly loads sample Python code containing intentional vulnerabilities for rapid demonstration.
* **Dark / Light Theme Toggle**: Modern developer-tool aesthetic inspired by modern AI developer SaaS.

---

## 3. Architecture

```text
               +--------------------------------------+
               |             Source Code              |
               |     (File Upload / Text Editor)      |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |            Flask Backend             |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |      LangGraph State Machine         |
               +--------------------------------------+
                                  |
            +---------------------+--------------------+
            |                     |                    |
            v                     v                    v
    +---------------+     +---------------+    +---------------+
    | Code Analyzer |     |   Security    |    | Quality & Perf|
    |     Agent     |     |     Agent     |    |     Agent     |
    +---------------+     +---------------+    +---------------+
            \                     |                    /
             +--------------------+-------------------+
                                  |
                                  v
               +--------------------------------------+
               |              RAG Agent               |
               | (FAISS Semantic Vector Search over   |
               |   PEP 8, OWASP, Clean Code Chunks)   |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |      Review Orchestrator Agent       |
               |    (Gemini 3.8 Flash Synthesis)      |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |          SQLite Database             |
               |         (Review History)             |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |      Modern Web User Interface       |
               +--------------------------------------+
```

---

## 4. Technology Stack

* **Backend**: Python 3.11+, Flask 3.0, SQLite3
* **AI Orchestration**: LangGraph, Google Gemini Python SDK (`google-genai`), `gemini-3.8-flash`
* **RAG / Vector Database**: FAISS (Facebook AI Similarity Search), Sentence Transformers (`all-MiniLM-L6-v2`)
* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons

---

## 5. Folder Structure

```
AI-Code-Review-Assistant/
├── app.py                      # Flask Application Server & API endpoints
├── config.py                   # Central configuration & environment bindings
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment file
├── README.md                   # Complete documentation
│
├── agents/                     # Multi-Agent LangGraph implementation
│   ├── __init__.py
│   ├── code_agent.py           # Agent 1: Syntax & logic analysis
│   ├── security_agent.py       # Agent 2: OWASP & secrets audit
│   ├── quality_agent.py        # Agent 3: Complexity & performance
│   ├── rag_agent.py            # Agent 4: Vector retrieval interface
│   ├── review_agent.py         # Agent 5: Synthesis & refactoring
│   └── graph.py                # LangGraph state machine definition
│
├── rag/                        # RAG System
│   ├── __init__.py
│   ├── document_loader.py      # Knowledge loader & chunker
│   ├── embeddings.py           # Vector embeddings engine
│   ├── vector_store.py         # FAISS vector store manager
│   └── retriever.py            # Semantic retrieval & re-ranking
│
├── services/                   # External API services
│   ├── __init__.py
│   └── gemini_service.py       # Google Gemini SDK interface
│
├── database/                   # SQLite persistence
│   ├── __init__.py
│   ├── database.py             # SQLite connection & table creation
│   └── models.py               # Review data access model
│
├── knowledge_base/             # Raw coding standards & documents
│   ├── python/                 # PEP 8, best practices, security
│   ├── java/                   # Java standards, OWASP guidelines
│   ├── javascript/             # Modern JS/TS, Node.js security
│   └── general/                # OWASP Top 10, clean code, testing
│
├── templates/                  # Jinja2 HTML templates
│   ├── base.html               # Shared layout, navbar, footer
│   ├── index.html              # Main review workspace
│   ├── review.html             # Detailed single review page
│   ├── history.html            # SQLite review history catalog
│   ├── knowledge.html          # Knowledge base & RAG explorer
│   └── about.html              # Architecture diagram & project info
│
├── static/                     # Frontend static assets
│   ├── css/
│   │   └── style.css           # Custom dark/light mode CSS
│   └── js/
│       └── script.js           # Workspace controller & async API
│
├── uploads/                    # Temporary uploaded files
└── vector_db/                  # FAISS index storage (`index.faiss`)
```

---

## 6. Installation & Setup

### Prerequisites
* Python 3.10 or 3.11+
* Git
* Google Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/))

### Step 1: Clone Repository
```bash
git clone https://github.com/muthyala-yamini/AI-Code-Review-Assistant.git
cd AI-Code-Review-Assistant
```

### Step 2: Create Virtual Environment
```bash
# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and set your Gemini API key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
SECRET_KEY="your_random_secret_key"
```

---

## 7. Running the Application

Start the Flask application:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

On first startup, the application automatically builds the FAISS vector index from `knowledge_base/` and initializes `reviews.db`.

---

## 8. Evaluator Demonstration Steps

1. **Open the Dashboard**: Go to `http://127.0.0.1:5000`.
2. **Load Demo Code**: Click the **"Load Demo Code"** button. An intentionally imperfect Python script will populate the editor containing:
   * A hardcoded API credential (`API_SECRET_KEY`)
   * A SQL injection flaw (`query = f"SELECT * FROM users WHERE id = '{user_id}'"`)
   * An inefficient quadratic nested loop (`O(N^2)`)
   * A bare `except:` catching all exceptions silently.
3. **Analyze Code**: Click **"Analyze Code"**.
4. **Observe Multi-Agent Activity**: Watch the live step-by-step progress bar showing:
   * *Code Analyzer Agent*
   * *Security Agent*
   * *Quality & Performance Agent*
   * *RAG Agent*
   * *Review Orchestrator*
5. **Inspect Results**:
   * Overall Quality Score (e.g. `62 / 100`)
   * Severity badges (**CRITICAL**, **HIGH**, **MEDIUM**, **LOW**)
   * **Knowledge Used** card displaying citations from *PEP 8* and *Secure Coding Guidelines* with relevance percentages
   * **AI Recommendations**
   * **AI Improved Code** with refactored logic, parameterized SQL, and context managers.
6. **Check Review History**: Click **"Review History"** in the navigation bar to see the saved record in SQLite.
7. **Search Knowledge Base**: Click **"Knowledge Base"** to manually search vector embeddings for any query (e.g., "SQL injection").

---

## 9. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Main split-screen workspace |
| `GET` | `/history` | SQLite review history page |
| `GET` | `/review/<id>` | Full review inspection page |
| `GET` | `/knowledge` | Knowledge base explorer |
| `GET` | `/about` | Architecture diagram & student details |
| `POST` | `/api/review` | Executes LangGraph multi-agent review pipeline |
| `POST` | `/api/upload` | Uploads and parses code files safely |
| `POST` | `/api/rag/search` | Searches FAISS vector store with query |
| `DELETE` | `/api/review/<id>` | Removes a saved review from SQLite |

---

## 10. Developer & Acknowledgements

* **Student Developer**: **MUTHYALA YAMINI**
* **Project**: AI-Based Code Review Assistant
* **Course**: Final Year B.Tech Computer Science & Engineering
