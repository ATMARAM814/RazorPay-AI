import React from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, ShieldCheck } from 'lucide-react';

export const KpiSummaryCards = ({ recoveryActions, comparison }) => {
  const totalAmount = recoveryActions.reduce((sum, item) => sum + (item.transactions?.amount || 0), 0);
  const totalAmountFormatted = `₹${(totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const recoveredActions = recoveryActions.filter(a => a.outcome === 'recovered');
  const recoveredAmount = recoveredActions.reduce((sum, item) => sum + (item.transactions?.amount || 0), 0);
  const recoveredAmountFormatted = `₹${(recoveredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const ourRate = comparison?.our_system?.recovery_rate_pct || 0;
  const naiveRate = comparison?.naive_baseline?.recovery_rate_pct || 0;
  const relativeLift = naiveRate > 0 ? (((ourRate - naiveRate) / naiveRate) * 100).toFixed(1) : '0.0';

  const restraintsCount = recoveryActions.filter(a => 
    a.action_taken === 'no_action_respect_revoke' || 
    a.action_taken === 'stop_max_attempts_reached'
  ).length;

  return (
    <div className="kpi-grid">
      {/* At-Risk Revenue */}
      <div className="kpi-card">
        <div className="kpi-icon icon-blue">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">At-Risk Revenue</span>
          <h3 className="kpi-value">{totalAmountFormatted}</h3>
          <span className="kpi-subtext">{recoveryActions.length.toLocaleString()} Failed Payments</span>
        </div>
      </div>

      {/* Revenue Recovered */}
      <div className="kpi-card highlight-card">
        <div className="kpi-icon icon-emerald">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Revenue Recovered</span>
          <h3 className="kpi-value text-emerald-400">{recoveredAmountFormatted}</h3>
          <span className="kpi-badge badge-emerald">{ourRate.toFixed(1)}% Recovery Rate</span>
        </div>
      </div>

      {/* Relative Lift vs Baseline */}
      <div className="kpi-card">
        <div className="kpi-icon icon-purple">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Relative Lift vs Baseline</span>
          <h3 className="kpi-value text-purple-400">+{relativeLift}%</h3>
          <span className="kpi-subtext">Over Blind Naive Retry</span>
        </div>
      </div>

      {/* Compliant Restraints */}
      <div className="kpi-card">
        <div className="kpi-icon icon-amber">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Compliant Restraints</span>
          <h3 className="kpi-value text-amber-400">{restraintsCount.toLocaleString()}</h3>
          <span className="kpi-subtext">Revoked Mandates & Caps Respected</span>
        </div>
      </div>
    </div>
  );
};
