import React from 'react';
import { RotateCw, User } from 'lucide-react';

export const TopHeader = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="topbar">
      <div className="header-title">
        <h1>Revenue Recovery</h1>
        <p>Automated payment failure diagnosis & smart retry schedule</p>
      </div>

      <div className="header-controls">
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
