import React from 'react';
import { Layers } from 'lucide-react';

export const CategoryBreakdown = ({ breakdown }) => {
  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Layers className="w-5 h-5 text-sky-400" />
          <h3>Recovery Rate by Diagnosed Cause</h3>
        </div>
      </div>

      <div className="breakdown-list">
        {!breakdown || breakdown.length === 0 ? (
          <p className="text-muted p-4 text-center">No category data available</p>
        ) : (
          breakdown.map((item, idx) => (
            <div key={idx} className="breakdown-item">
              <div className="breakdown-info">
                <h5>{formatCategory(item.predicted_category)}</h5>
                <p>Action: <code>{item.action_taken}</code> ({item.recovered}/{item.total} recovered)</p>
              </div>
              <div className={`breakdown-rate ${item.recovery_rate_pct > 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {item.recovery_rate_pct.toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
