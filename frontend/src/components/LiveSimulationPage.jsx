import React, { useState } from 'react';
import { 
  Play, 
  Zap, 
  Search, 
  UserCheck, 
  Brain, 
  CheckCircle2, 
  ShieldAlert, 
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight
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
      {/* Interactive Hero Banner */}
      <div className="card p-8 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Interactive Live Recovery Pipeline Sandbox
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trigger a real-time failed payment simulation for live evaluations. The engine selects an existing customer profile, diagnoses the root cause, applies NPCI/RBI compliance rules, and streams the 5-stage reasoning process step-by-step.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <button 
              onClick={handleRunSimulation} 
              disabled={isSimulating}
              className="btn btn-primary px-6 py-3 text-xs font-bold rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
            >
              <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Executing Pipeline...' : 'Trigger Live Payment Simulation'}</span>
            </button>

            {stage > 0 ? (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Pipeline Status: Stage {stage} of 5 Active
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Click button to start real-time evaluation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty State Prompt Before Running */}
      {stage === 0 && (
        <div className="card p-12 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ready for Live Pipeline Test</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Trigger Live Payment Simulation"</strong> above to launch a real-time failed subscription payment and watch the AI engine execute diagnosis and recovery.
          </p>
        </div>
      )}

      {/* Pipeline Stage Visualizer View */}
      {stage > 0 && (
        <div className="card p-6 bg-white border border-slate-200/80 rounded-xl shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <RotateCcw className="w-4.5 h-4.5 text-blue-600" /> Pipeline Execution Stream
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              Live Pipeline Feed
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Stage 1 */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${stage >= 1 ? 'bg-slate-50/80 border-slate-200 shadow-2xs' : 'opacity-30 border-slate-100'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-600 fill-current" /> Stage 1: Incoming Payment Failure Event
                </span>
                {stage >= 1 && <span className="text-2xs text-slate-500 font-mono bg-slate-200/60 px-2 py-0.5 rounded">Event Logged</span>}
              </div>
              {txn && (
                <div className="text-xs text-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Failed Amount</span>
                    <strong className="text-slate-900 text-sm font-bold">{amountFormatted}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Payment Method</span>
                    <span className="badge-tier uppercase">{txn.method || 'N/A'} ({txn.bank_code || 'BANK'})</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Transaction ID</span>
                    <span className="font-mono text-slate-700 text-2xs">{txn.id}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stage 2 */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${stage >= 2 ? 'bg-slate-50/80 border-slate-200 shadow-2xs' : 'opacity-30 border-slate-100'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" /> Stage 2: Root-Cause Diagnosis
                </span>
                {stage === 2 && <span className="text-xs text-blue-600 font-semibold animate-pulse">Diagnosing Reason...</span>}
                {stage > 2 && <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Cause Identified</span>}
              </div>
              {stage >= 2 && txn && (
                <div className="text-xs text-slate-800 flex items-center gap-4">
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Diagnosed Reason</span>
                    <strong className="text-slate-900 font-bold text-xs">{formatCategory(txn.error_reason)}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Error Source</span>
                    <span className="text-slate-700 font-semibold capitalize">{txn.error_source}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stage 3 */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${stage >= 3 ? 'bg-slate-50/80 border-slate-200 shadow-2xs' : 'opacity-30 border-slate-100'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" /> Stage 3: Customer History & Behavioral Relevance
                </span>
                {stage === 3 && <span className="text-xs text-purple-600 font-semibold animate-pulse">Analyzing Behavioral Profile...</span>}
                {stage > 3 && <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Behavioral Relevance Checked</span>}
              </div>
              {stage >= 3 && cust && (
                <div className="text-xs text-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Customer ID</span>
                    <strong className="font-mono text-slate-900">{cust.customer_id}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Historical Payment Track</span>
                    <span><strong>{cust.total_past_failures}</strong> failures / <strong>{cust.total_past_successes}</strong> successes</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block uppercase font-medium">Payday / Salary Window Relevance</span>
                    {txn?.error_reason === 'insufficient_funds' ? (
                      <span className="text-blue-700 font-semibold">
                        Around Day <strong>{cust.typical_failure_day_of_month}</strong> of month <span className="text-2xs text-slate-500 font-normal">(Active for Salary Retry)</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium italic">
                        N/A ({txn?.error_reason === 'card_expired' ? 'Card Expired' : txn?.error_reason === 'card_blocked' ? 'Card Blocked' : txn?.error_reason === 'mandate_revoked' ? 'Mandate Revoked' : 'Transient Network Error'})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stage 4 */}
            <div className={`p-5 rounded-xl border transition-all duration-300 ${stage >= 4 ? 'bg-slate-50/80 border-slate-200 shadow-2xs' : 'opacity-30 border-slate-100'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" /> Stage 4: AI Decision & Compliance Strategy
                </span>
                {stage === 4 && <span className="text-xs text-emerald-600 font-semibold animate-pulse">Evaluating Strategy...</span>}
                {stage > 4 && <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Action Selected</span>}
              </div>
              {stage >= 4 && action && (
                <div className="text-xs text-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xs text-slate-400 uppercase font-medium">Decided Action:</span>
                    <code className="action-pill text-blue-700 bg-blue-50 border-blue-200 font-bold">{action.action_taken}</code>
                    <span className="text-xs text-slate-500 font-medium">(Confidence Score: <strong>{((action.confidence_score || 0.9) * 100).toFixed(0)}%</strong>)</span>
                  </div>
                  <p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                    "{action.reasoning}"
                  </p>
                </div>
              )}
            </div>

            {/* Stage 5 */}
            {stage >= 5 && action && (
              <div className="p-6 rounded-xl bg-slate-900 text-white shadow-md space-y-3 animate-scale-up">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Stage 5: Final Execution Outcome</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" /> Synchronized to Merchant Feed
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {action.outcome === 'recovered' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> RECOVERED (Transient Retry Succeeded)
                    </div>
                  ) : action.action_taken === 'retry_delayed' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-xs">
                      <Clock className="w-4 h-4 text-blue-400" /> ONGOING RETRY SCHEDULED (Payday Salary Window Retry)
                    </div>
                  ) : action.action_taken === 'prompt_update_card' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-xs">
                      <Clock className="w-4 h-4 text-blue-400" /> ONGOING RETRY SCHEDULED (84h Card Update Auto-Retry)
                    </div>
                  ) : action.action_taken === 'prompt_update_payment_method' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-xs">
                      <Clock className="w-4 h-4 text-blue-400" /> ONGOING RETRY SCHEDULED (84h Method Switch Auto-Retry)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-xs">
                      <Clock className="w-4 h-4 text-blue-400" /> ONGOING RETRY SCHEDULED (2h Infrastructure Retry)
                    </div>
                  )}

                  <p className="text-xs text-slate-300">
                    This transaction has been prepended to your Merchant Feed in the <strong>{action.outcome === 'recovered' ? 'Successfully Recovered' : (!action.outcome ? 'Ongoing Retries' : 'Compliance Restraints')}</strong> tab.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

