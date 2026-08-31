import React from 'react';
import { 
  X, 
  Brain, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Calendar 
} from 'lucide-react';

export const AuditDrawer = ({ isOpen, onClose, auditData, isLoading }) => {
  if (!isOpen) return null;

  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const audit = auditData?.data || null;
  const summary = audit?.retry_schedule_summary || {};
  const isRecovered = summary.is_recovered;
  const isHalted = summary.is_halted;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <h2><Clock className="w-5 h-5 text-sky-400" /> Transaction Audit Trail</h2>
            <p>Transaction ID: {auditData?.data?.transaction_id || '...'}</p>
          </div>
          <button onClick={onClose} className="btn-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {isLoading ? (
            <div className="loading-spinner p-8 text-center text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              <p>Fetching step-by-step execution timeline...</p>
            </div>
          ) : !audit ? (
            <p className="text-rose-400 p-4 text-center">Unable to load transaction audit trail</p>
          ) : (
            <>
              {/* Model Decision Box */}
              <div className="summary-box box-model">
                <h4><Brain className="w-4 h-4 text-sky-400 inline mr-2" /> Model Decision & Rationale</h4>
                <p><strong>Predicted Cause:</strong> {formatCategory(audit.recovery_action?.predicted_category)}</p>
                <p><strong>Decided Action:</strong> <code>{audit.recovery_action?.action_taken}</code></p>
                <p className="text-xs text-slate-400 italic mt-1.5">"{audit.recovery_action?.reasoning}"</p>
              </div>

              {/* Execution Summary Card */}
              {isRecovered ? (
                <div className="summary-box box-emerald">
                  <div className="card-header-row">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Revenue Successfully Recovered
                    </span>
                    <span className="badge badge-recovered">RECOVERED</span>
                  </div>
                  <div className="card-grid">
                    <div>
                      <span className="meta-label">Attempts Used</span>
                      <strong>Attempt 2 of 4 (1 Failure + 1 Retry)</strong>
                    </div>
                    <div>
                      <span className="meta-label">Future Retries Needed</span>
                      <strong className="text-emerald-400">0 (Payment Complete)</strong>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="meta-label">Successful Strategy Window</span>
                      <span className="text-xs text-slate-300">{summary.retry_strategy_window || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : isHalted ? (
                <div className="summary-box box-rose">
                  <div className="card-header-row">
                    <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Compliant Restraint Executed
                    </span>
                    <span className="badge badge-halted">HALTED</span>
                  </div>
                  <div className="card-grid">
                    <div>
                      <span className="meta-label">Attempts Used</span>
                      <strong>Attempt 1 of 4 (Halted Instantly)</strong>
                    </div>
                    <div>
                      <span className="meta-label">Retries Allowed</span>
                      <strong className="text-rose-400">0 Retries Allowed</strong>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="meta-label">Restraint Reason</span>
                      <span className="text-xs text-slate-300">{summary.retry_strategy_window || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="summary-box box-sky">
                  <div className="card-header-row">
                    <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> Ongoing Retry Schedule & Limits
                    </span>
                    <span className="badge badge-pending">{summary.retries_remaining} Retries Left</span>
                  </div>
                  <div className="card-grid">
                    <div>
                      <span className="meta-label">Attempts Completed</span>
                      <strong>Attempt {summary.attempts_used || 1} of {summary.max_attempts_allowed || 4}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Retries Allowed</span>
                      <strong className="text-emerald-400">{summary.retries_remaining} Retries Allowed</strong>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="meta-label">Next Retry Scheduled At</span>
                      <strong className="text-sky-400">{summary.next_retry_scheduled_at ? new Date(summary.next_retry_scheduled_at).toLocaleString() : 'N/A'}</strong>
                    </div>
                    <div className="col-span-2 mt-0.5">
                      <span className="meta-label">Strategy Window</span>
                      <span className="text-xs text-slate-300">{summary.retry_strategy_window || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Lifecycle Timeline */}
              <h4 className="timeline-heading"><Calendar className="w-4 h-4 inline mr-2 text-sky-400" /> Step-by-Step Execution Lifecycle</h4>
              <div className="timeline">
                {audit.timeline && audit.timeline.map((step, idx) => (
                  <div key={idx} className={`timeline-step ${step.event === 'RECOVERY_OUTCOME' ? 'completed' : ''}`}>
                    <div className="step-card">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                      <div className="step-meta">
                        <Clock className="w-3 h-3 inline mr-1 opacity-70" />
                        {new Date(step.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
