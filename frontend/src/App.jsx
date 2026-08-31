import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ComparisonChart } from './components/ComparisonChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RecoveryFeedTable } from './components/RecoveryFeedTable';
import { AuditDrawer } from './components/AuditDrawer';
import { SimulationModal } from './components/SimulationModal';
import { 
  fetchComparison, 
  fetchBreakdown, 
  fetchRecoveryActions, 
  fetchAuditTrail,
  simulateLivePayment
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('recovery');
  const [recoveryActions, setRecoveryActions] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

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

  // Handle Live Simulation Click
  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const result = await simulateLivePayment();
      setSimulationResult(result);
      setIsSimulationModalOpen(true);
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Prepend simulated action into live table state
  const handleSimulationComplete = (newAction) => {
    if (!newAction) return;
    setRecoveryActions(prev => [newAction, ...prev]);
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
          onSimulate={handleSimulate}
          isSimulating={isSimulating}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <p>Loading Dashboard Analytics...</p>
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

      {/* Live Payment Recovery Simulation Staged Reveal Modal */}
      <SimulationModal 
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        simulationResult={simulationResult}
        onComplete={handleSimulationComplete}
      />

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
