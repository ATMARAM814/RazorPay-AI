import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ComparisonChart } from './components/ComparisonChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RecoveryFeedTable } from './components/RecoveryFeedTable';
import { LiveSimulationPage } from './components/LiveSimulationPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { 
  fetchComparison, 
  fetchBreakdown, 
  fetchRecoveryActions, 
  simulateLivePayment
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('recovery');
  const [recoveryActions, setRecoveryActions] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

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

  // Handle Header "Simulate New Failed Payment" Button
  const handleHeaderSimulate = () => {
    setActiveTab('simulation');
  };

  // Prepend simulated action into live table state
  const handleSimulationSuccess = (newAction) => {
    if (!newAction) return;
    setRecoveryActions(prev => [newAction, ...prev]);
  };

  return (
    <div className="app-layout">
      {/* Clean Light Sidebar Shell */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content">
        <TopHeader 
          onSimulate={handleHeaderSimulate}
          isSimulating={isSimulating}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <p>Loading Merchant Portal...</p>
          </div>
        ) : activeTab === 'simulation' ? (
          /* Dedicated Full-Page Live Simulation Sandbox View */
          <LiveSimulationPage onSimulateSuccess={handleSimulationSuccess} />
        ) : activeTab === 'audit' ? (
          /* Dedicated Full-Page Audit Logs View */
          <AuditLogsPage recoveryActions={recoveryActions} />
        ) : (
          /* Main Revenue Recovery Dashboard View */
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

            {/* Paginated Recovery Feed (No Audit column) */}
            <RecoveryFeedTable recoveryActions={recoveryActions} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
