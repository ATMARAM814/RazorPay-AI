import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Search, 
  UserCheck, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const SimulationModal = ({ isOpen, onClose, simulationResult, onComplete }) => {
  const [stage, setStage] = useState(1);

  useEffect(() => {
    if (!isOpen || !simulationResult) {
      setStage(1);
      return;
    }

    setStage(1);
    // Stage 1 -> Stage 2 (1000ms)
    const t2 = setTimeout(() => setStage(2), 1000);
    // Stage 2 -> Stage 3 (2000ms)
    const t3 = setTimeout(() => setStage(3), 2000);
    // Stage 3 -> Stage 4 (3000ms)
    const t4 = setTimeout(() => setStage(4), 3000);
    // Stage 4 -> Stage 5 (4000ms)
    const t5 = setTimeout(() => {
      setStage(5);
      if (onComplete && simulationResult.data?.recovery_action) {
        onComplete(simulationResult.data.recovery_action);
      }
    }, 4000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen, simulationResult]);

  if (!isOpen || !simulationResult?.data) return null;

  const data = simulationResult.data;
  const txn = data.transaction;
  const cust = data.customer_profile;
  const action = data.recovery_action;
  const details = data.simulation_details;

  const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;

  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="drawer-backdrop flex items-center justify-center p-4">
      <div className="card w-full max-w-xl shadow-2xl animate-fade-in border border-slate-200">
        {/* Header */}
        <div className="card-header bg-slate-50 border-b border-slate-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Live Payment Recovery Simulation</h3>
          </div>
          <button onClick={onClose} className="btn-close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Staged Reveal */}
        <div className="p-6 space-y-4 bg-white">
          {/* Stage 1: Failed Payment Generated */}
          <div className={`p-3.5 rounded-lg border transition-all ${stage >= 1 ? 'bg-slate-50 border-slate-200' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600 fill-current" /> Stage 1: Incoming Payment Failure
              </span>
              {stage >= 1 && <span className="text-xs text-slate-500 font-mono">Just Now</span>}
            </div>
            {stage >= 1 && (
              <div className="mt-2 text-xs text-slate-700 space-y-1 pl-6">
                <p>New payment failed: <strong>{amountFormatted}</strong> via <strong>{(txn.method || '').toUpperCase()}</strong> ({txn.bank_code || 'BANK'})</p>
                <p className="text-slate-500 font-mono text-3xs">Txn ID: {txn.id}</p>
              </div>
            )}
          </div>

          {/* Stage 2: Diagnosing Cause */}
          <div className={`p-3.5 rounded-lg border transition-all ${stage >= 2 ? 'bg-slate-50 border-slate-200' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" /> Stage 2: Root-Cause Diagnosis
              </span>
              {stage === 2 && <span className="text-xs text-blue-600 animate-pulse">Diagnosing...</span>}
              {stage > 2 && <span className="text-xs text-emerald-600">✓ Complete</span>}
            </div>
            {stage >= 2 && (
              <div className="mt-2 text-xs text-slate-700 pl-6">
                <p>Identified Cause: <strong>{formatCategory(txn.error_reason)}</strong> (Source: {txn.error_source})</p>
              </div>
            )}
          </div>

          {/* Stage 3: Checking Customer History */}
          <div className={`p-3.5 rounded-lg border transition-all ${stage >= 3 ? 'bg-slate-50 border-slate-200' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" /> Stage 3: Customer Profile & Behavior Analysis
              </span>
              {stage === 3 && <span className="text-xs text-purple-600 animate-pulse">Analyzing History...</span>}
              {stage > 3 && <span className="text-xs text-emerald-600">✓ Verified</span>}
            </div>
            {stage >= 3 && (
              <div className="mt-2 text-xs text-slate-700 pl-6 space-y-1">
                <p>Customer ID: <strong>{cust.customer_id}</strong></p>
                <p>History: <strong>{cust.total_past_failures}</strong> past failures, <strong>{cust.total_past_successes}</strong> successes. Typical payday window around day <strong>{cust.typical_failure_day_of_month}</strong> of month.</p>
              </div>
            )}
          </div>

          {/* Stage 4: Engine Decision */}
          <div className={`p-3.5 rounded-lg border transition-all ${stage >= 4 ? 'bg-slate-50 border-slate-200' : 'opacity-30 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600" /> Stage 4: AI Decision & Strategy Selection
              </span>
              {stage === 4 && <span className="text-xs text-emerald-600 animate-pulse">Evaluating Strategy...</span>}
              {stage > 4 && <span className="text-xs text-emerald-600">✓ Decided</span>}
            </div>
            {stage >= 4 && (
              <div className="mt-2 text-xs text-slate-700 pl-6 space-y-1">
                <p>Action Decided: <code>{action.action_taken}</code> (Confidence: <strong>{((action.confidence_score || 0.9) * 100).toFixed(0)}%</strong>)</p>
                <p className="text-slate-500 italic">"{action.reasoning}"</p>
              </div>
            )}
          </div>

          {/* Stage 5: Final Outcome Badge */}
          {stage >= 5 && (
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300 text-center space-y-2 animate-scale-up">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Stage 5: Final Simulation Result</span>
              {action.outcome === 'recovered' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> RECOVERED
                </div>
              ) : action.action_taken === 'no_action_respect_revoke' || action.action_taken === 'stop_max_attempts_reached' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-700" /> COMPLIANCE STOP
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-700" /> NOT RECOVERED
                </div>
              )}
              <p className="text-xs text-slate-600 pt-1">
                This live transaction has been prepended to your Merchant Feed table above.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-footer bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button 
            onClick={onClose} 
            disabled={stage < 5}
            className="btn btn-primary text-xs px-5 py-2"
          >
            {stage < 5 ? 'Reasoning in Progress...' : 'Close & View Feed'}
          </button>
        </div>
      </div>
    </div>
  );
};
