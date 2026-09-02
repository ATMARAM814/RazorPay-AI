import React from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

export const KpiSummaryCards = ({ recoveryActions, comparison }) => {
  const validActions = Array.isArray(recoveryActions) ? recoveryActions.flat() : [];
  const totalAmount = validActions.reduce((sum, item) => sum + (item?.transactions?.amount || 0), 0);
  const totalAmountFormatted = `₹${(totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const recoveredActions = validActions.filter(a => a && (a.outcome === 'recovered' || a.outcome === 'captured'));
  const recoveredAmount = recoveredActions.reduce((sum, item) => sum + (item?.transactions?.amount || 0), 0);
  const recoveredAmountFormatted = `₹${(recoveredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const ourRate = comparison?.our_system?.recovery_rate_pct || 0;
  const naiveRate = comparison?.naive_baseline?.recovery_rate_pct || 0;
  const relativeLift = naiveRate > 0 ? (((ourRate - naiveRate) / naiveRate) * 100).toFixed(1) : '0.0';

  const restraintsCount = validActions.filter(a => 
    a && (a.action_taken === 'no_action_respect_revoke' || a.action_taken === 'stop_max_attempts_reached')
  ).length;

  return (
    <div className="kpi-grid">
      {/* At-Risk Revenue */}
      <div className="kpi-card">
        <div className="kpi-icon icon-slate">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Failed Revenue</span>
          <h3 className="kpi-value">{totalAmountFormatted}</h3>
          <span className="kpi-subtext">{recoveryActions.length.toLocaleString()} Transactions</span>
        </div>
      </div>

      {/* Revenue Recovered */}
      <div className="kpi-card">
        <div className="kpi-icon icon-emerald">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Recovered Revenue</span>
          <h3 className="kpi-value text-emerald-700">{recoveredAmountFormatted}</h3>
          <span className="kpi-subtext">{ourRate.toFixed(1)}% Recovery Rate</span>
        </div>
      </div>

      {/* Relative Lift vs Baseline */}
      <div className="kpi-card">
        <div className="kpi-icon icon-blue">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Recovery Lift</span>
          <h3 className="kpi-value text-blue-700">+{relativeLift}%</h3>
          <span className="kpi-subtext">vs Baseline Retry</span>
        </div>
      </div>

      {/* Compliant Restraints */}
      <div className="kpi-card">
        <div className="kpi-icon icon-slate">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Compliant Restraints</span>
          <h3 className="kpi-value">{restraintsCount.toLocaleString()}</h3>
          <span className="kpi-subtext">Halted Attempts</span>
        </div>
      </div>
    </div>
  );
};
