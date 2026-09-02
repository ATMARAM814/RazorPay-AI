import React from 'react';
import { RotateCw, User, Sparkles } from 'lucide-react';

export const TopHeader = ({ activeTab, onSimulate, isSimulating, onRefresh, isRefreshing }) => {
  let title = 'Revenue Recovery';
  let subtitle = 'Automated payment failure diagnosis & smart retry schedule';

  if (activeTab === 'audit') {
    title = 'Compliance & Audit Logs';
    subtitle = 'Step-by-step transaction audit trails and NPCI compliance enforcements';
  } else if (activeTab === 'simulation') {
    title = 'Live Simulation Sandbox';
    subtitle = 'Real-time payment recovery pipeline execution visualizer';
  }

  return (
    <header className="topbar">
      <div className="header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-controls">
        {activeTab !== 'simulation' && (
          <button 
            onClick={onSimulate} 
            disabled={isSimulating}
            className="btn btn-primary"
          >
            <Sparkles className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate New Failed Payment'}</span>
          </button>
        )}

        <button 
          onClick={onRefresh} 
          disabled={isRefreshing}
          className="btn btn-secondary"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </button>

        <div className="user-profile">
          <User className="w-4 h-4 text-slate-500" />
          <span>Account Admin</span>
        </div>
      </div>
    </header>
  );
};

