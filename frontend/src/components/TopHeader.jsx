import React from 'react';
import { Play, RotateCw, User } from 'lucide-react';

export const TopHeader = ({ onExecute, onRefresh, isExecuting, isRefreshing }) => {
  return (
    <header className="topbar">
      <div className="header-title">
        <h1>Revenue Recovery</h1>
        <p>Diagnose payment failure causes & execute scheduled retries</p>
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
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Due Retries</span>
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
          <User className="w-4 h-4 text-slate-500" />
          <span>Account Admin</span>
        </div>
      </div>
    </header>
  );
};
