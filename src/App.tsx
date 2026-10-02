/**
 * AI-Based Code Review Assistant
 * Developed by: MUTHYALA YAMINI
 * Multi-Agent Architecture (LangGraph) + RAG (FAISS) + Gemini 3.8 Flash
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Upload,
  Trash2,
  Sparkles,
  ShieldAlert,
  Bug,
  Zap,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  ArrowRight,
  Copy,
  Download,
  AlertTriangle,
  FileCode,
  Search,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Info,
  Check,
  Cpu,
  Terminal,
  Activity,
  Gauge,
  ListTree,
  Split,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { LatencyDashboard, AgentLatencies } from './components/LatencyDashboard';
import { CodeExplainer, CodeExplanationData } from './components/CodeExplainer';
import { AnnotatedCodeViewer, LineAnnotation } from './components/AnnotatedCodeViewer';
import { DetailedErrorsList, DetailedErrorItem } from './components/DetailedErrorsList';
import { DiffViewer } from './components/DiffViewer';
import { LineByLineBreakdown } from './components/LineByLineBreakdown';
import { CodeStatusSummary } from './components/CodeStatusSummary';

interface IssueItem {
  id?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  line?: number;
  description: string;
  why_it_matters?: string;
  recommendation?: string;
  suggested_fix?: string;
}

interface RAGContextItem {
  title: string;
  source: string;
  category?: string;
  relevance: number;
  snippet: string;
}

interface AgentActivityItem {
  agent: string;
  status: string;
  details: string;
}

interface ReviewReport {
  id: string;
  overall_score: number;
  score?: number;
  is_code_correct?: boolean;
  code_status?: 'Working' | 'Contains Errors' | 'Needs Optimization';
  summary: string;
  language: string;
  severity_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  code_analysis_summary?: {
    correct_lines: number;
    warnings: number;
    errors: number;
    security_issues: number;
    performance_issues: number;
    suggestions: number;
  };
  code_explanation?: CodeExplanationData;
  line_by_line_analysis?: LineAnnotation[];
  detailed_errors?: DetailedErrorItem[];
  good_practices_detected?: string[];
  optional_improvements?: string[];
  what_changed?: string[];
  why_fix_works_overall?: string;
  bugs: IssueItem[];
  security_issues: IssueItem[];
  performance_issues: IssueItem[];
  quality_issues: IssueItem[];
  recommendations: string[];
  improved_code: string;
  original_code?: string;
  rag_context: RAGContextItem[];
  agent_activity: AgentActivityItem[];
  latencies?: AgentLatencies;
  created_at?: string;
}

const DEMO_VULNERABLE_CODE = `# Intentionally imperfect Python code for evaluator demonstration
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
    # Issue 4: Bare except swallowing all exceptions silently
    try:
        with open(file_path, "r") as f:
            return f.read()
    except:
        pass
    return None
`;

const DEMO_CORRECT_CODE = `"""
Clean, Production-Ready Python Module
Adheres to PEP 8, parameterized SQL execution, and defensive programming standards.
"""
import os
import sqlite3
import logging
from typing import Optional, List, Dict, Any

# Configure structured application logger
logger = logging.getLogger(__name__)

# Load API credentials securely from external environment
API_SECRET_KEY: str = os.getenv("API_SECRET_KEY", "default_secure_vault_token")

def fetch_user_record(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Safely retrieves a user record from SQLite database using parameterized queries.
    Prevents SQL injection vulnerabilities by separating SQL commands from parameter data.
    """
    try:
        with sqlite3.connect("production.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            query = "SELECT id, username, email, role FROM users WHERE id = ?"
            cursor.execute(query, (user_id,))
            record = cursor.fetchone()
            return dict(record) if record else None
    except sqlite3.Error as err:
        logger.error("Database query failed for user_id %s: %s", user_id, err)
        return None

def process_duplicates(data_items: List[Any]) -> List[Any]:
    """
    Deduplicates a collection of items in linear O(N) average time complexity using a hash set.
    Preserves original insertion order while eliminating quadratic comparison overhead.
    """
    seen = set()
    unique_items = []
    for item in data_items:
        if item not in seen:
            seen.add(item)
            unique_items.append(item)
    return unique_items

def parse_configuration(file_path: str) -> Optional[str]:
    """
    Safely reads configuration settings with explicit exception boundaries.
    """
    if not os.path.exists(file_path):
        logger.warning("Configuration file does not exist: %s", file_path)
        return None

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except (FileNotFoundError, PermissionError) as err:
        logger.error("Failed to read configuration from %s: %s", file_path, err)
        return None
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'knowledge' | 'about' | 'code-files' | 'telemetry'>('workspace');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<string>('Python');
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [leftEditorMode, setLeftEditorMode] = useState<'editor' | 'annotated'>('editor');
  const [rightReportTab, setRightReportTab] = useState<'overview' | 'explanation' | 'errors' | 'diff' | 'lines' | 'rag'>('overview');
  const [selectedGutterLine, setSelectedGutterLine] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [ragQuery, setRagQuery] = useState<string>('');
  const [ragSearchResults, setRagSearchResults] = useState<any[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // offline fallback
    }
  };

  const agentSteps = [
    { name: 'Code Analyzer Agent', desc: 'Parsing syntax, AST trees & control flow' },
    { name: 'Security Agent', desc: 'Auditing OWASP Top 10 flaws & hardcoded secrets' },
    { name: 'Quality & Performance Agent', desc: 'Evaluating cyclomatic complexity & O(N^2) bottlenecks' },
    { name: 'RAG Agent', desc: 'Querying FAISS vector index for authoritative standards' },
    { name: 'Review Orchestrator', desc: 'Deduplicating findings & synthesizing improved code' },
  ];

  const handleStartReview = async () => {
    if (!code.trim()) {
      alert('Please enter or upload code first.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setReport(null);

    // Step simulation progression
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < agentSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 850);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      clearInterval(interval);
      setCurrentStepIndex(agentSteps.length);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to review code');
      }

      const data: ReviewReport = await response.json();
      setReport(data);
      fetchHistory();
    } catch (e: any) {
      clearInterval(interval);
      alert('Code review failed: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const extToLang: Record<string, string> = {
      '.py': 'Python',
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.sql': 'SQL',
      '.html': 'HTML',
      '.css': 'CSS',
    };

    if (extToLang[ext]) {
      setLanguage(extToLang[ext]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleCopyImprovedCode = () => {
    if (!report?.improved_code) return;
    navigator.clipboard.writeText(report.improved_code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadImprovedCode = () => {
    if (!report?.improved_code) return;
    const blob = new Blob([report.improved_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `improved_${fileName || 'code'}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleManualRAGSearch = async () => {
    if (!ragQuery.trim()) return;
    setIsSearchingRag(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery, language }),
      });
      const data = await res.json();
      setRagSearchResults(data.results || []);
    } catch {
      alert('Search failed');
    } finally {
      setIsSearchingRag(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (selectedHistoryItem?.id === id) {
          setSelectedHistoryItem(null);
        }
      }
    } catch {
      alert('Could not delete history record');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 border-rose-800 bg-rose-950/40';
      case 'HIGH':
        return 'text-orange-400 border-orange-800 bg-orange-950/40';
      case 'MEDIUM':
        return 'text-amber-400 border-amber-800 bg-amber-950/40';
      case 'LOW':
        return 'text-blue-400 border-blue-800 bg-blue-950/40';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800/40';
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0f1d] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Navigation Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-slate-800/80 bg-[#0d1424]/90' : 'border-slate-200 bg-white/90'} backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base lg:text-lg tracking-tight flex items-center gap-2">
                <span>AI-Based Code Review Assistant</span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                LangGraph Multi-Agent · FAISS RAG · Gemini 3.8 Flash
              </div>
            </div>
          </div>

          {/* Center Navigation Segmented Controls */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-900/90 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'workspace'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('history'); fetchHistory(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Review History ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'knowledge'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'about'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Architecture & About
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Latency & Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('code-files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code-files'
                  ? theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python Project Files
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-emerald"></span>
              <span>AI Engine Online</span>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border transition-colors ${
                theme === 'dark' ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                MY
              </div>
              <span className="text-xs font-semibold hidden md:inline text-slate-300">M. Yamini</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around mt-3 pt-2 border-t border-slate-800/60 text-xs">
          <button onClick={() => setActiveTab('workspace')} className={`py-1 ${activeTab === 'workspace' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>Workspace</button>
          <button onClick={() => setActiveTab('telemetry')} className={`py-1 ${activeTab === 'telemetry' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>Telemetry</button>
          <button onClick={() => setActiveTab('history')} className={`py-1 ${activeTab === 'history' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>History</button>
          <button onClick={() => setActiveTab('knowledge')} className={`py-1 ${activeTab === 'knowledge' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>Knowledge</button>
          <button onClick={() => setActiveTab('about')} className={`py-1 ${activeTab === 'about' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>About</button>
          <button onClick={() => setActiveTab('code-files')} className={`py-1 ${activeTab === 'code-files' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>Files</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        
        {/* ===================== TAB 1: WORKSPACE ===================== */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Hero Banner */}
            <div className={`p-6 lg:p-8 rounded-2xl border ${theme === 'dark' ? 'border-slate-800 bg-gradient-to-br from-[#10172b] to-[#0c1222]' : 'border-slate-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30'} relative overflow-hidden`}>
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Autonomous Multi-Agent Architecture · Grounded FAISS Retrieval</span>
                </div>
                <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight mb-2">
                  Review Code. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Build Better Software.</span>
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  An intelligent multi-agent AI system that detects bugs, security vulnerabilities, algorithmic bottlenecks, and coding-standard violations using LangGraph state coordination and Google Gemini 3.8 Flash.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById('split-editor');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Code Review</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      theme === 'dark' ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Source File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".py,.js,.java,.cpp,.c,.html,.css,.ts,.sql"
                    onChange={handleFileUpload}
                  />

                  <button
                    onClick={() => {
                      setCode(DEMO_VULNERABLE_CODE);
                      setLanguage('Python');
                      setFileName('demo_vulnerable_script.py');
                      setLeftEditorMode('editor');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40 flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Load Demo Vulnerable Code</span>
                  </button>

                  <button
                    onClick={() => {
                      setCode(DEMO_CORRECT_CODE);
                      setLanguage('Python');
                      setFileName('demo_clean_service.py');
                      setLeftEditorMode('editor');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Load Demo Correct Code</span>
                  </button>
                </div>
              </div>

              {/* Statistics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/60">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Autonomous Agents</div>
                  <div className="text-lg font-bold text-blue-400">5 Specialized</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Vector Knowledge Base</div>
                  <div className="text-lg font-bold text-emerald-400">FAISS Connected</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Model Engine</div>
                  <div className="text-lg font-bold text-purple-400">Gemini 3.8 Flash</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Safety Policy</div>
                  <div className="text-lg font-bold text-amber-400">Zero Code Exec</div>
                </div>
              </div>
            </div>

            {/* Split Screen Workspace */}
            <div id="split-editor" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* LEFT: Code Input & Editor / Annotated Inspector */}
              <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'} shadow-sm overflow-hidden flex flex-col h-[820px]`}>
                
                {/* Editor Header */}
                <div className={`p-3.5 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold">Source Code</span>
                    {fileName && (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {fileName}
                      </span>
                    )}
                  </div>

                  {/* Mode Toggle if report is ready */}
                  {report && (
                    <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                      <button
                        onClick={() => setLeftEditorMode('editor')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          leftEditorMode === 'editor'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        onClick={() => setLeftEditorMode('annotated')}
                        className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                          leftEditorMode === 'annotated'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Annotated Lines</span>
                        {(report.detailed_errors || []).length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Language:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Python">Python (.py)</option>
                      <option value="JavaScript">JavaScript (.js)</option>
                      <option value="TypeScript">TypeScript (.ts)</option>
                      <option value="Java">Java (.java)</option>
                      <option value="C++">C++ (.cpp)</option>
                      <option value="C">C (.c)</option>
                      <option value="SQL">SQL (.sql)</option>
                      <option value="HTML">HTML (.html)</option>
                      <option value="CSS">CSS (.css)</option>
                    </select>
                  </div>
                </div>

                {/* Editor or Annotated View Body */}
                <div className="flex-1 relative p-0 bg-[#080d19] overflow-hidden">
                  {leftEditorMode === 'editor' ? (
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="// Paste your code here, load demo code, or upload a source file..."
                      className="w-full h-full p-4 font-mono text-xs sm:text-sm bg-transparent text-slate-200 border-0 outline-none resize-none leading-relaxed selection:bg-blue-600/30"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="h-full overflow-y-auto p-2">
                      <AnnotatedCodeViewer
                        lines={
                          report?.line_by_line_analysis && report.line_by_line_analysis.length > 0
                            ? report.line_by_line_analysis
                            : (code || '').split('\n').map((l, i) => {
                                const lineNum = i + 1;
                                const matchingErr = (report?.detailed_errors || []).find((e) => e.line === lineNum);
                                return {
                                  line: lineNum,
                                  code_snippet: l,
                                  status: matchingErr
                                    ? matchingErr.severity === 'CRITICAL'
                                      ? 'error'
                                      : 'warning'
                                    : 'correct',
                                  role: 'Statement',
                                  explanation: matchingErr ? matchingErr.problem : 'Standard statement execution.',
                                  error_title: matchingErr?.type,
                                  severity: matchingErr?.severity,
                                };
                              })
                        }
                        theme={theme}
                        selectedLine={selectedGutterLine}
                        onLineClick={(lineNum) => {
                          setSelectedGutterLine(lineNum);
                          setRightReportTab('errors');
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Editor Footer Actions */}
                <div className={`p-3.5 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} flex flex-wrap items-center justify-between gap-2`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => { setCode(''); setFileName(''); setReport(null); }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                    <button
                      onClick={() => {
                        setCode(DEMO_VULNERABLE_CODE);
                        setLanguage('Python');
                        setFileName('demo_vulnerable_script.py');
                        setLeftEditorMode('editor');
                      }}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 flex items-center gap-1"
                      title="Load imperfect code with security & performance issues"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Demo Vulnerable</span>
                    </button>
                    <button
                      onClick={() => {
                        setCode(DEMO_CORRECT_CODE);
                        setLanguage('Python');
                        setFileName('demo_clean_service.py');
                        setLeftEditorMode('editor');
                      }}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 flex items-center gap-1"
                      title="Load clean, working code adhering to standards"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Demo Clean</span>
                    </button>
                  </div>

                  <button
                    onClick={handleStartReview}
                    disabled={isAnalyzing}
                    className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                      isAnalyzing
                        ? 'bg-blue-800 cursor-not-allowed opacity-75'
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Agents Reviewing...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        <span>Analyze Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT: AI Review Output & Intelligent Assistant */}
              <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'} shadow-sm overflow-hidden flex flex-col h-[820px]`}>
                
                {/* Review Header with Navigation Tabs */}
                <div className={`p-3.5 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} flex flex-wrap items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold">AI Coding Assistant & Diagnostics</span>
                  </div>

                  <div>
                    {isAnalyzing ? (
                      <span className="text-xs font-semibold text-blue-400 animate-pulse flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                        5 Agents Working...
                      </span>
                    ) : report ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Awaiting submission</span>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs Navigation Strip when report is ready */}
                {report && (
                  <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                    <button
                      onClick={() => setRightReportTab('overview')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                        rightReportTab === 'overview'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Overview & Diagnostics
                    </button>
                    <button
                      onClick={() => setRightReportTab('explanation')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 flex items-center gap-1 ${
                        rightReportTab === 'explanation'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>How This Code Works</span>
                    </button>
                    <button
                      onClick={() => setRightReportTab('errors')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 flex items-center gap-1 ${
                        rightReportTab === 'errors'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Errors & Fixes ({(report.detailed_errors || []).length})</span>
                    </button>
                    <button
                      onClick={() => setRightReportTab('diff')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 flex items-center gap-1 ${
                        rightReportTab === 'diff'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Split className="w-3 h-3" />
                      <span>Diff & Refactor</span>
                    </button>
                    <button
                      onClick={() => setRightReportTab('lines')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 flex items-center gap-1 ${
                        rightReportTab === 'lines'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ListTree className="w-3 h-3" />
                      <span>Line-by-Line</span>
                    </button>
                    <button
                      onClick={() => setRightReportTab('rag')}
                      className={`px-2.5 py-1 rounded-md transition-all shrink-0 flex items-center gap-1 ${
                        rightReportTab === 'rag'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>RAG & Agents</span>
                    </button>
                  </div>
                )}

                {/* Review Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-6">
                  
                  {/* Real-Time Agentic AI Activity Box */}
                  <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        AI Agent Workflow
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {isAnalyzing ? `Agent ${Math.min(currentStepIndex + 1, agentSteps.length)} of 5 active` : report ? '5 / 5 Finished' : 'Idle'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {agentSteps.map((step, idx) => {
                        const isDone = !isAnalyzing && report ? true : idx < currentStepIndex;
                        const isCurrent = isAnalyzing && idx === currentStepIndex;

                        return (
                          <div
                            key={step.name}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                              isCurrent
                                ? 'border-blue-500/50 bg-blue-950/20 text-blue-200'
                                : isDone
                                ? 'border-emerald-800/40 bg-emerald-950/20 text-slate-300'
                                : 'border-slate-800/40 bg-slate-900/40 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : isCurrent ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] shrink-0 text-slate-500">
                                  {idx + 1}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-200">{step.name}</div>
                                <div className="text-[11px] text-slate-400">{step.desc}</div>
                              </div>
                            </div>

                            <span className="text-[11px] font-mono">
                              {isDone ? 'Completed' : isCurrent ? 'Working...' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Empty placeholder state */}
                  {!report && !isAnalyzing && (
                    <div className="text-center py-12 px-4 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                        <Terminal className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-300">Your AI review will appear here</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Paste your code on the left and click "Analyze Code", or test with <strong>Demo Vulnerable</strong> or <strong>Demo Clean</strong> code presets.
                      </p>
                    </div>
                  )}

                  {/* Completed Review Report Sections */}
                  {report && (
                    <div className="space-y-6">
                      
                      {/* View 1: Overview & Diagnostics */}
                      {rightReportTab === 'overview' && (
                        <div className="space-y-6">
                          {/* 1. Summary Panel & Correct Code Banner */}
                          <CodeStatusSummary
                            isCodeCorrect={Boolean(report.is_code_correct)}
                            codeStatus={report.code_status}
                            overallScore={report.overall_score}
                            totalErrors={(report.detailed_errors || []).filter((e) => e.severity === 'CRITICAL').length || (report.bugs || []).length}
                            totalWarnings={(report.detailed_errors || []).filter((e) => e.severity === 'HIGH' || e.severity === 'MEDIUM').length || 0}
                            securityCount={(report.security_issues || []).length}
                            performanceCount={(report.performance_issues || []).length}
                            summary={report.summary}
                            goodPractices={report.good_practices_detected || []}
                            optionalImprovements={report.optional_improvements || []}
                            theme={theme}
                          />

                          {/* 2. Error Diagnostics if errors exist */}
                          {(report.detailed_errors || []).length > 0 && (
                            <DetailedErrorsList
                              errors={report.detailed_errors || []}
                              theme={theme}
                              onJumpToLine={(l) => {
                                setLeftEditorMode('annotated');
                                setSelectedGutterLine(l);
                              }}
                            />
                          )}

                          {/* 3. How This Code Works Section */}
                          <CodeExplainer
                            explanation={report.code_explanation}
                            language={language}
                            theme={theme}
                          />

                          {/* 4. Refactored & Diff View */}
                          <DiffViewer
                            originalCode={code}
                            improvedCode={report.improved_code}
                            whatChanged={report.what_changed || []}
                            whyFixWorksOverall={report.why_fix_works_overall}
                            theme={theme}
                            language={language}
                            fileName={fileName}
                          />
                        </div>
                      )}

                      {/* View 2: How This Code Works Only */}
                      {rightReportTab === 'explanation' && (
                        <div className="space-y-6">
                          <CodeExplainer
                            explanation={report.code_explanation}
                            language={language}
                            theme={theme}
                          />
                        </div>
                      )}

                      {/* View 3: Errors & Fixes Only */}
                      {rightReportTab === 'errors' && (
                        <div className="space-y-6">
                          {(report.detailed_errors || []).length > 0 ? (
                            <DetailedErrorsList
                              errors={report.detailed_errors || []}
                              theme={theme}
                              onJumpToLine={(l) => {
                                setLeftEditorMode('annotated');
                                setSelectedGutterLine(l);
                              }}
                            />
                          ) : (
                            <div className="p-8 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 text-center space-y-3">
                              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                              <h4 className="text-base font-bold text-emerald-300">✓ Code is working correctly</h4>
                              <p className="text-xs text-slate-300 max-w-md mx-auto">
                                No critical errors or vulnerabilities detected. The submitted code adheres to standard language syntax and runtime boundaries.
                              </p>
                              {report.optional_improvements && report.optional_improvements.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-black/40 border border-slate-800 text-left text-xs space-y-1.5">
                                  <div className="font-bold text-blue-400">Optional Quality Improvements:</div>
                                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                                    {report.optional_improvements.map((opt, i) => (
                                      <li key={i}>{opt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* View 4: Diff & Refactor Only */}
                      {rightReportTab === 'diff' && (
                        <div className="space-y-6">
                          <DiffViewer
                            originalCode={code}
                            improvedCode={report.improved_code}
                            whatChanged={report.what_changed || []}
                            whyFixWorksOverall={report.why_fix_works_overall}
                            theme={theme}
                            language={language}
                            fileName={fileName}
                          />
                        </div>
                      )}

                      {/* View 5: Line-by-Line Breakdown Only */}
                      {rightReportTab === 'lines' && (
                        <div className="space-y-6">
                          <LineByLineBreakdown
                            lines={
                              report?.line_by_line_analysis && report.line_by_line_analysis.length > 0
                                ? report.line_by_line_analysis
                                : (code || '').split('\n').map((l, i) => ({
                                    line: i + 1,
                                    code_snippet: l,
                                    status: 'correct',
                                    role: 'Statement',
                                    explanation: 'Standard code statement.',
                                  }))
                            }
                            theme={theme}
                            onLineClick={(l) => {
                              setSelectedGutterLine(l);
                              setLeftEditorMode('annotated');
                            }}
                          />
                        </div>
                      )}

                      {/* View 6: RAG Citations & Multi-Agent Activity */}
                      {rightReportTab === 'rag' && (
                        <div className="space-y-6">
                          {/* RAG Knowledge Used */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                              Knowledge Used (FAISS RAG Retrieved Standards)
                            </h4>
                            <div className="space-y-2">
                              {(report.rag_context || []).map((rag, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-slate-200">{rag.title}</span>
                                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                                      Relevance: {rag.relevance}%
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono mb-1">Source: {rag.source}</div>
                                  <div className="text-slate-400 text-[11px] leading-relaxed">{rag.snippet}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Multi-Agent Log Activity */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-400" />
                              LangGraph Agent Execution Logs
                            </h4>
                            <div className="space-y-2">
                              {(report.agent_activity || []).map((act, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-slate-200">{act.agent}</span>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{act.details}</p>
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                                    {act.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Real-time Latency & Performance Dashboard Section (Chart.js) */}
            <div className="pt-2">
              <LatencyDashboard
                latencies={report?.latencies}
                isAnalyzing={isAnalyzing}
                theme={theme}
              />
            </div>

          </div>
        )}

        {/* ===================== TAB 2: REVIEW HISTORY ===================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>Review History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Persistent review logs stored in SQLite database.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('workspace')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 w-fit"
              >
                <Play className="w-3.5 h-3.5" />
                <span>New Review</span>
              </button>
            </div>

            {/* History Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Bugs</th>
                      <th className="py-3 px-4">Security</th>
                      <th className="py-3 px-4">Performance</th>
                      <th className="py-3 px-4">Summary</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No reviews found in history. Run your first review on the Dashboard!
                        </td>
                      </tr>
                    ) : (
                      history.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedHistoryItem(item)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                              {item.language}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${getScoreColor(item.score)}`}>
                              {item.score} / 100
                            </span>
                          </td>
                          <td className="py-3 px-4 text-rose-400 font-bold">{item.bugs_count || 0}</td>
                          <td className="py-3 px-4 text-amber-400 font-bold">{item.security_count || 0}</td>
                          <td className="py-3 px-4 text-blue-400 font-bold">{item.performance_count || 0}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{item.summary}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => handleDeleteHistory(item.id, e)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected History Item Detail Modal / Section */}
            {selectedHistoryItem && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1424] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2 py-1 rounded border border-blue-800/40">
                      ID: {selectedHistoryItem.id}
                    </span>
                    <h3 className="text-base font-bold">{selectedHistoryItem.language} Review Detail</h3>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryItem(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Submitted Source Code</h4>
                    <pre className="p-3 bg-black rounded-xl font-mono text-xs text-slate-300 max-h-64 overflow-y-auto border border-slate-800">
                      {selectedHistoryItem.code}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Refactored Code</h4>
                    <pre className="p-3 bg-black rounded-xl font-mono text-xs text-emerald-400 max-h-64 overflow-y-auto border border-slate-800">
                      {selectedHistoryItem.improved_code}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: KNOWLEDGE BASE ===================== */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>RAG Standards Knowledge Base (FAISS)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore the authoritative coding standards, security directives, and architecture rules indexed in vector space.
              </p>
            </div>

            {/* Direct Vector Search Box */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1424] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Semantic Vector Query</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualRAGSearch()}
                  placeholder="e.g. SQL injection prevention, PEP 8 function naming, exception handling..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg outline-none text-slate-200 focus:border-blue-500"
                />
                <button
                  onClick={handleManualRAGSearch}
                  disabled={isSearchingRag}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Vectors</span>
                </button>
              </div>

              {ragSearchResults.length > 0 && (
                <div className="mt-4 space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400 font-mono">Found {ragSearchResults.length} matching knowledge chunks:</div>
                  {ragSearchResults.map((res, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-200">{res.title}</strong>
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                          Relevance: {res.relevance}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mb-1">Source: {res.source} ({res.category})</div>
                      <div className="text-slate-300 leading-relaxed font-mono bg-black/40 p-2 rounded">{res.snippet}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Standard Catalog Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424]">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Python Standards</div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">PEP 8 & Clean Architecture</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Naming conventions, 4-space indentation, explicit exception handling, context managers, and credential isolation.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424]">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Java Standards</div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">SOLID & OWASP Mitigations</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  PreparedStatement parameterized queries, XXE prevention, thread synchronization, and immutable design.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424]">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">JS / TS Standards</div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">Secure Modern ECMAScript</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Strict equality (===), DOMPurify XSS mitigation, async/await exception handling, and prototype pollution defenses.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424]">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">General Security</div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">OWASP Top 10 & Quality</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cyclomatic complexity limits, DRY modular architecture, testing pyramid standards, and credential sanitization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: ARCHITECTURE & ABOUT ===================== */}
        {activeTab === 'about' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-800/40">
                System Architecture Specification
              </span>
              <h2 className="text-2xl font-extrabold">AI-Based Code Review Assistant</h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Final Year B.Tech Computer Science & Engineering Project by <strong>MUTHYALA YAMINI</strong>
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1424] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                LangGraph Multi-Agent Execution Pipeline
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-center">
                  <span className="text-blue-400 font-bold">[1] Source Code Input</span>
                  <div className="text-[11px] text-slate-400">Raw source code uploaded or pasted via UI editor (Python, JS, Java, etc.)</div>
                </div>

                <div className="text-center text-slate-600">↓</div>

                <div className="p-3 rounded-lg border border-indigo-800/60 bg-indigo-950/20 text-center">
                  <span className="text-indigo-300 font-bold">[2] LangGraph Orchestrator (StateGraph)</span>
                  <div className="text-[11px] text-slate-400">Manages shared TypedDict state: code, language, analysis dicts, RAG context, final report</div>
                </div>

                <div className="text-center text-slate-600">↓</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg border border-rose-800/40 bg-rose-950/20 text-center">
                    <span className="text-rose-400 font-bold">Agent 1: Code Analyzer</span>
                    <div className="text-[10px] text-slate-400 mt-1">Parses AST, checks syntax validity, control flow invariants</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-800/40 bg-amber-950/20 text-center">
                    <span className="text-amber-400 font-bold">Agent 2: Security Agent</span>
                    <div className="text-[10px] text-slate-400 mt-1">Audits OWASP Top 10, SQLi, command injection, leaked secrets</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-blue-800/40 bg-blue-950/20 text-center">
                    <span className="text-blue-400 font-bold">Agent 3: Quality & Perf</span>
                    <div className="text-[10px] text-slate-400 mt-1">Evaluates O(N^2) complexity, memory efficiency, clean code</div>
                  </div>
                </div>

                <div className="text-center text-slate-600">↓</div>

                <div className="p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/20 text-center">
                  <span className="text-emerald-400 font-bold">[3] Agent 4: RAG Agent (FAISS Vector Retrieval)</span>
                  <div className="text-[11px] text-slate-400">Embeds query, performs cosine similarity lookup over PEP 8 & OWASP chunks, injects citations</div>
                </div>

                <div className="text-center text-slate-600">↓</div>

                <div className="p-3 rounded-lg border border-purple-800/60 bg-purple-950/20 text-center">
                  <span className="text-purple-300 font-bold">[4] Agent 5: Review Orchestrator (Gemini 3.8 Flash)</span>
                  <div className="text-[11px] text-slate-400">Synthesizes deduplicated findings, calculates score (0-100), generates refactored code</div>
                </div>

                <div className="text-center text-slate-600">↓</div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-center">
                  <span className="text-emerald-400 font-bold">[5] SQLite Database & Split-Screen Dashboard</span>
                  <div className="text-[11px] text-slate-400">Records review history in reviews.db & displays side-by-side diff with 1-click download</div>
                </div>
              </div>
            </div>

            {/* Developer Card */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1424] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Final Year Academic Project</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Developer: <strong className="text-slate-200">MUTHYALA YAMINI</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Tech Stack: Python 3.11+, Flask, LangGraph, FAISS, Gemini 3.8 Flash, SQLite3, Bootstrap 5 / React
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-400 font-mono text-xs font-bold">
                B.Tech Computer Science
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: PYTHON PROJECT FILES ===================== */}
        {activeTab === 'code-files' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <span>Python / Flask Codebase Explorer</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Direct view of the modular Python backend files located in <code className="font-mono text-blue-400">/AI-Code-Review-Assistant/</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] space-y-2">
                <div className="text-xs font-bold text-blue-400">Core Backend</div>
                <ul className="text-xs space-y-1 font-mono text-slate-300">
                  <li>• app.py (Flask routes & API)</li>
                  <li>• config.py (Environment config)</li>
                  <li>• requirements.txt (Dependencies)</li>
                  <li>• .env.example (API Key setup)</li>
                  <li>• README.md (Documentation)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] space-y-2">
                <div className="text-xs font-bold text-emerald-400">Multi-Agent System (LangGraph)</div>
                <ul className="text-xs space-y-1 font-mono text-slate-300">
                  <li>• agents/graph.py (LangGraph StateGraph)</li>
                  <li>• agents/code_agent.py (AST & syntax)</li>
                  <li>• agents/security_agent.py (OWASP Top 10)</li>
                  <li>• agents/quality_agent.py (Complexity)</li>
                  <li>• agents/rag_agent.py (Retrieval node)</li>
                  <li>• agents/review_agent.py (Synthesis)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] space-y-2">
                <div className="text-xs font-bold text-purple-400">RAG & Database</div>
                <ul className="text-xs space-y-1 font-mono text-slate-300">
                  <li>• rag/vector_store.py (FAISS Index FlatL2)</li>
                  <li>• rag/embeddings.py (SentenceTransformers)</li>
                  <li>• rag/retriever.py (Semantic search)</li>
                  <li>• database/database.py (SQLite setup)</li>
                  <li>• database/models.py (ReviewModel)</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
              <div className="font-bold text-slate-200 mb-1">How to run the Python project locally:</div>
              <pre className="p-3 bg-black rounded-lg font-mono text-emerald-400 overflow-x-auto border border-slate-800">
{`cd AI-Code-Review-Assistant
python -m venv venv
source venv/bin/activate  # (On Windows: venv\\Scripts\\activate)
pip install -r requirements.txt
cp .env.example .env      # Add your GEMINI_API_KEY
python app.py
# Open http://127.0.0.1:5000 in your browser`}
              </pre>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: LATENCY & PERFORMANCE DASHBOARD ===================== */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-400" />
                  <span>Real-Time Latency & Performance Dashboard</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Benchmarking processing duration across the 5 LangGraph autonomous agents using Chart.js.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Back to Code Editor</span>
                </button>
              </div>
            </div>

            <LatencyDashboard
              latencies={report?.latencies}
              isAnalyzing={isAnalyzing}
              theme={theme}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t ${theme === 'dark' ? 'border-slate-800/80 bg-[#090d18]' : 'border-slate-200 bg-white'} px-4 lg:px-8 py-5 text-xs text-slate-400`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <div className="font-bold text-slate-200">AI-Based Code Review Assistant</div>
            <div className="text-[11px] text-slate-400">
              Powered by Agentic AI (LangGraph) · RAG (FAISS) · Google Gemini 3.8 Flash
            </div>
          </div>
          <div className="text-center md:text-right">
            <div>Designed & Developed by <strong className="text-slate-200">MUTHYALA YAMINI</strong></div>
            <div className="text-[11px] text-slate-400">Final Year B.Tech Computer Science & Engineering Capstone Project</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
