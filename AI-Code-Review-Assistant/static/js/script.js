// AI-Based Code Review Assistant - Frontend Controller

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("app_theme") || "dark";
    setTheme(savedTheme);

    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-bs-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("app_theme", theme);
    const icon = document.getElementById("themeIcon");
    if (icon) {
        if (theme === "light") {
            icon.className = "bi bi-sun text-warning";
        } else {
            icon.className = "bi bi-moon-stars text-light";
        }
    }
}

// Demo Code with intentional flaws for evaluator demonstration
const DEMO_CODE = `# Intentionally imperfect Python code for evaluator demonstration
import os
import sqlite3

# Issue 1: Hardcoded sensitive API credential
API_SECRET_KEY = "sk-live-98f8a7e6b5c4d3e2a1_secret_token"

def fetch_user_record(user_id):
    # Issue 2: SQL Injection flaw (unparameterized query string)
    conn = sqlite3.connect("production.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    record = cursor.fetchone()
    return record

def process_duplicates(data_items):
    # Issue 3: Inefficient O(N^2) quadratic nested loop
    unique_items = []
    for item in data_items:
        found = False
        for u in unique_items:
            if item == u:
                found = True
                break
        if not found:
            unique_items.append(item)
    return unique_items

def parse_configuration(file_path):
    # Issue 4: Bare except catching all exceptions silently
    try:
        with open(file_path, "r") as f:
            return f.read()
    except:
        pass
    return None
`;

function loadDemoCode() {
    const editor = document.getElementById("codeEditor");
    const langSelect = document.getElementById("languageSelect");
    if (editor) editor.value = DEMO_CODE;
    if (langSelect) langSelect.value = "Python";
    
    const badge = document.getElementById("fileNameBadge");
    if (badge) {
        badge.textContent = "demo_code.py";
        badge.classList.remove("d-none");
    }
}

function clearEditor() {
    const editor = document.getElementById("codeEditor");
    if (editor) editor.value = "";
    const badge = document.getElementById("fileNameBadge");
    if (badge) {
        badge.textContent = "";
        badge.classList.add("d-none");
    }
}

// File Upload Handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const allowed = [".py", ".js", ".java", ".cpp", ".c", ".html", ".css", ".ts", ".sql"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    
    if (!allowed.includes(ext)) {
        alert("Please select a supported source code file: " + allowed.join(", "));
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const editor = document.getElementById("codeEditor");
        if (editor) editor.value = content;

        // Auto-select language
        const extToLang = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".html": "HTML",
            ".css": "CSS",
            ".sql": "SQL"
        };
        const langSelect = document.getElementById("languageSelect");
        if (langSelect && extToLang[ext]) {
            langSelect.value = extToLang[ext];
        }

        const badge = document.getElementById("fileNameBadge");
        if (badge) {
            badge.textContent = file.name;
            badge.classList.remove("d-none");
        }
    };
    reader.readAsText(file);
}

// Start Review Controller
async function startReview() {
    const editor = document.getElementById("codeEditor");
    const langSelect = document.getElementById("languageSelect");
    const analyzeBtn = document.getElementById("analyzeBtn");

    const code = editor ? editor.value.trim() : "";
    const language = langSelect ? langSelect.value : "Python";

    if (!code) {
        alert("Please paste code, load demo code, or upload a source code file first.");
        return;
    }

    // Prepare UI states
    const placeholder = document.getElementById("placeholderState");
    const activitySection = document.getElementById("agentActivitySection");
    const resultsSection = document.getElementById("reviewResultsSection");
    const statusPill = document.getElementById("reviewStatusPill");

    if (placeholder) placeholder.classList.add("d-none");
    if (resultsSection) resultsSection.classList.add("d-none");
    if (activitySection) activitySection.classList.remove("d-none");
    
    if (statusPill) {
        statusPill.className = "badge bg-primary-subtle text-primary small";
        statusPill.textContent = "Agents Analyzing Code...";
    }

    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Analyzing...';
    }

    // Animate Agent steps
    const stepList = document.getElementById("agentStepList");
    const agentSteps = [
        { id: "s1", name: "Code Analyzer Agent", desc: "Parsing AST & detecting control flow anomalies..." },
        { id: "s2", name: "Security Agent", desc: "Auditing OWASP Top 10 vulnerabilities & credentials..." },
        { id: "s3", name: "Quality & Performance Agent", desc: "Evaluating cyclomatic complexity & algorithmic bottlenecks..." },
        { id: "s4", name: "RAG Agent", desc: "Querying FAISS vector index for coding standards..." },
        { id: "s5", name: "Review Orchestrator", desc: "Synthesizing deduplicated report & refactoring code..." }
    ];

    if (stepList) {
        stepList.innerHTML = agentSteps.map((step, idx) => `
            <div id="step-${step.id}" class="agent-step-item p-2 rounded-2 border border-secondary border-opacity-25 bg-dark d-flex align-items-center justify-content-between ${idx === 0 ? 'active' : ''}">
                <div class="d-flex align-items-center gap-2">
                    <span id="step-icon-${step.id}" class="spinner-border spinner-border-sm text-primary"></span>
                    <div>
                        <div class="fw-semibold small">${step.name}</div>
                        <div class="text-secondary small" style="font-size: 0.72rem;">${step.desc}</div>
                    </div>
                </div>
                <span id="step-badge-${step.id}" class="badge bg-secondary-subtle text-secondary small">Waiting</span>
            </div>
        `).join("");
    }

    // Step progression animation timer
    let currentStepIdx = 0;
    const progressTimer = setInterval(() => {
        if (currentStepIdx < agentSteps.length) {
            const step = agentSteps[currentStepIdx];
            const item = document.getElementById(`step-${step.id}`);
            const icon = document.getElementById(`step-icon-${step.id}`);
            const badge = document.getElementById(`step-badge-${step.id}`);
            
            if (item) item.classList.add("done");
            if (icon) {
                icon.className = "bi bi-check-circle-fill text-success fs-6";
            }
            if (badge) {
                badge.className = "badge bg-success-subtle text-success small";
                badge.textContent = "Done";
            }

            currentStepIdx++;
            if (currentStepIdx < agentSteps.length) {
                const nextStep = agentSteps[currentStepIdx];
                const nextItem = document.getElementById(`step-${nextStep.id}`);
                const nextBadge = document.getElementById(`step-badge-${nextStep.id}`);
                if (nextItem) nextItem.classList.add("active");
                if (nextBadge) {
                    nextBadge.className = "badge bg-primary-subtle text-primary small";
                    nextBadge.textContent = "Working";
                }
            }
        }
    }, 900);

    try {
        const response = await fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, language })
        });

        clearInterval(progressTimer);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Mark all steps completed
        agentSteps.forEach((step) => {
            const icon = document.getElementById(`step-icon-${step.id}`);
            const badge = document.getElementById(`step-badge-${step.id}`);
            if (icon) icon.className = "bi bi-check-circle-fill text-success fs-6";
            if (badge) {
                badge.className = "badge bg-success-subtle text-success small";
                badge.textContent = "Completed";
            }
        });

        const overallStatus = document.getElementById("agentOverallStatus");
        if (overallStatus) {
            overallStatus.className = "badge bg-success-subtle text-success small";
            overallStatus.textContent = "Completed";
        }

        // Render Review Results
        renderReviewResults(data);

        if (statusPill) {
            statusPill.className = "badge bg-success-subtle text-success small";
            statusPill.textContent = "Review Completed";
        }

    } catch (err) {
        clearInterval(progressTimer);
        alert("Code review failed: " + err.message);
        if (statusPill) {
            statusPill.className = "badge bg-danger-subtle text-danger small";
            statusPill.textContent = "Analysis Error";
        }
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="bi bi-cpu me-2"></i> Analyze Code';
        }
    }
}

// Render Results Function
function renderReviewResults(data) {
    const resultsSection = document.getElementById("reviewResultsSection");
    if (!resultsSection) return;
    resultsSection.classList.remove("d-none");

    // Update real-time Chart.js Latency & Performance Telemetry
    if (data.latencies) {
        updateLatencyTelemetry(data.latencies);
    }

    // 1. Overall Score
    const scoreVal = document.getElementById("overallScoreVal");
    const gradeBadge = document.getElementById("scoreGradeBadge");
    const score = data.overall_score ?? 85;

    if (scoreVal) scoreVal.textContent = score;
    if (gradeBadge) {
        if (score >= 85) {
            gradeBadge.className = "badge bg-success-subtle text-success px-2 py-1 mt-1";
            gradeBadge.textContent = "Excellent / Production-Ready";
        } else if (score >= 70) {
            gradeBadge.className = "badge bg-warning-subtle text-warning px-2 py-1 mt-1";
            gradeBadge.textContent = "Moderate Issues Detected";
        } else {
            gradeBadge.className = "badge bg-danger-subtle text-danger px-2 py-1 mt-1";
            gradeBadge.textContent = "Critical Remediation Required";
        }
    }

    // 2. Counts
    const bugs = data.bugs || [];
    const sec = data.security_issues || [];
    const perf = data.performance_issues || [];
    const qual = data.quality_issues || [];

    document.getElementById("bugsCountVal").textContent = bugs.length;
    document.getElementById("secCountVal").textContent = sec.length;
    document.getElementById("perfCountVal").textContent = perf.length;
    document.getElementById("suggCountVal").textContent = qual.length;

    // 3. Summary
    const summaryText = document.getElementById("executiveSummaryText");
    if (summaryText) summaryText.textContent = data.summary || "All checks completed.";

    // 4. RAG Knowledge Used
    const ragContainer = document.getElementById("ragUsedContainer");
    if (ragContainer) {
        const ragItems = data.rag_context || [];
        if (ragItems.length === 0) {
            ragContainer.innerHTML = '<div class="text-secondary small">General coding principles applied.</div>';
        } else {
            ragContainer.innerHTML = ragItems.map((r) => `
                <div class="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold text-light">${r.title || r.source}</span>
                        <span class="badge bg-info-subtle text-info">Relevance: ${r.relevance}%</span>
                    </div>
                    <div class="text-secondary small" style="font-size: 0.78rem;">Source: ${r.source || 'Knowledge Base'}</div>
                    <div class="text-secondary small mt-1">${r.snippet || ''}</div>
                </div>
            `).join("");
        }
    }

    // 5. Detailed Issues List
    const issuesContainer = document.getElementById("detailedIssuesList");
    const allIssues = [
        ...bugs.map(b => ({ ...b, category: "Bug" })),
        ...sec.map(s => ({ ...s, category: "Security" })),
        ...perf.map(p => ({ ...p, category: "Performance" })),
        ...qual.map(q => ({ ...q, category: "Quality" }))
    ];

    document.getElementById("totalIssuesCount").textContent = `${allIssues.length} findings`;

    if (issuesContainer) {
        if (allIssues.length === 0) {
            issuesContainer.innerHTML = '<div class="text-success small p-3 bg-dark rounded-3 border border-success border-opacity-25"><i class="bi bi-check-circle me-1"></i> No critical issues detected! Code looks clean.</div>';
        } else {
            issuesContainer.innerHTML = allIssues.map((issue) => {
                const sev = (issue.severity || "MEDIUM").toUpperCase();
                const sevClass = `badge-${sev.toLowerCase()}`;
                return `
                    <div class="card bg-dark border-secondary border-opacity-25 rounded-3 p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                            <div>
                                <span class="badge ${sevClass} me-2">${sev}</span>
                                <span class="badge bg-secondary-subtle text-light me-2">${issue.category}</span>
                                <span class="fw-bold text-light">${issue.title}</span>
                            </div>
                            ${issue.line ? `<span class="badge bg-dark border border-secondary text-secondary small">Line ${issue.line}</span>` : ''}
                        </div>
                        <p class="text-secondary small mb-2">${issue.description}</p>
                        
                        ${issue.why_it_matters ? `
                            <div class="p-2 mb-2 rounded bg-black bg-opacity-30 border border-secondary border-opacity-10">
                                <span class="fw-semibold text-warning small">Why it matters:</span>
                                <span class="text-secondary small"> ${issue.why_it_matters}</span>
                            </div>
                        ` : ''}

                        ${issue.recommendation ? `
                            <div class="text-light small mb-2">
                                <strong class="text-info">Recommendation:</strong> ${issue.recommendation}
                            </div>
                        ` : ''}

                        ${issue.suggested_fix ? `
                            <div class="mt-2">
                                <span class="small text-secondary fw-semibold">Suggested Fix:</span>
                                <pre class="bg-black p-2 rounded mt-1 mb-0"><code class="font-monospace small text-success">${escapeHtml(issue.suggested_fix)}</code></pre>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join("");
        }
    }

    // 6. Recommendations
    const recsList = document.getElementById("recommendationsList");
    if (recsList) {
        const recs = data.recommendations || [];
        recsList.innerHTML = recs.length > 0 
            ? recs.map(r => `<li>${r}</li>`).join("")
            : '<li>Follow PEP 8 / language specific formatting conventions.</li>';
    }

    // 7. Improved Code
    const improvedBlock = document.getElementById("improvedCodeBlock");
    if (improvedBlock) {
        improvedBlock.textContent = data.improved_code || data.code || "";
    }
}

// Utility: Copy & Download Improved Code
function copyImprovedCode() {
    const codeBlock = document.getElementById("improvedCodeBlock");
    if (!codeBlock) return;
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        alert("Improved code copied to clipboard!");
    });
}

function downloadImprovedCode() {
    const codeBlock = document.getElementById("improvedCodeBlock");
    const langSelect = document.getElementById("languageSelect");
    if (!codeBlock) return;

    const lang = langSelect ? langSelect.value.toLowerCase() : "python";
    const extMap = {
        python: "py",
        javascript: "js",
        typescript: "ts",
        java: "java",
        "c++": "cpp",
        c: "c",
        sql: "sql",
        html: "html",
        css: "css"
    };
    const ext = extMap[lang] || "txt";

    const blob = new Blob([codeBlock.textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `improved_code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
}

// Delete historical review from SQLite
async function deleteHistoricalReview(reviewId) {
    if (!confirm("Are you sure you want to delete this code review from history?")) return;
    try {
        const res = await fetch(`/api/review/${reviewId}`, { method: "DELETE" });
        if (res.ok) {
            window.location.reload();
        } else {
            alert("Failed to delete review.");
        }
    } catch (e) {
        alert("Error deleting review: " + e.message);
    }
}

// Manual RAG Search from Knowledge Base Page
async function performManualRAGSearch() {
    const queryInput = document.getElementById("ragSearchQuery");
    const resultsContainer = document.getElementById("manualRAGSearchResults");
    if (!queryInput || !resultsContainer) return;

    const query = queryInput.value.trim();
    if (!query) {
        alert("Please enter a query to search the vector database.");
        return;
    }

    resultsContainer.innerHTML = '<div class="text-secondary small"><span class="spinner-border spinner-border-sm me-2"></span> Searching FAISS vector embeddings...</div>';

    try {
        const res = await fetch("/api/rag/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, language: "Python" })
        });
        const data = await res.json();
        const results = data.results || [];

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="text-secondary small">No matching standards found.</div>';
        } else {
            resultsContainer.innerHTML = results.map(r => `
                <div class="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="text-light">${r.title}</strong>
                        <span class="badge bg-success-subtle text-success">Relevance: ${r.relevance}%</span>
                    </div>
                    <div class="small text-secondary mb-2">Category: ${r.category} | Source: ${r.source}</div>
                    <div class="small text-secondary font-monospace bg-black p-2 rounded">${escapeHtml(r.snippet)}</div>
                </div>
            `).join("");
        }
    } catch (err) {
        resultsContainer.innerHTML = `<div class="text-danger small">Search failed: ${err.message}</div>`;
    }
}

function escapeHtml(string) {
    const pre = document.createElement("pre");
    const text = document.createTextNode(string);
    pre.appendChild(text);
    return pre.innerHTML;
}

// ----------------- Chart.js Latency & Performance Dashboard -----------------
let latencyChartInstance = null;
let currentChartMode = 'bar';
let activeLatencies = {
    code_analyzer_ms: 175,
    security_agent_ms: 235,
    quality_agent_ms: 200,
    rag_agent_ms: 68,
    review_orchestrator_ms: 640,
    total_ms: 1318
};

function initLatencyChart() {
    const canvas = document.getElementById("agentLatencyChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (latencyChartInstance) {
        latencyChartInstance.destroy();
    }

    const labels = [
        'Code Analyzer Agent',
        'Security Agent',
        'Quality & Perf Agent',
        'RAG Vector Search',
        'Review Orchestrator'
    ];

    const data = [
        activeLatencies.code_analyzer_ms,
        activeLatencies.security_agent_ms,
        activeLatencies.quality_agent_ms,
        activeLatencies.rag_agent_ms,
        activeLatencies.review_orchestrator_ms
    ];

    const barColors = [
        'rgba(59, 130, 246, 0.85)',
        'rgba(249, 115, 22, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(14, 165, 233, 0.85)',
        'rgba(168, 85, 247, 0.85)'
    ];

    const borderColors = ['#3b82f6', '#f97316', '#10b981', '#0ea5e9', '#a855f7'];

    const isDark = document.documentElement.getAttribute("data-bs-theme") !== "light";
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    if (currentChartMode === 'bar') {
        latencyChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Latency (ms)',
                    data: data,
                    backgroundColor: barColors,
                    borderColor: borderColors,
                    borderWidth: 1.5,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` Duration: ${ctx.parsed.x} ms`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'JetBrains Mono', size: 11 },
                            callback: (v) => `${v} ms`
                        },
                        title: {
                            display: true,
                            text: 'Processing Time (milliseconds)',
                            color: textColor,
                            font: { size: 11 }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: isDark ? '#e2e8f0' : '#1e293b', font: { weight: 'bold', size: 11 } }
                    }
                }
            }
        });
    } else {
        latencyChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: barColors,
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 700 },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: isDark ? '#cbd5e1' : '#334155', font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = activeLatencies.total_ms || 1;
                                const pct = Math.round((ctx.raw / total) * 100);
                                return ` ${ctx.label}: ${ctx.raw} ms (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

function switchChartMode(mode) {
    currentChartMode = mode;
    const btnBar = document.getElementById("btnBarChart");
    const btnDoughnut = document.getElementById("btnDoughnutChart");
    if (btnBar && btnDoughnut) {
        if (mode === 'bar') {
            btnBar.classList.add("active");
            btnDoughnut.classList.remove("active");
        } else {
            btnDoughnut.classList.add("active");
            btnBar.classList.remove("active");
        }
    }
    initLatencyChart();
}

function updateLatencyTelemetry(latencies) {
    if (!latencies) return;
    activeLatencies = latencies;

    const totalSec = (latencies.total_ms / 1000).toFixed(2);
    const totalEl = document.getElementById("totalLatencyVal");
    const msEl = document.getElementById("totalMsVal");
    if (totalEl) totalEl.textContent = `${totalSec}s`;
    if (msEl) msEl.textContent = `${latencies.total_ms} ms round-trip`;

    const fastestEl = document.getElementById("fastestAgentMs");
    if (fastestEl) fastestEl.textContent = `${latencies.rag_agent_ms} ms`;

    const heaviestEl = document.getElementById("heaviestAgentMs");
    if (heaviestEl) heaviestEl.textContent = `${latencies.review_orchestrator_ms} ms`;

    initLatencyChart();
}

// Call on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    initLatencyChart();
});

