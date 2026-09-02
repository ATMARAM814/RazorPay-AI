import React from 'react';
import { 
  Zap, 
  Home, 
  CreditCard, 
  RefreshCw, 
  FileText, 
  ClipboardCheck, 
  Settings, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="logo-icon">
          <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <div className="brand-text">
          <h2 className="brand-title">Razorpay</h2>
          <p className="brand-sub">Merchant Dashboard</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="nav-menu">
        <div className="nav-section-title">MAIN</div>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="nav-section-title">PAYMENTS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <CreditCard className="w-4 h-4" />
          <span>Transactions</span>
        </button>
        
        <button className="nav-item opacity-60 cursor-not-allowed">
          <RefreshCw className="w-4 h-4" />
          <span>Subscriptions</span>
        </button>

        {/* Smart Revenue Recovery */}
        <button 
          onClick={() => setActiveTab('recovery')} 
          className={`nav-item ${activeTab === 'recovery' ? 'active' : ''}`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Revenue Recovery</span>
        </button>

        <div className="nav-section-title">DEMO & TESTING</div>
        <button 
          onClick={() => setActiveTab('simulation')} 
          className={`nav-item ${activeTab === 'simulation' ? 'active' : ''}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Live Simulation Sandbox</span>
        </button>

        <div className="nav-section-title">REPORTS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <FileText className="w-4 h-4" />
          <span>Settlements</span>
        </button>
        <button 
          onClick={() => setActiveTab('audit')} 
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        <div className="nav-section-title">SETTINGS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <Settings className="w-4 h-4" />
          <span>Webhooks & API</span>
        </button>
      </nav>
    </aside>
  );
};
