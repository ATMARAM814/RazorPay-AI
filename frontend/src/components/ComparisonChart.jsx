import React from 'react';
import { Scale, Lightbulb } from 'lucide-react';

export const ComparisonChart = ({ comparison }) => {
  const our = comparison?.our_system || { recovered: 0, total: 0, recovery_rate_pct: 0 };
  const naive = comparison?.naive_baseline || { recovered: 0, total: 0, recovery_rate_pct: 0 };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Scale className="w-5 h-5 text-sky-400" />
          <h3>Benchmark Recovery Engine A/B Comparison</h3>
        </div>
        <span className="tag-live">Measured Batch Test</span>
      </div>

      <div className="card-body">
        {/* AI System Bar */}
        <div className="bar-group">
          <div className="bar-label-row">
            <span className="bar-name">Razorpay AI Recovery Engine (Our System)</span>
            <span className="bar-rate text-emerald-400">{our.recovery_rate_pct.toFixed(1)}%</span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill fill-emerald" 
              style={{ width: `${Math.min(our.recovery_rate_pct, 100)}%` }}
            ></div>
          </div>
          <span className="bar-meta">{our.recovered.toLocaleString()} of {our.total.toLocaleString()} Payments Recovered</span>
        </div>

        {/* Naive Baseline Bar */}
        <div className="bar-group">
          <div className="bar-label-row">
            <span className="bar-name">Razorpay Naive Blind-Retry Baseline (Current)</span>
            <span className="bar-rate text-slate-400">{naive.recovery_rate_pct.toFixed(1)}%</span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill fill-muted" 
              style={{ width: `${Math.min(naive.recovery_rate_pct, 100)}%` }}
            ></div>
          </div>
          <span className="bar-meta">{naive.recovered.toLocaleString()} of {naive.total.toLocaleString()} Payments Recovered</span>
        </div>

        {/* Strategic Insight Box */}
        <div className="insight-box">
          <Lightbulb className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <p>
            <strong>Strategic Value:</strong> Instead of blind T+1, T+2, T+3 retries across all decline codes, our diagnostic engine targets payday timing for <code>insufficient_funds</code> and halts illegal retries for <code>mandate_revoked</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
