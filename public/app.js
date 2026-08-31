// State Store
let state = {
  transactions: [],
  recoveryActions: [],
  comparison: null,
  breakdown: [],
  filteredActions: [],
  
  // Pagination State
  currentPage: 1,
  pageSize: 10
};

// DOM Elements
const kpiTotalAtRisk = document.getElementById('kpiTotalAtRisk');
const kpiTotalCount = document.getElementById('kpiTotalCount');
const kpiRecoveredAmount = document.getElementById('kpiRecoveredAmount');
const kpiRecoveryRate = document.getElementById('kpiRecoveryRate');
const kpiRelativeLift = document.getElementById('kpiRelativeLift');
const kpiCompliantRestraints = document.getElementById('kpiCompliantRestraints');

const ourSystemRateText = document.getElementById('ourSystemRateText');
const ourSystemBar = document.getElementById('ourSystemBar');
const ourSystemMeta = document.getElementById('ourSystemMeta');
const naiveRateText = document.getElementById('naiveRateText');
const naiveBar = document.getElementById('naiveBar');
const naiveMeta = document.getElementById('naiveMeta');

const breakdownList = document.getElementById('breakdownList');
const tableBody = document.getElementById('tableBody');

const inputSearch = document.getElementById('inputSearch');
const filterMethod = document.getElementById('filterMethod');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');

const btnExecuteDue = document.getElementById('btnExecuteDue');
const btnRefresh = document.getElementById('btnRefresh');

const auditDrawer = document.getElementById('auditDrawer');
const btnCloseDrawer = document.getElementById('btnCloseDrawer');
const drawerSubTitle = document.getElementById('drawerSubTitle');
const drawerContent = document.getElementById('drawerContent');

// Pagination DOM Elements
const paginationRange = document.getElementById('paginationRange');
const selectPageSize = document.getElementById('selectPageSize');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const pageNumbers = document.getElementById('pageNumbers');

// Navigation DOM Elements
const navOverview = document.getElementById('navOverview');
const navTransactions = document.getElementById('navTransactions');
const navAudit = document.getElementById('navAudit');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();

  // Toolbar Actions
  btnRefresh.addEventListener('click', handleRefresh);
  btnExecuteDue.addEventListener('click', handleExecuteDue);
  
  // Filter Event Listeners (reset to Page 1)
  inputSearch.addEventListener('input', () => { state.currentPage = 1; applyFilters(); });
  filterMethod.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
  filterCategory.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });
  if (filterStatus) filterStatus.addEventListener('change', () => { state.currentPage = 1; applyFilters(); });

  // Pagination Event Listeners
  selectPageSize.addEventListener('change', (e) => {
    state.pageSize = parseInt(e.target.value, 10);
    state.currentPage = 1;
    renderTableAndPagination();
  });

  btnPrevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      renderTableAndPagination();
    }
  });

  btnNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredActions.length / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage += 1;
      renderTableAndPagination();
    }
  });

  // Sidebar Navigation Tabs
  setupNavigation();

  // Audit Drawer Close
  btnCloseDrawer.addEventListener('click', closeAuditDrawer);
  auditDrawer.addEventListener('click', (e) => {
    if (e.target === auditDrawer) closeAuditDrawer();
  });
});

// Setup Navigation Tab Switching & Scrolling
function setupNavigation() {
  const navItems = [
    { el: navOverview, target: '#sectionOverview' },
    { el: navTransactions, target: '#sectionTransactions' },
    { el: navAudit, target: '#sectionAudit' }
  ];

  navItems.forEach(item => {
    if (!item.el) return;
    item.el.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.el && n.el.classList.remove('active'));
      item.el.classList.add('active');

      const targetEl = document.querySelector(item.target);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Fetch all dashboard data
async function fetchDashboardData() {
  try {
    const [compRes, breakRes, actionsRes] = await Promise.all([
      fetch('/api/analytics/comparison').then(r => r.json()),
      fetch('/api/analytics/breakdown').then(r => r.json()),
      fetch('/api/recovery-actions').then(r => r.json())
    ]);

    state.comparison = compRes;
    state.breakdown = breakRes.data || [];
    state.recoveryActions = actionsRes.data || [];
    state.filteredActions = [...state.recoveryActions];

    renderMetrics();
    renderComparison();
    renderBreakdown();
    applyFilters();
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// Global Feed Tab Switcher
window.setFeedTab = function(statusFilter) {
  if (filterStatus) filterStatus.value = statusFilter;
  
  const tabMap = {
    '': 'tabAll',
    'pending': 'tabPending',
    'recovered': 'tabRecovered',
    'halted': 'tabHalted'
  };

  ['tabAll', 'tabPending', 'tabRecovered', 'tabHalted'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeTab = document.getElementById(tabMap[statusFilter] || 'tabAll');
  if (activeTab) activeTab.classList.add('active');

  state.currentPage = 1;
  applyFilters();
};

// Handle Sync / Refresh Button Click
async function handleRefresh() {
  const originalHtml = btnRefresh.innerHTML;
  btnRefresh.disabled = true;
  btnRefresh.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...`;
  
  await fetchDashboardData();
  
  setTimeout(() => {
    btnRefresh.disabled = false;
    btnRefresh.innerHTML = originalHtml;
  }, 400);
}

// Render Executive KPI Metrics & Tab Counts
function renderMetrics() {
  const actions = state.recoveryActions;
  
  // Tab Counts Update
  const countAllEl = document.getElementById('countAll');
  const countPendingEl = document.getElementById('countPending');
  const countRecoveredEl = document.getElementById('countRecovered');
  const countHaltedEl = document.getElementById('countHalted');

  const recoveredCount = actions.filter(a => a.outcome === 'recovered').length;
  const haltedCount = actions.filter(a => a.action_taken === 'no_action_respect_revoke' || a.action_taken === 'stop_max_attempts_reached').length;
  const pendingCount = actions.length - (recoveredCount + haltedCount);

  if (countAllEl) countAllEl.textContent = actions.length.toLocaleString();
  if (countPendingEl) countPendingEl.textContent = pendingCount.toLocaleString();
  if (countRecoveredEl) countRecoveredEl.textContent = recoveredCount.toLocaleString();
  if (countHaltedEl) countHaltedEl.textContent = haltedCount.toLocaleString();
  
  // Total At-Risk Revenue
  const totalAmount = actions.reduce((sum, item) => sum + (item.transactions?.amount || 0), 0);
  kpiTotalAtRisk.textContent = `₹${(totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  kpiTotalCount.textContent = `${actions.length.toLocaleString()} Failed Payments`;

  // Recovered Revenue
  const recoveredActions = actions.filter(a => a.outcome === 'recovered');
  const recoveredAmount = recoveredActions.reduce((sum, item) => sum + (item.transactions?.amount || 0), 0);
  kpiRecoveredAmount.textContent = `₹${(recoveredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const comp = state.comparison;
  if (comp) {
    const ourRate = comp.our_system?.recovery_rate_pct || 0;
    const naiveRate = comp.naive_baseline?.recovery_rate_pct || 0;
    kpiRecoveryRate.textContent = `${ourRate.toFixed(1)}% Recovery Rate`;

    // Relative Lift
    const relativeLift = naiveRate > 0 ? (((ourRate - naiveRate) / naiveRate) * 100).toFixed(1) : 0;
    kpiRelativeLift.textContent = `+${relativeLift}%`;
  }

  // Compliant Restraints Count (mandate_revoked or max attempts reached)
  const restraints = actions.filter(a => 
    a.action_taken === 'no_action_respect_revoke' || 
    a.action_taken === 'stop_max_attempts_reached'
  ).length;
  kpiCompliantRestraints.textContent = restraints.toLocaleString();
}

// Render A/B Benchmark Comparison
function renderComparison() {
  const comp = state.comparison;
  if (!comp) return;

  const our = comp.our_system || { recovered: 0, total: 0, recovery_rate_pct: 0 };
  const naive = comp.naive_baseline || { recovered: 0, total: 0, recovery_rate_pct: 0 };

  ourSystemRateText.textContent = `${our.recovery_rate_pct.toFixed(1)}%`;
  ourSystemBar.style.width = `${Math.min(our.recovery_rate_pct, 100)}%`;
  ourSystemMeta.textContent = `${our.recovered.toLocaleString()} of ${our.total.toLocaleString()} Payments Recovered`;

  naiveRateText.textContent = `${naive.recovery_rate_pct.toFixed(1)}%`;
  naiveBar.style.width = `${Math.min(naive.recovery_rate_pct, 100)}%`;
  naiveMeta.textContent = `${naive.recovered.toLocaleString()} of ${naive.total.toLocaleString()} Payments Recovered`;
}

// Render Failure Category Breakdown
function renderBreakdown() {
  if (!state.breakdown.length) {
    breakdownList.innerHTML = `<div class="text-muted p-3">No category data available</div>`;
    return;
  }

  breakdownList.innerHTML = state.breakdown.map(item => `
    <div class="breakdown-item">
      <div class="breakdown-info">
        <h5>${formatCategory(item.predicted_category)}</h5>
        <p>Action: <code>${item.action_taken}</code> (${item.recovered}/${item.total} recovered)</p>
      </div>
      <div class="breakdown-rate ${item.recovery_rate_pct > 50 ? 'emerald-text' : 'text-muted'}">
        ${item.recovery_rate_pct.toFixed(1)}%
      </div>
    </div>
  `).join('');
}

// Apply Toolbar Filters
function applyFilters() {
  const query = inputSearch.value.toLowerCase().trim();
  const method = filterMethod.value;
  const category = filterCategory.value;
  const status = filterStatus ? filterStatus.value : '';

  state.filteredActions = state.recoveryActions.filter(item => {
    const txn = item.transactions || {};
    const matchesSearch = !query || 
      item.transaction_id.toLowerCase().includes(query) ||
      (txn.customer_id && txn.customer_id.toLowerCase().includes(query));

    const matchesMethod = !method || (txn.method && txn.method.toLowerCase() === method);
    const matchesCategory = !category || item.predicted_category === category;
    
    let matchesStatus = true;
    const isHalted = item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached';
    const isRecovered = item.outcome === 'recovered';

    if (status === 'recovered') matchesStatus = isRecovered;
    else if (status === 'pending') matchesStatus = !isRecovered && !isHalted;
    else if (status === 'halted') matchesStatus = isHalted;

    return matchesSearch && matchesMethod && matchesCategory && matchesStatus;
  });

  renderTableAndPagination();
}

// Render Table AND Pagination Controls
function renderTableAndPagination() {
  const totalItems = state.filteredActions.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;

  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, totalItems);
  const currentBatch = state.filteredActions.slice(startIndex, endIndex);

  // Render Table Rows
  if (!currentBatch.length) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No transactions match current filters</td></tr>`;
  } else {
    tableBody.innerHTML = currentBatch.map(item => {
      const txn = item.transactions || {};
      const amountFormatted = `₹${((txn.amount || 0) / 100).toFixed(2)}`;
      
      // Status Badge
      let statusBadge = '<span class="badge badge-pending">PENDING EXECUTION</span>';
      if (item.outcome === 'recovered') {
        statusBadge = '<span class="badge badge-recovered"><i class="fa-solid fa-check"></i> RECOVERED</span>';
      } else if (item.action_taken === 'no_action_respect_revoke' || item.action_taken === 'stop_max_attempts_reached') {
        statusBadge = '<span class="badge badge-halted"><i class="fa-solid fa-shield"></i> COMPLIANCE STOP</span>';
      } else if (item.outcome === 'not_recovered') {
        statusBadge = '<span class="badge badge-halted">NOT RECOVERED</span>';
      }

      return `
        <tr>
          <td>
            <strong class="font-mono">${item.transaction_id.substring(0, 8)}...</strong>
            <div class="text-subtle" style="font-size: 11px;">Customer: ${txn.customer_id || 'N/A'}</div>
          </td>
          <td><strong>${amountFormatted}</strong></td>
          <td><span class="badge-tier">${(txn.method || 'N/A').toUpperCase()}</span></td>
          <td>${formatCategory(item.predicted_category || txn.error_reason)}</td>
          <td><span class="action-pill">${item.action_taken}</span></td>
          <td><strong>${((item.confidence_score || 0) * 100).toFixed(0)}%</strong></td>
          <td>${statusBadge}</td>
          <td>
            <button onclick="openAuditDrawer('${item.transaction_id}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;">
              <i class="fa-solid fa-eye"></i> Audit
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Pagination Info & Buttons
  const startNum = totalItems > 0 ? startIndex + 1 : 0;
  paginationRange.textContent = `Showing ${startNum.toLocaleString()} to ${endIndex.toLocaleString()} of ${totalItems.toLocaleString()} transactions`;

  btnPrevPage.disabled = state.currentPage <= 1;
  btnNextPage.disabled = state.currentPage >= totalPages;

  renderPageNumbers(totalPages);
}

// Render Page Numbers Bar (Smart windowing for clean navigation)
function renderPageNumbers(totalPages) {
  let pagesHtml = '';
  const current = state.currentPage;
  
  let startPage = Math.max(1, current - 2);
  let endPage = Math.min(totalPages, current + 2);

  if (startPage > 1) {
    pagesHtml += `<button onclick="goToPage(1)" class="page-num ${current === 1 ? 'active' : ''}">1</button>`;
    if (startPage > 2) pagesHtml += `<span class="text-subtle" style="padding: 0 4px;">...</span>`;
  }

  for (let p = startPage; p <= endPage; p++) {
    pagesHtml += `<button onclick="goToPage(${p})" class="page-num ${current === p ? 'active' : ''}">${p}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pagesHtml += `<span class="text-subtle" style="padding: 0 4px;">...</span>`;
    pagesHtml += `<button onclick="goToPage(${totalPages})" class="page-num ${current === totalPages ? 'active' : ''}">${totalPages}</button>`;
  }

  pageNumbers.innerHTML = pagesHtml;
}

// Go to specific page
window.goToPage = function(pageNum) {
  state.currentPage = pageNum;
  renderTableAndPagination();
};

// Handle Batch Execution Trigger
async function handleExecuteDue() {
  btnExecuteDue.disabled = true;
  btnExecuteDue.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Executing Batch...`;

  try {
    const res = await fetch('/api/recovery-actions/execute-due', { method: 'POST' }).then(r => r.json());
    alert(`Batch Execution Complete:\n- ${res.executed_count} scheduled actions executed\n- ${res.recovered_count} payments recovered (${res.recovery_rate_pct}% success rate)`);
    await fetchDashboardData();
  } catch (err) {
    alert('Error executing batch actions');
  } finally {
    btnExecuteDue.disabled = false;
    btnExecuteDue.innerHTML = `<i class="fa-solid fa-play"></i> Execute Scheduled Actions`;
  }
}

// Open Audit Drawer
async function openAuditDrawer(transactionId) {
  drawerSubTitle.textContent = `Transaction ID: ${transactionId}`;
  drawerContent.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading audit trail...</div>`;
  auditDrawer.classList.add('active');

  try {
    const res = await fetch(`/api/audit/${transactionId}`).then(r => r.json());
    const audit = res.data;

    const summary = audit.retry_schedule_summary || {};
    const isRecovered = summary.is_recovered;
    const isHalted = summary.is_halted;

    let scheduleCardHtml = '';

    if (isRecovered) {
      scheduleCardHtml = `
        <div style="margin-bottom: 24px; background: rgba(16, 185, 129, 0.08); padding: 16px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.25);">
          <h4 style="color: var(--emerald); font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-circle-check"></i> Revenue Successfully Recovered</span>
            <span class="badge badge-recovered">RECOVERED</span>
          </h4>
          <div style="font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; color: var(--text-main);">
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Attempts Used</div>
              <strong>Attempt 2 of 4 (1 Failure + 1 Retry)</strong>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Future Retries Needed</div>
              <strong style="color: var(--emerald);">0 (Payment Complete)</strong>
            </div>
            <div style="grid-column: span 2; margin-top: 4px;">
              <div style="font-size: 11px; color: var(--text-muted);">Successful Strategy Window</div>
              <span style="font-size: 12px; color: var(--text-muted);">${summary.retry_strategy_window || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    } else if (isHalted) {
      scheduleCardHtml = `
        <div style="margin-bottom: 24px; background: rgba(244, 63, 94, 0.08); padding: 16px; border-radius: 8px; border: 1px solid rgba(244, 63, 94, 0.25);">
          <h4 style="color: var(--rose); font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-shield-halved"></i> Compliant Restraint Executed</span>
            <span class="badge badge-halted">HALTED</span>
          </h4>
          <div style="font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; color: var(--text-main);">
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Attempts Used</div>
              <strong>Attempt 1 of 4 (Halted Instantly)</strong>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Retries Allowed</div>
              <strong style="color: var(--rose);">0 Retries Allowed</strong>
            </div>
            <div style="grid-column: span 2; margin-top: 4px;">
              <div style="font-size: 11px; color: var(--text-muted);">Restraint Reason</div>
              <span style="font-size: 12px; color: var(--text-muted);">${summary.retry_strategy_window || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      const nextDate = summary.next_retry_scheduled_at ? new Date(summary.next_retry_scheduled_at).toLocaleString() : 'N/A';
      scheduleCardHtml = `
        <div style="margin-bottom: 24px; background: rgba(2, 132, 199, 0.08); padding: 16px; border-radius: 8px; border: 1px solid rgba(2, 132, 199, 0.25);">
          <h4 style="color: #38bdf8; font-size: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-clock-rotate-left"></i> Ongoing Retry Schedule & Limits</span>
            <span class="badge badge-pending">${summary.retries_remaining} Retries Left</span>
          </h4>
          <div style="font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; color: var(--text-main);">
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Attempts Completed</div>
              <strong>Attempt ${summary.attempts_used || 1} of ${summary.max_attempts_allowed || 4}</strong>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted);">Retries Allowed</div>
              <strong style="color: var(--emerald);">${summary.retries_remaining} Retries Allowed</strong>
            </div>
            <div style="grid-column: span 2; margin-top: 4px;">
              <div style="font-size: 11px; color: var(--text-muted);">Next Retry Scheduled At</div>
              <strong style="color: #38bdf8;">${nextDate}</strong>
            </div>
            <div style="grid-column: span 2; margin-top: 2px;">
              <div style="font-size: 11px; color: var(--text-muted);">Strategy Window</div>
              <span style="font-size: 12px; color: var(--text-muted);">${summary.retry_strategy_window || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    }

    drawerContent.innerHTML = `
      <!-- Model Decision & Strategy Box -->
      <div style="margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
        <h4 style="color: var(--primary); margin-bottom: 8px;"><i class="fa-solid fa-brain"></i> Model Decision & Rationale</h4>
        <p style="font-size: 13px;"><strong>Predicted Cause:</strong> ${formatCategory(audit.recovery_action?.predicted_category)}</p>
        <p style="font-size: 13px;"><strong>Decided Action:</strong> <code>${audit.recovery_action?.action_taken}</code></p>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;"><em>"${audit.recovery_action?.reasoning}"</em></p>
      </div>

      <!-- Execution Status Card -->
      ${scheduleCardHtml}

      <h4 style="margin-bottom: 16px;"><i class="fa-solid fa-timeline"></i> Step-by-Step Execution Lifecycle</h4>
      <div class="timeline">
        ${audit.timeline.map(step => `
          <div class="timeline-step ${step.event === 'RECOVERY_OUTCOME' ? 'completed' : ''}">
            <div class="step-card">
              <h4>${step.title}</h4>
              <p>${step.description}</p>
              <div class="step-meta"><i class="fa-regular fa-clock"></i> ${new Date(step.timestamp).toLocaleString()}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    drawerContent.innerHTML = `<p class="text-rose">Error loading audit trail: ${err.message}</p>`;
  }
}

window.openAuditDrawer = openAuditDrawer;

function closeAuditDrawer() {
  auditDrawer.classList.remove('active');
}

function formatCategory(cat) {
  if (!cat) return 'N/A';
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
