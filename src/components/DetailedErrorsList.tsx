import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

export interface DetailedErrorItem {
  id: string;
  error_number: number;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  line: number;
  function_name?: string;
  problematic_code: string;
  problem: string;
  why_it_happens: string;
  effect: string;
  what_program_expects?: string;
  why_fails?: string;
  how_to_avoid?: string;
  fix_location?: string;
  required_change?: string;
  original_snippet?: string;
  corrected_snippet?: string;
  why_fix_works?: string;
  confidence?: string;
}

interface DetailedErrorsListProps {
  errors: DetailedErrorItem[];
  theme: 'dark' | 'light';
  onJumpToLine?: (line: number) => void;
}

export const DetailedErrorsList: React.FC<DetailedErrorsListProps> = ({
  errors,
  theme,
  onJumpToLine,
}) => {
  const isDark = theme === 'dark';
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!errors || errors.length === 0) return null;

  const handleCopySnippet = (snippet: string, idx: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-950/60 text-rose-400 border-rose-800/80',
          border: 'border-rose-900/60',
          accent: 'text-rose-400',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-950/60 text-orange-400 border-orange-800/80',
          border: 'border-orange-900/60',
          accent: 'text-orange-400',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
          border: 'border-amber-900/60',
          accent: 'text-amber-400',
        };
      default:
        return {
          badge: 'bg-blue-950/60 text-blue-400 border-blue-800/80',
          border: 'border-blue-900/60',
          accent: 'text-blue-400',
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Detailed Error & Vulnerability Diagnostics ({errors.length})</span>
        </h4>
        <span className="text-[11px] font-mono text-slate-500">
          Ranked by Severity & AST Traversal
        </span>
      </div>

      <div className="space-y-4">
        {errors.map((err, idx) => {
          const style = getSeverityStyle(err.severity);
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={err.id || idx}
              className={`rounded-2xl border ${style.border} ${
                isDark ? 'bg-[#0d1424]' : 'bg-white'
              } overflow-hidden shadow-sm transition-all`}
            >
              {/* Card Header Accordion */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className={`p-4 cursor-pointer flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900/50 hover:bg-slate-900/80' : 'bg-slate-50 hover:bg-slate-100'
                } transition-colors`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800/40">
                    ERROR #{err.error_number || idx + 1}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${style.badge}`}>
                    {err.severity}
                  </span>

                  <span className="text-xs font-bold text-slate-200">
                    {err.type}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToLine?.(err.line);
                    }}
                    className="text-[11px] font-mono text-blue-400 bg-blue-950/40 hover:bg-blue-900/50 px-2 py-0.5 rounded border border-blue-800/40"
                  >
                    Line {err.line}
                    {err.function_name ? ` · in ${err.function_name}()` : ''}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {isExpanded ? 'Collapse' : 'Inspect'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Problematic Code Quick Strip */}
              <div className="px-4 py-2 bg-black/60 border-t border-b border-slate-800/60 flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-rose-400 font-bold">Line {err.line}:</span>
                  <span className="text-rose-200 truncate">{err.problematic_code}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                  {err.confidence || 'High confidence'}
                </span>
              </div>

              {/* Detailed Expanded Body */}
              {isExpanded && (
                <div className="p-5 space-y-5 text-xs">
                  {/* Problem & Why it happens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                      <div className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Problem Diagnosis</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{err.problem}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                      <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why This Error Occurs</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{err.why_it_happens}</p>
                    </div>
                  </div>

                  {/* Impact / Effect */}
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-300 mr-1">Runtime & System Impact:</strong>
                      <span className="text-rose-200/90 leading-relaxed">{err.effect}</span>
                    </div>
                  </div>

                  {/* Section: Error Reasoning */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Deep Reasoning & Requirements Broken</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      {err.what_program_expects && (
                        <div>
                          <span className="text-slate-400 block font-semibold mb-0.5">What the program expects:</span>
                          <span className="text-slate-200">{err.what_program_expects}</span>
                        </div>
                      )}

                      {err.why_fails && (
                        <div>
                          <span className="text-slate-400 block font-semibold mb-0.5">Why current code fails:</span>
                          <span className="text-rose-300">{err.why_fails}</span>
                        </div>
                      )}
                    </div>

                    {err.how_to_avoid && (
                      <div className="pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-emerald-400 font-semibold mr-1">How to avoid in future projects:</span>
                        <span className="text-slate-300">{err.how_to_avoid}</span>
                      </div>
                    )}
                  </div>

                  {/* Section: How to Fix It (Before & After Snippet) */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                        <span>How to Fix It</span>
                      </h5>
                      {err.fix_location && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Fix Location: <strong className="text-slate-200">{err.fix_location}</strong>
                        </span>
                      )}
                    </div>

                    {err.required_change && (
                      <div className="text-slate-300 text-xs">
                        <strong className="text-blue-400 mr-1">Required Action:</strong>
                        <span>{err.required_change}</span>
                      </div>
                    )}

                    {/* Original vs Corrected Code Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                      {/* Original Code */}
                      <div>
                        <div className="text-[10px] font-sans font-bold text-rose-400 uppercase mb-1">
                          Original Problematic Snippet
                        </div>
                        <pre className="p-3 bg-black/80 text-rose-300 rounded-lg border border-rose-950 overflow-x-auto">
                          {err.original_snippet || err.problematic_code}
                        </pre>
                      </div>

                      {/* Corrected Code */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase">
                            Corrected Code Snippet
                          </span>
                          {err.corrected_snippet && (
                            <button
                              onClick={() => handleCopySnippet(err.corrected_snippet!, idx)}
                              className="text-[10px] font-sans text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Fix</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <pre className="p-3 bg-black/80 text-emerald-400 rounded-lg border border-emerald-950 overflow-x-auto">
                          {err.corrected_snippet || '# Corrected implementation'}
                        </pre>
                      </div>
                    </div>

                    {err.why_fix_works && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Why this fix works:</strong> {err.why_fix_works}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
