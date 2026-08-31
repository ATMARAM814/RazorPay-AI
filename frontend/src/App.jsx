import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ComparisonChart } from './components/ComparisonChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RecoveryFeedTable } from './components/RecoveryFeedTable';
import { AuditDrawer } from './components/AuditDrawer';
import { 
  fetchComparison, 
  fetchBreakdown, 
  fetchRecoveryActions, 
  fetchAuditTrail, 
  executeDueActions 
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('recovery');
  const [recoveryActions, setRecoveryActions] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Audit Drawer State
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    try {
      const [compRes, breakRes, actionsRes] = await Promise.all([
        fetchComparison().catch(() => null),
        fetchBreakdown().catch(() => ({ data: [] })),
        fetchRecoveryActions().catch(() => ({ data: [] }))
      ]);

      if (compRes) setComparison(compRes);
      if (breakRes?.data) setBreakdown(breakRes.data);
      if (actionsRes?.data) setRecoveryActions(actionsRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Sync Data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Handle Batch Execution
  const handleExecuteDue = async () => {
    setIsExecuting(true);
    try {
      const res = await executeDueActions();
      alert(`Batch Execution Complete:\n- ${res.executed_count} scheduled actions executed\n- ${res.recovered_count} payments recovered (${res.recovery_rate_pct}% success rate)`);
      await loadDashboardData();
    } catch (err) {
      alert('Error executing batch actions');
    } finally {
      setIsExecuting(false);
    }
  };

  // Open Audit Drawer
  const handleOpenAudit = async (transactionId) => {
    setSelectedTxnId(transactionId);
    setAuditData(null);
    setIsAuditLoading(true);

    try {
      const res = await fetchAuditTrail(transactionId);
      setAuditData(res);
    } catch (err) {
      console.error('Error loading audit trail:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Shell */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content">
        <TopHeader 
          onExecute={handleExecuteDue}
          onRefresh={handleRefresh}
          isExecuting={isExecuting}
          isRefreshing={isRefreshing}
        />

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <p>Loading Razorpay AI Engine Analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview KPIs */}
            <KpiSummaryCards 
              recoveryActions={recoveryActions} 
              comparison={comparison} 
            />

            {/* A/B Comparison & Failure Cause Breakdown */}
            <div className="grid-2col margin-top">
              <ComparisonChart comparison={comparison} />
              <CategoryBreakdown breakdown={breakdown} />
            </div>

            {/* Paginated Recovery Feed */}
            <RecoveryFeedTable 
              recoveryActions={recoveryActions}
              onOpenAudit={handleOpenAudit}
            />
          </>
        )}
      </main>

      {/* Slide-Over Audit Drawer Modal */}
      <AuditDrawer 
        isOpen={!!selectedTxnId}
        onClose={() => setSelectedTxnId(null)}
        auditData={auditData}
        isLoading={isAuditLoading}
      />
    </div>
  );
}

export default App;
