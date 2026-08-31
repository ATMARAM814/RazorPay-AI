import React from 'react';
import { RotateCw, User, Sparkles } from 'lucide-react';

export const TopHeader = ({ onSimulate, isSimulating, onRefresh, isRefreshing }) => {
  return (
    <header className="topbar">
      <div className="header-title">
        <h1>Revenue Recovery</h1>
        <p>Automated payment failure diagnosis & smart retry schedule</p>
      </div>

      <div className="header-controls">
        <button 
          onClick={onSimulate} 
          disabled={isSimulating}
          className="btn btn-primary"
        >
          <Sparkles className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating...' : 'Simulate New Failed Payment'}</span>
        </button>

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
