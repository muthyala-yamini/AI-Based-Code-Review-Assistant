import React from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Award,
  Sparkles,
  Info
} from 'lucide-react';

interface CodeStatusSummaryProps {
  isCodeCorrect: boolean;
  codeStatus?: 'Working' | 'Contains Errors' | 'Needs Optimization';
  overallScore: number;
  totalErrors: number;
  totalWarnings: number;
  securityCount: number;
  performanceCount: number;
  summary: string;
  goodPractices: string[];
  optionalImprovements: string[];
  theme: 'dark' | 'light';
}

export const CodeStatusSummary: React.FC<CodeStatusSummaryProps> = ({
  isCodeCorrect,
  codeStatus,
  overallScore,
  totalErrors,
  totalWarnings,
  securityCount,
  performanceCount,
  summary,
  goodPractices = [],
  optionalImprovements = [],
  theme,
}) => {
  const isDark = theme === 'dark';

  const statusType = codeStatus || (isCodeCorrect ? 'Working' : 'Contains Errors');

  const getStatusBadge = () => {
    if (statusType === 'Working' || isCodeCorrect) {
      return {
        label: '✓ Code is working correctly',
        badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80',
        banner: isDark ? 'from-emerald-950/30 to-slate-900 border-emerald-800/40' : 'from-emerald-50 to-white border-emerald-200',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        text: 'text-emerald-400',
      };
    }
    if (statusType === 'Needs Optimization') {
      return {
        label: '⚡ Needs Optimization',
        badge: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
        banner: isDark ? 'from-amber-950/30 to-slate-900 border-amber-800/40' : 'from-amber-50 to-white border-amber-200',
        icon: <Zap className="w-5 h-5 text-amber-400" />,
        text: 'text-amber-400',
      };
    }
    return {
      label: '⚠ Contains Errors',
      badge: 'bg-rose-950/60 text-rose-400 border-rose-800/80',
      banner: isDark ? 'from-rose-950/30 to-slate-900 border-rose-800/40' : 'from-rose-50 to-white border-rose-200',
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      text: 'text-rose-400',
    };
  };

  const statusConfig = getStatusBadge();

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-400';
    if (s >= 65) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-4">
      {/* 1. High-Level Summary Panel Banner */}
      <div
        className={`p-5 rounded-2xl border bg-gradient-to-r ${statusConfig.banner} shadow-sm overflow-hidden`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Status Indicator & Score */}
          <div className="flex items-center gap-4">
            {/* Score Ring / Badge */}
            <div className="relative w-16 h-16 rounded-2xl bg-black/50 border border-slate-700/60 flex flex-col items-center justify-center shrink-0">
              <span className={`text-2xl font-black ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${statusConfig.badge}`}
                >
                  {statusConfig.icon}
                  <span>{statusConfig.label}</span>
                </span>
                {isCodeCorrect && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                    No critical errors detected.
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 font-medium">
                {isCodeCorrect
                  ? 'Code adheres to target runtime syntax, security baselines, and execution expectations.'
                  : 'Actionable faults detected. Review exact line diagnostics and remediations below.'}
              </div>
            </div>
          </div>

          {/* 5-Metric Quick Tiles (Summary Panel Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* Total Errors */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-base font-extrabold text-rose-400">{totalErrors}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Errors</div>
            </div>

            {/* Total Warnings */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-base font-extrabold text-amber-400">{totalWarnings}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Warnings</div>
            </div>

            {/* Security Issues */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-base font-extrabold text-orange-400">{securityCount}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Security</div>
            </div>

            {/* Performance Issues */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-base font-extrabold text-blue-400">{performanceCount}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Performance</div>
            </div>
          </div>
        </div>

        {/* Executive Summary paragraph */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>{summary}</span>
        </div>
      </div>

      {/* 2. When Code is Correct: Dedicated Celebration & Good Practices Banner */}
      {isCodeCorrect && (
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'border-emerald-900/40 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/50'
          } space-y-4`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-emerald-400">
              Clean Execution & Best Practices Verified
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Good Practices Detected */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-900/40 space-y-2">
              <div className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Good Practices Detected</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                {goodPractices.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optional Improvements */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-900/40 space-y-2">
              <div className="font-bold text-blue-400 uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optional Optimization Opportunities</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                {optionalImprovements.map((opt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">→</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
