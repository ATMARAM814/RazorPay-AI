import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Play, 
  Zap, 
  Search, 
  UserCheck, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Clock,
  RotateCcw
} from 'lucide-react';
import { simulateLivePayment } from '../services/api';

export const LiveSimulationPage = ({ onSimulateSuccess }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [stage, setStage] = useState(0);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setStage(1);

    try {
      const res = await simulateLivePayment();
      setSimulationResult(res);

      // Staged sequential reveal pauses
      setTimeout(() => setStage(2), 900);
      setTimeout(() => setStage(3), 1800);
      setTimeout(() => setStage(4), 2700);
      setTimeout(() => {
        setStage(5);
        if (onSimulateSuccess && res.data?.recovery_action) {
          onSimulateSuccess(res.data.recovery_action);
        }
        setIsSimulating(false);
      }, 3600);
    } catch (err) {
      alert('Simulation error: ' + err.message);
      setIsSimulating(false);
      setStage(0);
    }
  };

  const data = simulationResult?.data || null;
  const txn = data?.transaction || null;
  const cust = data?.customer_profile || null;
  const action = data?.recovery_action || null;

  const amountFormatted = txn ? `₹${((txn.amount || 0) / 100).toFixed(2)}` : '';

  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Hero Control Card */}
      <div className="card p-8 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" /> Judge Interactive Live Simulation Sandbox
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Live Payment Recovery Pipeline Test</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Trigger a real-time failed payment simulation for live evaluations. The engine selects an existing customer profile, generates a logically consistent decline, diagnoses the root cause, applies NPCI/RBI compliance rules, and streams the 5-stage reasoning process.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button 
              onClick={handleRunSimulation} 
              disabled={isSimulating}
              className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Running Live Pipeline...' : 'Simulate New Failed Payment'}</span>
            </button>

            {stage > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Pipeline Progress: {stage} of 5 Stages Complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Stage Visualizer View */}
      {stage > 0 && (
        <div className="card p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600" /> Pipeline Execution Stream
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Stage 1 */}
            <div className={`p-4 rounded-lg border transition-all ${stage >= 1 ? 'bg-slate-50 border-slate-200' : 'opacity-20 border-transparent'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-600 fill-current" /> Stage 1: Incoming Payment Failure
                </span>
                {stage >= 1 && <span className="text-xs text-slate-500 font-mono">Just Now</span>}
              </div>
              {txn && (
                <div className="text-xs text-slate-800 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">New payment failed: <strong>{amountFormatted}</strong> via <strong>{(txn.method || '').toUpperCase()}</strong> ({txn.bank_code || 'BANK'})</p>
                  <p className="text-slate-500 font-mono text-2xs">Txn ID: {txn.id}</p>
                </div>
              )}
            </div>

            {/* Stage 2 */}
            <div className={`p-4 rounded-lg border transition-all ${stage >= 2 ? 'bg-slate-50 border-slate-200' : 'opacity-20 border-transparent'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" /> Stage 2: Root-Cause Diagnosis
                </span>
                {stage === 2 && <span className="text-xs text-blue-600 font-medium animate-pulse">Diagnosing...</span>}
                {stage > 2 && <span className="text-xs text-emerald-700 font-semibold">✓ Verified</span>}
              </div>
              {stage >= 2 && txn && (
                <div className="text-xs text-slate-800">
                  <p>Identified Cause: <strong className="text-slate-900">{formatCategory(txn.error_reason)}</strong> <span className="text-slate-500">(Source: {txn.error_source})</span></p>
                </div>
              )}
            </div>

            {/* Stage 3 */}
            <div className={`p-4 rounded-lg border transition-all ${stage >= 3 ? 'bg-slate-50 border-slate-200' : 'opacity-20 border-transparent'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" /> Stage 3: Customer History & Behavior
                </span>
                {stage === 3 && <span className="text-xs text-purple-600 font-medium animate-pulse">Analyzing Profile...</span>}
                {stage > 3 && <span className="text-xs text-emerald-700 font-semibold">✓ Profile Matched</span>}
              </div>
              {stage >= 3 && cust && (
                <div className="text-xs text-slate-800 space-y-1">
                  <p>Customer ID: <strong className="font-mono text-slate-900">{cust.customer_id}</strong></p>
                  <p>Past Pattern: <strong>{cust.total_past_failures}</strong> failures, <strong>{cust.total_past_successes}</strong> successes. Typical payday window around day <strong>{cust.typical_failure_day_of_month}</strong> of month.</p>
                </div>
              )}
            </div>

            {/* Stage 4 */}
            <div className={`p-4 rounded-lg border transition-all ${stage >= 4 ? 'bg-slate-50 border-slate-200' : 'opacity-20 border-transparent'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" /> Stage 4: AI Decision & Strategy Selection
                </span>
                {stage === 4 && <span className="text-xs text-emerald-600 font-medium animate-pulse">Evaluating Strategy...</span>}
                {stage > 4 && <span className="text-xs text-emerald-700 font-semibold">✓ Action Selected</span>}
              </div>
              {stage >= 4 && action && (
                <div className="text-xs text-slate-800 space-y-1">
                  <p>Decided Action: <code className="action-pill text-blue-700 bg-blue-50 border-blue-200">{action.action_taken}</code> (Confidence: <strong>{((action.confidence_score || 0.9) * 100).toFixed(0)}%</strong>)</p>
                  <p className="text-slate-600 italic pt-1">"{action.reasoning}"</p>
                </div>
              )}
            </div>

            {/* Stage 5 */}
            {stage >= 5 && action && (
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-300 text-center space-y-2 animate-scale-up">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Stage 5: Final Pipeline Outcome</span>
                {action.outcome === 'recovered' ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" /> RECOVERED (Transient Retry Succeeded)
                  </div>
                ) : action.action_taken === 'no_action_respect_revoke' || action.action_taken === 'stop_max_attempts_reached' ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-700" /> COMPLIANCE STOP (Restraint Enforced)
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold text-sm">
                    <Clock className="w-4 h-4 text-blue-700" /> ONGOING RETRY SCHEDULED (Link Prompt / Payday Window)
                  </div>
                )}
                <p className="text-xs text-slate-600 pt-1">
                  This transaction has been prepended to your Merchant Feed table in the <strong>{action.outcome === 'recovered' ? 'Successfully Recovered' : (!action.outcome ? 'Ongoing Retries' : 'Compliance Restraints')}</strong> section.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
