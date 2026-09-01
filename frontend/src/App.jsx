import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ComparisonChart } from './components/ComparisonChart';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { RecoveryFeedTable } from './components/RecoveryFeedTable';
import { AuditDrawer } from './components/AuditDrawer';
import { SimulationModal } from './components/SimulationModal';
import { Sparkles, Play, Layers } from 'lucide-react';
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
        ) : activeTab === 'simulation' ? (
          /* Dedicated Live Simulation Sandbox View */
          <div className="space-y-6">
            <div className="card p-8 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" /> Judge Interactive Simulation Sandbox
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Live Payment Recovery Pipeline Test</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Trigger real-time payment failure simulations for hackathon evaluations. The engine will pick an existing customer profile, generate a consistent payment decline, diagnose the root cause, apply NPCI/RBI compliance rules, and stream the 5-stage reasoning process.
                </p>

                <div className="pt-4">
                  <button 
                    onClick={handleSimulate} 
                    disabled={isSimulating}
                    className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2"
                  >
                    <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? 'Generating Live Simulation...' : 'Simulate New Failed Payment'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Feed Table Preview */}
            <RecoveryFeedTable 
              recoveryActions={recoveryActions}
              onOpenAudit={handleOpenAudit}
            />
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
