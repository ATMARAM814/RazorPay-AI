import React from 'react';
import { Scale } from 'lucide-react';

export const ComparisonChart = ({ comparison }) => {
  const our = comparison?.our_system || { recovered: 0, total: 0, recovery_rate_pct: 0 };
  const naive = comparison?.naive_baseline || { recovered: 0, total: 0, recovery_rate_pct: 0 };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Scale className="w-4 h-4 text-slate-700" />
          <h3>Recovery Engine Comparison</h3>
        </div>
      </div>

      <div className="card-body">
        {/* AI System Bar */}
        <div className="bar-group">
          <div className="bar-label-row">
            <span className="bar-name">Dynamic Retry Engine</span>
            <span className="bar-rate text-emerald-700">{our.recovery_rate_pct.toFixed(1)}%</span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill fill-emerald" 
              style={{ width: `${Math.min(our.recovery_rate_pct, 100)}%` }}
            ></div>
          </div>
          <span className="bar-meta">{our.recovered.toLocaleString()} of {our.total.toLocaleString()} Recovered</span>
        </div>

        {/* Naive Baseline Bar */}
        <div className="bar-group">
          <div className="bar-label-row">
            <span className="bar-name">Standard Fixed Retry Baseline</span>
            <span className="bar-rate text-slate-600">{naive.recovery_rate_pct.toFixed(1)}%</span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill fill-muted" 
              style={{ width: `${Math.min(naive.recovery_rate_pct, 100)}%` }}
            ></div>
          </div>
          <span className="bar-meta">{naive.recovered.toLocaleString()} of {naive.total.toLocaleString()} Recovered</span>
        </div>
      </div>
    </div>
  );
};
