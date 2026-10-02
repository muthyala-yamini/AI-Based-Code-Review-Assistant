import React, { useState } from 'react';
import {
  ListTree,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { LineAnnotation } from './AnnotatedCodeViewer';

interface LineByLineBreakdownProps {
  lines: LineAnnotation[];
  theme: 'dark' | 'light';
  onLineClick?: (lineNumber: number) => void;
}

export const LineByLineBreakdown: React.FC<LineByLineBreakdownProps> = ({
  lines,
  theme,
  onLineClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'issues' | 'statements'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLines, setExpandedLines] = useState<Record<number, boolean>>({ 1: true });
  const isDark = theme === 'dark';

  const toggleLine = (lineNum: number) => {
    setExpandedLines((prev) => ({
      ...prev,
      [lineNum]: !prev[lineNum],
    }));
  };

  const filteredLines = lines.filter((l) => {
    if (filter === 'issues' && l.status !== 'error' && l.status !== 'warning') {
      return false;
    }
    if (filter === 'statements' && (l.status === 'error' || l.status === 'warning')) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.code_snippet.toLowerCase().includes(q) ||
        l.explanation.toLowerCase().includes(q) ||
        (l.role && l.role.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'error':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Error</span>
          </span>
        );
      case 'warning':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </span>
        );
      case 'suggestion':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Suggestion</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Correct</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'
      } shadow-sm overflow-hidden p-5 space-y-4 transition-colors`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ListTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Interactive Line-by-Line Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any line to inspect what the code does, its syntactic role, and its execution implications.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Lines ({lines.length})
            </button>
            <button
              onClick={() => setFilter('issues')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'issues' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Issues Only
            </button>
            <button
              onClick={() => setFilter('statements')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'statements' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clean Lines
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter lines by keyword (e.g. import, query, def, except)..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none focus:border-blue-500"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredLines.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No lines match the selected filter.
          </div>
        ) : (
          filteredLines.map((lineItem) => {
            const isExpanded = Boolean(expandedLines[lineItem.line]);

            return (
              <div
                key={lineItem.line}
                className={`rounded-xl border ${
                  lineItem.status === 'error'
                    ? 'border-rose-900/50 bg-rose-950/10'
                    : lineItem.status === 'warning'
                    ? 'border-amber-900/50 bg-amber-950/10'
                    : isDark
                    ? 'border-slate-800/80 bg-slate-900/30'
                    : 'border-slate-200 bg-slate-50'
                } overflow-hidden transition-all`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleLine(lineItem.line)}
                  className="px-3.5 py-2.5 cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono text-[11px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40 shrink-0">
                      Line {lineItem.line}
                    </span>

                    {getStatusBadge(lineItem.status)}

                    {lineItem.role && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {lineItem.role}
                      </span>
                    )}

                    <span className="font-mono text-xs text-slate-200 truncate">
                      {lineItem.code_snippet}
                    </span>
                  </div>

                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded explanation */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-black/40 border-t border-slate-800/60 space-y-2 text-xs">
                    <div className="font-mono text-[11px] p-2 rounded bg-black/70 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre">
                      {lineItem.code_snippet}
                    </div>

                    <div className="text-slate-300 leading-relaxed text-xs">
                      <strong className="text-blue-400 mr-1.5">What this line does:</strong>
                      {lineItem.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
