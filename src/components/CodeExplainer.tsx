import React from 'react';
import {
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Code,
  Terminal,
  Layers,
  Sparkles,
  HelpCircle,
  Cpu
} from 'lucide-react';

export interface CodeExplanationData {
  summary: string;
  purpose: string;
  step_by_step_flow: string[];
  important_functions: { name: string; purpose: string }[];
  important_variables: { name: string; purpose: string }[];
  input_processing: string;
  output_generation: string;
  key_logic: string[];
  dependencies: string[];
}

interface CodeExplainerProps {
  explanation?: CodeExplanationData;
  language: string;
  theme: 'dark' | 'light';
}

export const CodeExplainer: React.FC<CodeExplainerProps> = ({
  explanation,
  language,
  theme,
}) => {
  if (!explanation) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'
      } shadow-sm overflow-hidden space-y-6 p-5 sm:p-6 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>How This Code Works</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                Beginner-Friendly AI Analysis
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive walkthrough of program purpose, execution flow, inputs, outputs, and logic.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>{language}</span>
        </span>
      </div>

      {/* 1. What the code does & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5" />
            <span>What the Code Does</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.summary || 'Analyzes and manipulates input parameters to execute specified instructions.'}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Purpose & Use Case</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.purpose || 'Serves as functional software component for data processing.'}
          </p>
        </div>
      </div>

      {/* 2. Step-by-Step Code Flow */}
      <div>
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Step-by-Step Execution Flow</span>
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {(explanation.step_by_step_flow || []).map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-3 text-xs">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-400">
                {idx + 1}
              </div>
              <div
                className={`flex-1 p-2.5 rounded-lg border text-xs leading-relaxed ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/50 text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {step.replace(/^\d+\.\s*/, '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Functions & Variables Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Important Functions */}
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Important Functions</span>
          </div>

          {(explanation.important_functions || []).length > 0 ? (
            <div className="space-y-2">
              {explanation.important_functions.map((fn, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 text-xs"
                >
                  <div className="font-mono font-bold text-purple-400 text-[11px] mb-0.5">
                    {fn.name}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {fn.purpose}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No custom user functions defined.</p>
          )}
        </div>

        {/* Important Variables */}
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>Important Variables</span>
          </div>

          {(explanation.important_variables || []).length > 0 ? (
            <div className="space-y-2">
              {explanation.important_variables.map((v, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 text-xs"
                >
                  <div className="font-mono font-bold text-emerald-400 text-[11px] mb-0.5">
                    {v.name}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {v.purpose}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No significant variables identified.</p>
          )}
        </div>
      </div>

      {/* 4. Inputs, Outputs, Logic & Dependencies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Input Processing */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30">
          <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            <span>Input Processing</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {explanation.input_processing || 'Receives runtime parameters and command arguments.'}
          </p>
        </div>

        {/* Output Generation */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30">
          <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Output Generation</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {explanation.output_generation || 'Produces processed data values or status responses.'}
          </p>
        </div>

        {/* Key Logic */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30">
          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>Key Logic & Patterns</span>
          </div>
          <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
            {(explanation.key_logic || ['Standard control flow and execution']).map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>

        {/* Dependencies */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30">
          <div className="font-bold text-purple-400 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Dependencies Used</span>
          </div>
          {(explanation.dependencies || []).length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {explanation.dependencies.map((dep, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                >
                  {dep}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-[11px]">Standard runtime environment without external libraries.</p>
          )}
        </div>
      </div>
    </div>
  );
};
