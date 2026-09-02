import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  X,
  Brain,
  Calendar
} from 'lucide-react';
import { PaginationBar } from './PaginationBar';
import { fetchAuditTrail } from '../services/api';

export const AuditLogsPage = ({ recoveryActions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Txn Audit Detail Drawer State
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Handle Opening Detail Drawer
  const handleOpenDetail = async (transactionId) => {
    setSelectedTxnId(transactionId);
    setAuditDetail(null);
    setIsLoadingDetail(true);

    try {
      const res = await fetchAuditTrail(transactionId);
      setAuditDetail(res?.data || null);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Filter List
  const filteredList = useMemo(() => {
    return (recoveryActions || []).filter(item => {
      const txn = item.transactions || {};
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        item.transaction_id.toLowerCase().includes(query) ||
        (txn.customer_id && txn.customer_id.toLowerCase().includes(query));

      const matchesMethod = !filterMethod || (txn.method && txn.method.toLowerCase() === filterMethod);

      const isHalted = item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached';
      const isRecovered = item.outcome === 'recovered';

      let matchesStatus = true;
      if (filterStatus === 'recovered') matchesStatus = isRecovered;
      else if (filterStatus === 'pending') matchesStatus = !isRecovered && !isHalted;
      else if (filterStatus === 'halted') matchesStatus = isHalted;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [recoveryActions, searchQuery, filterMethod, filterStatus]);

  // Paginated Batch
  const paginatedBatch = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Compliance & Audit Trail Logs</h2>
        </div>
        <p className="text-sm text-slate-600">
          Tabular audit logs detailing attempt counts, retries remaining, next retry schedules, and NPCI/RBI compliance enforcements.
        </p>
      </div>

      {/* Main Tabular Audit Logs Card */}
      <div className="card bg-white border border-slate-200 rounded-lg shadow-sm">
        {/* Table Toolbar & Filters */}
        <div className="table-toolbar">
          <div className="toolbar-title">
            <h3>Transaction Audit Log Table</h3>
            <p>Full record of retry attempts used, retries left, and scheduled execution times</p>
          </div>

          <div className="toolbar-filters">
            <div className="search-box">
              <Search className="w-4 h-4 search-icon" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search customer or txn ID..." 
              />
            </div>

            <select 
              value={filterMethod} 
              onChange={(e) => { setFilterMethod(e.target.value); setCurrentPage(1); }}
              className="select-filter"
            >
              <option value="">All Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Netbanking</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="select-filter"
            >
              <option value="">All Audit Outcomes</option>
              <option value="recovered">Recovered</option>
              <option value="pending">Ongoing Retries</option>
              <option value="halted">Compliance Restraints</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID / Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Diagnosed Cause</th>
                <th>Attempts Used</th>
                <th>Retries Remaining</th>
                <th>Next Retry Scheduled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBatch.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    No audit logs match current filters
                  </td>
                </tr>
              ) : (
                paginatedBatch.map(item => {
                  const txn = item.transactions || {};
                  const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;

                  const isRecovered = item.outcome === 'recovered';
                  const isHalted = item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached';

                  // Attempt calculations
                  const maxAttempts = 4; // NPCI Hard Cap
                  const attemptsUsed = isRecovered ? 2 : (txn.attempt_number || 1);
                  const retriesRemaining = (isRecovered || isHalted) ? 0 : Math.max(0, maxAttempts - attemptsUsed);

                  // Next Retry Time Calculation
                  let nextRetryTimeStr = 'N/A';
                  if (!isRecovered && !isHalted && retriesRemaining > 0) {
                    const createdDate = new Date(txn.created_at || Date.now());
                    let delayHours = 24;
                    if (item.action_taken === 'retry_delayed') delayHours = 72;
                    else if (item.action_taken === 'retry_now') delayHours = 2;
                    
                    const nextDate = new Date(createdDate.getTime() + delayHours * 3600 * 1000);
                    nextRetryTimeStr = nextDate.toLocaleString();
                  } else if (isRecovered) {
                    nextRetryTimeStr = 'Completed (Recovered)';
                  } else if (isHalted) {
                    nextRetryTimeStr = 'Halted (Compliance Cap)';
                  }

                  return (
                    <tr key={item.transaction_id || item.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <strong className="font-mono text-slate-900">{item.transaction_id ? item.transaction_id.substring(0, 8) : 'N/A'}...</strong>
                          {(item.is_live_demo || txn.is_live_demo) && (
                            <span className="bg-blue-100 text-blue-700 text-3xs font-bold px-1.5 py-0.5 rounded border border-blue-300">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-subtle text-xs">Cust: {txn.customer_id || 'N/A'}</div>
                      </td>
                      <td><strong>{amountFormatted}</strong></td>
                      <td><span className="badge-tier">{(txn.method || 'N/A').toUpperCase()}</span></td>
                      <td>{formatCategory(item.predicted_category || txn.error_reason)}</td>
                      <td><strong className="text-slate-800">Attempt {attemptsUsed} of {maxAttempts}</strong></td>
                      <td>
                        {retriesRemaining > 0 ? (
                          <span className="text-blue-700 font-semibold">{retriesRemaining} Left</span>
                        ) : (
                          <span className="text-slate-400">0 Left</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-700">
                        {nextRetryTimeStr}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenDetail(item.transaction_id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Trail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <PaginationBar 
          totalItems={filteredList.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
        />
      </div>

      {/* Slide-Over Audit Trail Lifecycle Drawer */}
      {selectedTxnId && (
        <div className="drawer-backdrop" onClick={() => setSelectedTxnId(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2><Clock className="w-5 h-5 text-blue-600" /> Transaction Audit Lifecycle</h2>
                <p>Txn ID: {selectedTxnId}</p>
              </div>
              <button onClick={() => setSelectedTxnId(null)} className="btn-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="drawer-body">
              {isLoadingDetail ? (
                <div className="p-8 text-center text-slate-400">Loading audit steps...</div>
              ) : !auditDetail ? (
                <div className="p-4 text-rose-600 text-center">Unable to load audit trail details</div>
              ) : (
                <div className="space-y-4">
                  {/* Model Decision Box */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-2">
                      <Brain className="w-4 h-4" /> Diagnostic Decision Rationale
                    </h4>
                    <div className="text-xs text-slate-800 space-y-1">
                      <p><strong>Predicted Cause:</strong> {formatCategory(auditDetail.recovery_action?.predicted_category)}</p>
                      <p><strong>Decided Action:</strong> <code className="action-pill text-blue-700 bg-blue-50 border-blue-200">{auditDetail.recovery_action?.action_taken}</code></p>
                      <p className="text-slate-600 italic pt-1">"{auditDetail.recovery_action?.reasoning}"</p>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-2">
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <span>Execution Strategy Window</span>
                      <span>{auditDetail.retry_schedule_summary?.retries_remaining} Retries Left</span>
                    </div>
                    <p className="text-slate-700">{auditDetail.retry_schedule_summary?.retry_strategy_window}</p>
                  </div>

                  {/* Step-by-step Timeline */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Execution Lifecycle Timeline
                    </h4>
                    <div className="timeline">
                      {auditDetail.timeline && auditDetail.timeline.map((step, idx) => (
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
      )}
    </div>
  );
};
