import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Code2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export interface LineAnnotation {
  line: number;
  code_snippet: string;
  status?: 'error' | 'warning' | 'suggestion' | 'correct';
  role?: string;
  explanation: string;
  error_title?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
}

interface AnnotatedCodeViewerProps {
  lines: LineAnnotation[];
  theme: 'dark' | 'light';
  onLineClick?: (lineNumber: number) => void;
  selectedLine?: number | null;
}

export const AnnotatedCodeViewer: React.FC<AnnotatedCodeViewerProps> = ({
  lines,
  theme,
  onLineClick,
  selectedLine,
}) => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const isDark = theme === 'dark';

  const getStatusConfig = (status?: string, severity?: string) => {
    if (status === 'error' || severity === 'CRITICAL') {
      return {
        bg: isDark ? 'bg-rose-950/40 border-l-4 border-l-rose-500' : 'bg-rose-50 border-l-4 border-l-rose-500',
        badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        badgeText: '⚠ ERROR',
        icon: <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />,
        text: 'text-rose-200',
        lineColor: 'text-rose-400 font-bold',
      };
    }
    if (status === 'warning' || severity === 'HIGH' || severity === 'MEDIUM') {
      return {
        bg: isDark ? 'bg-amber-950/30 border-l-4 border-l-amber-500' : 'bg-amber-50 border-l-4 border-l-amber-500',
        badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        badgeText: '⚡ WARNING',
        icon: <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />,
        text: 'text-amber-200',
        lineColor: 'text-amber-400 font-bold',
      };
    }
    if (status === 'suggestion') {
      return {
        bg: isDark ? 'bg-blue-950/20 border-l-4 border-l-blue-400' : 'bg-blue-50 border-l-4 border-l-blue-400',
        badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        badgeText: 'ℹ SUGGESTION',
        icon: <Info className="w-3 h-3 text-blue-400 shrink-0" />,
        text: 'text-blue-200',
        lineColor: 'text-blue-400',
      };
    }
    return {
      bg: isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50',
      badge: 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30',
      badgeText: '✓ OK',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 opacity-40" />,
      text: isDark ? 'text-slate-300' : 'text-slate-800',
      lineColor: 'text-slate-500',
    };
  };

  const errorCount = lines.filter((l) => l.status === 'error').length;
  const warningCount = lines.filter((l) => l.status === 'warning').length;
  const suggestionCount = lines.filter((l) => l.status === 'suggestion').length;
  const correctCount = lines.filter((l) => l.status === 'correct' || !l.status).length;

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? 'border-slate-800 bg-[#080d19]' : 'border-slate-200 bg-white'
      } shadow-sm overflow-hidden flex flex-col font-mono text-xs`}
    >
      {/* Visual Legend Header */}
      <div
        className={`px-4 py-2.5 border-b ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
        } flex flex-wrap items-center justify-between gap-3 text-[11px]`}
      >
        <div className="flex items-center gap-2 font-bold font-sans">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>Interactive Annotated Code Inspector</span>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2.5 font-sans">
          <div className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>{errorCount} Errors</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{warningCount} Warnings</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{suggestionCount} Suggestions</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{correctCount} Clean</span>
          </div>
        </div>
      </div>

      {/* Code Lines Container */}
      <div className="overflow-x-auto max-h-[560px] overflow-y-auto divide-y divide-slate-800/20 select-text">
        {lines.map((item) => {
          const cfg = getStatusConfig(item.status, item.severity);
          const isSelected = selectedLine === item.line;
          const isProblematic = item.status === 'error' || item.status === 'warning';

          return (
            <div
              key={item.line}
              onMouseEnter={() => setHoveredLine(item.line)}
              onMouseLeave={() => setHoveredLine(null)}
              onClick={() => onLineClick?.(item.line)}
              className={`group flex items-start transition-all cursor-pointer ${cfg.bg} ${
                isSelected ? 'ring-2 ring-blue-500 z-10' : ''
              }`}
            >
              {/* Line Gutter */}
              <div
                className={`w-12 sm:w-14 py-1.5 px-2 text-right select-none shrink-0 border-r ${
                  isDark ? 'border-slate-800/60 bg-black/30' : 'border-slate-200 bg-slate-100/50'
                } ${cfg.lineColor}`}
              >
                {item.line}
              </div>

              {/* Code Gutter Status Badge (Red, Yellow, Blue, Green) */}
              <div className="w-24 sm:w-28 py-1.5 px-2 shrink-0 select-none flex items-center justify-between">
                {isProblematic ? (
                  <span
                    className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${cfg.badge}`}
                  >
                    {cfg.icon}
                    <span>{cfg.badgeText}</span>
                  </span>
                ) : item.status === 'suggestion' ? (
                  <span
                    className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${cfg.badge}`}
                  >
                    {cfg.icon}
                    <span>SUGGEST</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-emerald-500/40 flex items-center gap-1 pl-1">
                    {cfg.icon}
                    <span>OK</span>
                  </span>
                )}
              </div>

              {/* Code Content */}
              <div className="flex-1 py-1.5 px-3 overflow-x-auto whitespace-pre font-mono text-xs">
                <span className={cfg.text}>{item.code_snippet || ' '}</span>

                {/* Inline annotation callout if line is problematic */}
                {isProblematic && (
                  <div className="mt-1 font-sans text-[11px] p-2 rounded-lg bg-black/60 border border-slate-700/60 flex items-start gap-2">
                    {cfg.icon}
                    <div className="flex-1">
                      <span className="font-bold text-slate-200 mr-2">
                        Line {item.line} {item.error_title ? `· ${item.error_title}` : ''}:
                      </span>
                      <span className="text-slate-300">{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
