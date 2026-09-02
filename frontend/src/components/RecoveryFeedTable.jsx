import React, { useState, useMemo } from 'react';
import { 
  ListCheck, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers 
} from 'lucide-react';
import { PaginationBar } from './PaginationBar';

export const RecoveryFeedTable = ({ recoveryActions, onOpenAudit }) => {
  const [activeSubTab, setActiveSubTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate Tab Counts
  const counts = useMemo(() => {
    const total = recoveryActions.length;
    const recovered = recoveryActions.filter(a => a.outcome === 'recovered').length;
    const halted = recoveryActions.filter(a => 
      a.action_taken === 'no_action_respect_revoke' || 
      a.action_taken === 'stop_max_attempts_reached'
    ).length;
    const pending = total - (recovered + halted);
    return { total, pending, recovered, halted };
  }, [recoveryActions]);

  // Apply Sub-Tab and Toolbar Filters
  const filteredActions = useMemo(() => {
    return recoveryActions.filter(item => {
      const txn = item.transactions || {};
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        item.transaction_id.toLowerCase().includes(query) ||
        (txn.customer_id && txn.customer_id.toLowerCase().includes(query));

      const matchesMethod = !filterMethod || (txn.method && txn.method.toLowerCase() === filterMethod);
      const matchesCategory = !filterCategory || item.predicted_category === filterCategory;

      // Status Check (Combining Sub-Tab selection and Dropdown status)
      const targetStatus = activeSubTab || filterStatus;
      let matchesStatus = true;
      const isHalted = item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached';
      const isRecovered = item.outcome === 'recovered';

      if (targetStatus === 'recovered') matchesStatus = isRecovered;
      else if (targetStatus === 'pending') matchesStatus = !isRecovered && !isHalted;
      else if (targetStatus === 'halted') matchesStatus = isHalted;

      return matchesSearch && matchesMethod && matchesCategory && matchesStatus;
    });
  }, [recoveryActions, activeSubTab, searchQuery, filterMethod, filterCategory, filterStatus]);

  // Handle Sub-Tab Switching
  const handleTabSwitch = (tabValue) => {
    setActiveSubTab(tabValue);
    setFilterStatus('');
    setCurrentPage(1);
  };

  // Format Helper
  const formatCategory = (cat) => {
    if (!cat) return 'N/A';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Slice Current Batch
  const paginatedBatch = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, currentPage, pageSize]);

  return (
    <section id="sectionTransactions" className="card margin-top">
      {/* Sub-Tabs Bar for Disentangled Views */}
      <div className="feed-tabs-bar">
        <button 
          onClick={() => handleTabSwitch('')} 
          className={`feed-tab ${activeSubTab === '' ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>All Feed</span>
          <span className="tab-pill">{counts.total.toLocaleString()}</span>
        </button>

        <button 
          onClick={() => handleTabSwitch('pending')} 
          className={`feed-tab ${activeSubTab === 'pending' ? 'active' : ''}`}
        >
          <Clock className="w-4 h-4" />
          <span>Ongoing Retries</span>
          <span className="tab-pill">{counts.pending.toLocaleString()}</span>
        </button>

        <button 
          onClick={() => handleTabSwitch('recovered')} 
          className={`feed-tab ${activeSubTab === 'recovered' ? 'active' : ''}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Successfully Recovered</span>
          <span className="tab-pill">{counts.recovered.toLocaleString()}</span>
        </button>

        <button 
          onClick={() => handleTabSwitch('halted')} 
          className={`feed-tab ${activeSubTab === 'halted' ? 'active' : ''}`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Compliance Restraints</span>
          <span className="tab-pill">{counts.halted.toLocaleString()}</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-toolbar">
        <div className="toolbar-title">
          <h3><ListCheck className="w-5 h-5 text-sky-400 inline mr-2" /> Failed Payment Recovery Feed</h3>
          <p>Real-time list of diagnosed failures, model-decided actions, and execution outcomes</p>
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
            <option value="">All Payment Methods</option>
            <option value="upi">UPI Mandate</option>
            <option value="card">Credit/Debit Card</option>
            <option value="netbanking">Netbanking</option>
          </select>

          <select 
            value={filterCategory} 
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="select-filter"
          >
            <option value="">All Failure Reasons</option>
            <option value="insufficient_funds">Insufficient Funds</option>
            <option value="generic_decline">Generic Decline</option>
            <option value="card_expired">Card Expired</option>
            <option value="card_blocked">Card Blocked</option>
            <option value="mandate_revoked">Mandate Revoked</option>
          </select>

          {!activeSubTab && (
            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="select-filter"
            >
              <option value="">All Outcomes</option>
              <option value="recovered">Recovered</option>
              <option value="pending">Pending Execution</option>
              <option value="halted">Compliance Halt</option>
            </select>
          )}
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
              <th>Model-Decided Action</th>
              <th>Confidence</th>
              <th>Status / Outcome</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBatch.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400">
                  No transactions match current filters
                </td>
              </tr>
            ) : (
              paginatedBatch.map(item => {
                const txn = item.transactions || {};
                const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;

                let statusBadge = <span className="badge badge-pending">ONGOING RETRY</span>;
                if (txn.status === 'captured' || item.outcome === 'captured') {
                  statusBadge = <span className="badge badge-recovered bg-emerald-100 text-emerald-800 border-emerald-300">✓ CAPTURED</span>;
                } else if (item.outcome === 'recovered') {
                  statusBadge = <span className="badge badge-recovered">✓ RECOVERED</span>;
                } else if (item.action_taken === 'prompt_restore_mandate') {
                  statusBadge = <span className="badge badge-halted bg-amber-100 text-amber-800 border-amber-300">MANDATE RESTORAL</span>;
                } else if (item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached') {
                  statusBadge = <span className="badge badge-halted">🛡️ COMPLIANCE STOP</span>;
                } else if (item.outcome === 'not_recovered') {
                  statusBadge = <span className="badge badge-halted">NOT RECOVERED</span>;
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
                      <div className="text-subtle text-xs">Customer: {txn.customer_id || 'N/A'}</div>
                    </td>
                    <td><strong>{amountFormatted}</strong></td>
                    <td><span className="badge-tier">{(txn.method || 'N/A').toUpperCase()}</span></td>
                    <td>{formatCategory(item.predicted_category || txn.error_reason)}</td>
                    <td><span className="action-pill">{item.action_taken}</span></td>
                    <td><strong>{((item.confidence_score || 0) * 100).toFixed(0)}%</strong></td>
                    <td>{statusBadge}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <PaginationBar 
        totalItems={filteredActions.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
      />
    </section>
  );
};
