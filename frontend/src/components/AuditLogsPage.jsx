import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Search, 
  Clock, 
  Brain, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Calendar,
  ChevronRight,
  FileText
} from 'lucide-react';
import { fetchAuditTrail } from '../services/api';

export const AuditLogsPage = ({ recoveryActions }) => {
  const [selectedTxnId, setSelectedTxnId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditData, setAuditData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Default to first transaction if available
  useEffect(() => {
    if (recoveryActions && recoveryActions.length > 0 && !selectedTxnId) {
      setSelectedTxnId(recoveryActions[0].transaction_id);
    }
  }, [recoveryActions]);

  // Fetch Audit Trail when selectedTxnId changes
  useEffect(() => {
    if (!selectedTxnId) return;
    const loadAudit = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAuditTrail(selectedTxnId);
        setAuditData(res?.data || null);
      } catch (err) {
        console.error('Error fetching audit trail:', err);
        setAuditData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadAudit();
  }, [selectedTxnId]);

  // Filter list of transactions for sidebar list
  const filteredList = (recoveryActions || []).filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const txn = item.transactions || {};
    return (
      item.transaction_id.toLowerCase().includes(q) ||
      (txn.customer_id && txn.customer_id.toLowerCase().includes(q)) ||
      item.predicted_category.toLowerCase().includes(q)
    );
  });

  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const summary = auditData?.retry_schedule_summary || {};
  const isRecovered = summary.is_recovered;
  const isHalted = summary.is_halted;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Compliance & Audit Trail Logs</h2>
        </div>
        <p className="text-sm text-slate-600">
          Inspect full step-by-step transaction execution timelines, model diagnostic rationales, and NPCI/RBI compliance rule enforcements.
        </p>
      </div>

      {/* Main 2-Column Audit Explorer */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Transaction Selector List (4 cols) */}
        <div className="col-span-4 card bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-200">
            <div className="search-box w-full">
              <Search className="w-4 h-4 search-icon text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Txn ID or Customer..." 
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No transactions found</p>
            ) : (
              filteredList.map(item => {
                const txn = item.transactions || {};
                const isSelected = item.transaction_id === selectedTxnId;
                const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;

                return (
                  <div 
                    key={item.transaction_id}
                    onClick={() => setSelectedTxnId(item.transaction_id)}
                    className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-xs text-slate-900">{item.transaction_id.substring(0, 8)}...</strong>
                        {item.is_live_demo && (
                          <span className="bg-blue-100 text-blue-700 text-3xs font-bold px-1.5 py-0.5 rounded">LIVE</span>
                        )}
                      </div>
                      <div className="text-2xs text-slate-500">
                        {amountFormatted} • {formatCategory(item.predicted_category)}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Timeline Viewer (8 cols) */}
        <div className="col-span-8 card bg-white border border-slate-200 rounded-lg shadow-sm p-6 overflow-y-auto h-[700px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <RotateCcw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading step-by-step transaction audit trail...</p>
            </div>
          ) : !auditData ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Select a transaction from the list on the left to inspect its audit logs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="pb-4 border-b border-slate-200">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wide">Transaction Audit Log</span>
                <h3 className="text-lg font-bold text-slate-900 font-mono mt-1">{auditData.transaction_id}</h3>
                <p className="text-xs text-slate-600 mt-1">Customer ID: <strong className="font-mono">{auditData.customer_id}</strong></p>
              </div>

              {/* Model Decision Box */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                  <Brain className="w-4 h-4" /> AI Model Diagnostic Rationale
                </h4>
                <div className="text-xs text-slate-800 space-y-1">
                  <p><strong>Predicted Cause:</strong> {formatCategory(auditData.recovery_action?.predicted_category)}</p>
                  <p><strong>Action Decided:</strong> <code className="action-pill text-blue-700 bg-blue-50 border-blue-200">{auditData.recovery_action?.action_taken}</code></p>
                  <p className="text-slate-600 italic pt-1">"{auditData.recovery_action?.reasoning}"</p>
                </div>
              </div>

              {/* Retry Schedule / Compliance Summary */}
              {isRecovered ? (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Revenue Successfully Recovered
                    </span>
                    <span className="badge badge-recovered">RECOVERED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 pt-1">
                    <div>
                      <span className="text-2xs text-slate-500 block">Attempts Used</span>
                      <strong>Attempt {summary.attempts_used} of {summary.max_attempts_allowed}</strong>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Future Retries Needed</span>
                      <strong className="text-emerald-700">0 (Payment Complete)</strong>
                    </div>
                  </div>
                </div>
              ) : isHalted ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" /> Compliance Restraint Enforced
                    </span>
                    <span className="badge badge-halted">HALTED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 pt-1">
                    <div>
                      <span className="text-2xs text-slate-500 block">Attempts Used</span>
                      <strong>Attempt {summary.attempts_used} of {summary.max_attempts_allowed}</strong>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Retries Allowed</span>
                      <strong className="text-amber-800">0 Retries (Halted)</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-800 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Ongoing Retry Schedule
                    </span>
                    <span className="badge badge-pending">{summary.retries_remaining} Retries Left</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 pt-1">
                    <div>
                      <span className="text-2xs text-slate-500 block">Attempts Completed</span>
                      <strong>Attempt {summary.attempts_used || 1} of {summary.max_attempts_allowed || 4}</strong>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-500 block">Next Retry Scheduled</span>
                      <strong className="text-blue-700">{summary.next_retry_scheduled_at ? new Date(summary.next_retry_scheduled_at).toLocaleString() : 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Lifecycle Timeline */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Step-by-Step Execution Lifecycle
                </h4>

                <div className="timeline">
                  {auditData.timeline && auditData.timeline.map((step, idx) => (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
