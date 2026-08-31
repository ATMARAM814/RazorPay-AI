import React from 'react';
import { Play, RotateCw, Search, Bell, User, CheckCircle2 } from 'lucide-react';

export const TopHeader = ({ onExecute, onRefresh, isExecuting, isRefreshing }) => {
  return (
    <header className="topbar">
      <div className="header-title">
        <div className="title-row">
          <h1>AI Revenue Recovery Command Center</h1>
          <span className="live-status-pill">
            <span className="status-dot"></span> Live Model Active
          </span>
        </div>
        <p>Diagnosing root-cause payment failures & executing bounded recovery interventions</p>
      </div>

      <div className="header-controls">
        <button 
          onClick={onExecute} 
          disabled={isExecuting}
          className="btn btn-primary"
        >
          {isExecuting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Executing Batch...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Scheduled Actions</span>
            </>
          )}
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
          <User className="w-4 h-4 text-slate-400" />
          <span>Merchant Admin</span>
        </div>
      </div>
    </header>
  );
};
