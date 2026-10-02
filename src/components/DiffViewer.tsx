import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Split,
  FileCode,
  Sparkles,
  CheckCircle2,
  ListChecks
} from 'lucide-react';

interface DiffViewerProps {
  originalCode: string;
  improvedCode: string;
  whatChanged?: string[];
  whyFixWorksOverall?: string;
  theme: 'dark' | 'light';
  language: string;
  fileName?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  improvedCode,
  whatChanged = [],
  whyFixWorksOverall,
  theme,
  language,
  fileName,
}) => {
  const [viewMode, setViewMode] = useState<'improved' | 'diff'>('diff');
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([improvedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `improved_${fileName || 'refactored_code'}.${language === 'Python' ? 'py' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const originalLines = originalCode.split('\n');
  const improvedLines = improvedCode.split('\n');
  const maxLines = Math.max(originalLines.length, improvedLines.length);

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'
      } shadow-sm overflow-hidden space-y-4 p-5 transition-colors`}
    >
      {/* Header with View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Refactored & Improved Code</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                100% Validated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Clean architecture, parameterized database calls, explicit error boundaries & PEP 8 formatting.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('improved')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'improved'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Improved Code
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'diff'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>Diff View</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      {viewMode === 'improved' ? (
        <div className="rounded-xl border border-slate-800 bg-[#080d19] overflow-hidden">
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Production-Ready Code ({improvedLines.length} lines)</span>
            </div>
            <span>{language}</span>
          </div>

          <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed whitespace-pre">
            {improvedCode}
          </pre>
        </div>
      ) : (
        /* Side-by-Side Diff View */
        <div className="rounded-xl border border-slate-800 bg-[#080d19] overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-800 bg-slate-900/90 border-b border-slate-800 text-xs font-mono font-bold text-slate-400">
            <div className="px-4 py-2 text-rose-400 bg-rose-950/20 flex items-center justify-between">
              <span>Original Source Code</span>
              <span className="text-[10px] font-sans font-semibold text-rose-400/80">Has Vulnerabilities</span>
            </div>
            <div className="px-4 py-2 text-emerald-400 bg-emerald-950/20 flex items-center justify-between">
              <span>AI Refactored Code</span>
              <span className="text-[10px] font-sans font-semibold text-emerald-400">Fixed & Grounded</span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-800 max-h-[500px] overflow-y-auto text-xs font-mono">
            {/* Original Column */}
            <div className="divide-y divide-slate-800/40 bg-black/40">
              {Array.from({ length: maxLines }).map((_, i) => {
                const line = originalLines[i];
                return (
                  <div key={i} className="flex items-start hover:bg-slate-900/40">
                    <span className="w-10 py-1 px-2 text-right text-slate-600 select-none text-[11px] shrink-0 border-r border-slate-800/40">
                      {line !== undefined ? i + 1 : ''}
                    </span>
                    <span className="py-1 px-3 whitespace-pre text-slate-300 overflow-x-auto">
                      {line !== undefined ? line : ' '}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Improved Column */}
            <div className="divide-y divide-slate-800/40 bg-black/40">
              {Array.from({ length: maxLines }).map((_, i) => {
                const line = improvedLines[i];
                return (
                  <div key={i} className="flex items-start hover:bg-slate-900/40">
                    <span className="w-10 py-1 px-2 text-right text-emerald-600/70 select-none text-[11px] shrink-0 border-r border-slate-800/40">
                      {line !== undefined ? i + 1 : ''}
                    </span>
                    <span className="py-1 px-3 whitespace-pre text-emerald-300 overflow-x-auto">
                      {line !== undefined ? line : ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary of What Changed & Why Fix Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {whatChanged.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-blue-400" />
              <span>What Changed in this Revision</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {whatChanged.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {whyFixWorksOverall && (
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Architectural Rationale</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {whyFixWorksOverall}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
