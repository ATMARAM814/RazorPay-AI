import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { simulateLivePayment } from '../services/api';

export const LiveSimulationPage = ({ onSimulateSuccess }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedBatch, setSimulatedBatch] = useState([]);
  const [streamCount, setStreamCount] = useState(0);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulatedBatch([]);
    setStreamCount(0);

    try {
      const res = await simulateLivePayment();
      const items = res?.data || [];
      setSimulatedBatch(items);

      // Immediately pass all 10 items to parent state so main Merchant Feed updates in lockstep
      if (onSimulateSuccess) {
        onSimulateSuccess(items);
      }

      // Stream visual reveal staggered by 300ms each
      for (let i = 1; i <= items.length; i++) {
        setTimeout(() => {
          setStreamCount(i);
          if (i === items.length) {
            setIsSimulating(false);
          }
        }, i * 300);
      }
    } catch (err) {
      alert('Simulation error: ' + err.message);
      setIsSimulating(false);
    }
  };

  const visibleItems = simulatedBatch.slice(0, streamCount);

  const formatCategory = (cat) => {
    if (!cat || cat === 'none') return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Interactive Hero Banner */}
      <div className="card p-8 bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Live Payment Stream Simulation (10 Txns / Batch)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trigger a real-time batch evaluation. Generates 10 transactions (6-7 failed, 3-4 captured), applies strict payment method consistency, executes AI diagnostic reasoning, and streams the live feed in real-time.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            <button 
              onClick={handleRunSimulation} 
              disabled={isSimulating}
              className="btn btn-primary px-6 py-3 text-xs font-bold rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
            >
              <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? `Streaming Live Batch (${streamCount}/10)...` : 'Simulate 10 Payments Batch'}</span>
            </button>

            {simulatedBatch.length > 0 && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Stream Progress: {streamCount} of 10 Streamed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty State Prompt */}
      {simulatedBatch.length === 0 && !isSimulating && (
        <div className="card p-12 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ready for Live Batch Simulation</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click <strong>"Simulate 10 Payments Batch"</strong> above to generate 10 transactions in real-time (6-7 failed, 3-4 captured) and watch them stream live into your Merchant Feed.
          </p>
        </div>
      )}

      {/* Real-time Streaming Feed */}
      {visibleItems.length > 0 && (
        <div className="card p-6 bg-white border border-slate-200/80 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" /> Live Transaction Stream Feed
            </h3>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {isSimulating ? 'Streaming Live Transactions...' : 'Batch Completed'}
            </span>
          </div>

          <div className="space-y-3">
            {visibleItems.map((item, idx) => {
              const txn = item.transactions || {};
              const isCaptured = txn.status === 'captured' || item.outcome === 'captured';
              const isRecovered = item.outcome === 'recovered';
              const isHalted = item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached';
              const isRestoral = item.action_taken === 'prompt_restore_mandate';

              const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;

              return (
                <div key={item.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all shadow-2xs space-y-2 animate-scale-up">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">{item.transaction_id ? item.transaction_id.substring(0, 8) : 'Txn'}...</span>
                      <span className="badge-tier uppercase">{txn.method || 'N/A'}</span>
                      <strong className="text-slate-900 text-xs">{amountFormatted}</strong>
                    </div>

                    <div>
                      {isCaptured ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-2xs uppercase">
                          ✓ CAPTURED
                        </span>
                      ) : isRecovered ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-2xs uppercase">
                          ✓ RECOVERED
                        </span>
                      ) : isRestoral ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-bold text-2xs uppercase">
                          MANDATE RESTORAL SENT
                        </span>
                      ) : isHalted ? (
                        <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold text-2xs uppercase">
                          🛡️ COMPLIANCE STOP
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-bold text-2xs uppercase">
                          ONGOING RETRY
                        </span>
                      )}
                    </div>
                  </div>

                  {!isCaptured ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <p>
                        <strong>Diagnosed Cause:</strong> {formatCategory(item.predicted_category || txn.error_reason)} &nbsp;|&nbsp; 
                        <strong> Action:</strong> <code className="action-pill text-blue-700 bg-blue-50 border-blue-200 font-bold">{item.action_taken}</code>
                      </p>
                      <p className="text-slate-600 italic">"{item.reasoning}"</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Payment captured successfully on initial attempt. No recovery action needed.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
