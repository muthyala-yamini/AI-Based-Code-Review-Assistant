import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js/auto';
import { Gauge, Clock, Zap, Cpu, BarChart3, PieChart, Layers, ArrowUpRight } from 'lucide-react';

Chart.register(...registerables);

export interface AgentLatencies {
  code_analyzer_ms: number;
  security_agent_ms: number;
  quality_agent_ms: number;
  rag_agent_ms: number;
  review_orchestrator_ms: number;
  total_ms: number;
}

interface LatencyDashboardProps {
  latencies?: AgentLatencies;
  isAnalyzing: boolean;
  theme?: 'dark' | 'light';
}

export const LatencyDashboard: React.FC<LatencyDashboardProps> = ({
  latencies,
  isAnalyzing,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'doughnut'>('bar');

  // Fallback defaults if no review completed yet
  const defaultLatencies: AgentLatencies = {
    code_analyzer_ms: 175,
    security_agent_ms: 235,
    quality_agent_ms: 200,
    rag_agent_ms: 68,
    review_orchestrator_ms: 640,
    total_ms: 1318,
  };

  const currentLatencies = latencies || defaultLatencies;

  const agentLabels = [
    'Code Analyzer',
    'Security Agent',
    'Quality & Perf',
    'RAG Vector Search',
    'Review Orchestrator',
  ];

  const agentData = [
    currentLatencies.code_analyzer_ms,
    currentLatencies.security_agent_ms,
    currentLatencies.quality_agent_ms,
    currentLatencies.rag_agent_ms,
    currentLatencies.review_orchestrator_ms,
  ];

  // Identify fastest and heaviest agents
  const minLatency = Math.min(...agentData);
  const maxLatency = Math.max(...agentData);
  const fastestIdx = agentData.indexOf(minLatency);
  const heaviestIdx = agentData.indexOf(maxLatency);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy prior chart instance before re-creating
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    const barColors = [
      'rgba(59, 130, 246, 0.85)',   // Blue - Code Analyzer
      'rgba(249, 115, 22, 0.85)',  // Orange - Security Agent
      'rgba(16, 185, 129, 0.85)',  // Emerald - Quality & Perf
      'rgba(14, 165, 233, 0.85)',  // Cyan - RAG Agent
      'rgba(168, 85, 247, 0.85)',  // Purple - Review Orchestrator
    ];

    const borderColors = [
      '#3b82f6',
      '#f97316',
      '#10b981',
      '#0ea5e9',
      '#a855f7',
    ];

    if (chartType === 'bar') {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: agentLabels,
          datasets: [
            {
              label: 'Execution Latency (ms)',
              data: agentData,
              backgroundColor: barColors,
              borderColor: borderColors,
              borderWidth: 1.5,
              borderRadius: 6,
              maxBarThickness: 32,
            },
          ],
        },
        options: {
          indexAxis: 'y', // Horizontal bars for clear agent comparison
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 750,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: (context) => ` Latency: ${context.parsed.x} ms`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { family: 'JetBrains Mono', size: 11 },
                callback: (val) => `${val} ms`,
              },
              title: {
                display: true,
                text: 'Response Duration (milliseconds)',
                color: textColor,
                font: { size: 11 },
              },
            },
            y: {
              grid: { display: false },
              ticks: {
                color: isDark ? '#e2e8f0' : '#1e293b',
                font: { weight: 'bold', size: 11 },
              },
            },
          },
        },
      });
    } else {
      // Doughnut distribution mode
      chartInstanceRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: agentLabels,
          datasets: [
            {
              data: agentData,
              backgroundColor: barColors,
              borderColor: isDark ? '#0f172a' : '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800,
            animateRotate: true,
          },
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: isDark ? '#cbd5e1' : '#334155',
                font: { size: 11 },
                padding: 12,
              },
            },
            tooltip: {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (context) => {
                  const val = Number(context.raw);
                  const total = currentLatencies.total_ms || 1;
                  const pct = Math.round((val / total) * 100);
                  return ` ${context.label}: ${val} ms (${pct}%)`;
                },
              },
            },
          },
          cutout: '65%',
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [latencies, chartType, theme]);

  return (
    <div
      className={`rounded-2xl border ${
        theme === 'dark' ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-200 bg-white'
      } p-5 shadow-sm space-y-5`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Latency & Performance Telemetry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400">
                Chart.js Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-resolution execution duration per autonomous agent in the LangGraph pipeline
            </p>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Horizontal Bars</span>
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
              chartType === 'doughnut'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Distribution</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Pipeline Latency */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              Total Latency
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {currentLatencies.total_ms < 2000 ? '⚡ Ultra-Fast' : 'Normal'}
            </span>
          </div>
          <div className="text-xl font-extrabold text-blue-400 font-mono">
            {isAnalyzing ? (
              <span className="animate-pulse">Measuring...</span>
            ) : (
              `${(currentLatencies.total_ms / 1000).toFixed(2)}s`
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {currentLatencies.total_ms} ms total round-trip
          </div>
        </div>

        {/* Fastest Agent */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              Fastest Agent
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Vector Search</span>
          </div>
          <div className="text-base font-bold text-slate-200 truncate">
            {agentLabels[fastestIdx]}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            {minLatency} ms
          </div>
        </div>

        {/* Most Intensive Step */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-400" />
              Heaviest Step
            </span>
            <span className="text-[10px] font-mono text-purple-400">LLM Reasoning</span>
          </div>
          <div className="text-base font-bold text-slate-200 truncate">
            {agentLabels[heaviestIdx]}
          </div>
          <div className="text-[11px] font-mono text-purple-400 mt-0.5">
            {maxLatency} ms
          </div>
        </div>

        {/* Pipeline Architecture */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Architecture
            </span>
            <span className="text-[10px] font-mono text-amber-400">StateGraph</span>
          </div>
          <div className="text-base font-bold text-slate-200">
            5 Orchestrated Nodes
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Sequential State Handoff
          </div>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full h-64 sm:h-72 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <canvas ref={canvasRef} />
      </div>

      {/* Latency breakdown table */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {agentLabels.map((label, idx) => (
          <div
            key={label}
            className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 flex flex-col justify-between"
          >
            <div className="text-slate-400 truncate text-[11px]">{label}</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-1">
              {agentData[idx]} <span className="text-[10px] text-slate-500">ms</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((agentData[idx] / (currentLatencies.total_ms || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
