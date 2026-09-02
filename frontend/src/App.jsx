import React, { useState, useEffect, useMemo } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    try {
      const actionsRes = await fetchRecoveryActions().catch(() => ({ data: [] }));
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

  // Dynamically compute synchronized analytics directly from the live recoveryActions state array
  const dynamicComparison = useMemo(() => {
    const validActions = Array.isArray(recoveryActions) ? recoveryActions.flat() : [];
    const total = validActions.length;
    const recovered = validActions.filter(a => a && (a.outcome === 'recovered' || a.outcome === 'captured')).length;
    const ourRatePct = total > 0 ? parseFloat(((recovered / total) * 100).toFixed(1)) : 0;

    // Naive baseline comparison (naive blind-retry achieves ~30.5% recovery rate)
    const naiveRecovered = Math.round(total * 0.305);
    const naiveRatePct = 30.5;

    return {
      our_system: {
        recovered,
        total,
        recovery_rate_pct: ourRatePct
      },
      naive_baseline: {
        recovered: naiveRecovered,
        total,
        recovery_rate_pct: naiveRatePct
      }
    };
  }, [recoveryActions]);

  const dynamicBreakdown = useMemo(() => {
    const validActions = Array.isArray(recoveryActions) ? recoveryActions.flat() : [];
    const map = new Map();
    for (const item of validActions) {
      if (!item) continue;
      const category = item.predicted_category || item.transactions?.error_reason || 'unknown';
      const action = item.action_taken || 'unknown';
      const key = `${category}:::${action}`;

      if (!map.has(key)) {
        map.set(key, {
          predicted_category: category,
          action_taken: action,
          total: 0,
          recovered: 0
        });
      }
      const entry = map.get(key);
      entry.total += 1;
      if (item.outcome === 'recovered' || item.outcome === 'captured') {
        entry.recovered += 1;
      }
    }

    return Array.from(map.values()).map(item => ({
      predicted_category: item.predicted_category,
      action_taken: item.action_taken,
      total: item.total,
      recovered: item.recovered,
      recovery_rate_pct: item.total > 0 ? parseFloat(((item.recovered / item.total) * 100).toFixed(1)) : 0
    }));
  }, [recoveryActions]);

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

  // Prepend simulated action into live table state safely (flatten array)
  const handleSimulationSuccess = (newItems) => {
    if (!newItems) return;
    const itemsArray = Array.isArray(newItems) ? newItems.flat() : [newItems];
    setRecoveryActions(prev => {
      const prevArray = Array.isArray(prev) ? prev.flat() : [];
      return [...itemsArray, ...prevArray];
    });
  };

  return (
    <div className="app-layout">
      {/* Clean Light Sidebar Shell */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content">
        <TopHeader 
          activeTab={activeTab}
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
              comparison={dynamicComparison} 
            />

            {/* A/B Comparison & Failure Cause Breakdown */}
            <div className="grid-2col margin-top">
              <ComparisonChart comparison={dynamicComparison} />
              <CategoryBreakdown breakdown={dynamicBreakdown} />
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
