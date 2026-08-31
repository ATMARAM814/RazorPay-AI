import React from 'react';
import { 
  Zap, 
  Home, 
  CreditCard, 
  RefreshCw, 
  FileText, 
  PieChart, 
  ShieldCheck, 
  Settings, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="logo-icon">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="brand-text">
          <div className="brand-title">
            <span>Razorpay</span>
            <span className="badge-tier">MERCHANT</span>
          </div>
          <p className="brand-sub">Acme Corp • Test Mode</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="nav-menu">
        <div className="nav-section-title">OVERVIEW</div>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Home className="w-4 h-4" />
          <span>Home Dashboard</span>
        </button>

        <div className="nav-section-title">PAYMENTS & PRODUCTS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <CreditCard className="w-4 h-4" />
          <span>Transactions & Refunds</span>
        </button>
        
        <button className="nav-item opacity-60 cursor-not-allowed">
          <RefreshCw className="w-4 h-4" />
          <span>Subscriptions & Mandates</span>
        </button>

        {/* Featured AI Revenue Recovery Feature */}
        <button 
          onClick={() => setActiveTab('recovery')} 
          className={`nav-item featured-nav-item ${activeTab === 'recovery' ? 'active' : ''}`}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="font-semibold">AI Revenue Recovery</span>
          <span className="badge-ai-new">AI ADD-ON</span>
        </button>

        <div className="nav-section-title">SETTLEMENTS & REPORTS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <FileText className="w-4 h-4" />
          <span>Settlements</span>
        </button>
        <button 
          onClick={() => setActiveTab('audit')} 
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
        >
          <PieChart className="w-4 h-4" />
          <span>Compliance Audit Trail</span>
        </button>

        <div className="nav-section-title">DEVELOPERS & SETTINGS</div>
        <button className="nav-item opacity-60 cursor-not-allowed">
          <Settings className="w-4 h-4" />
          <span>API Keys & Webhooks</span>
        </button>
      </nav>

      {/* Compliance Badge Card */}
      <div className="compliance-card">
        <ShieldCheck className="w-6 h-6 text-emerald-400 mb-1" />
        <h4>100% Compliant Engine</h4>
        <p>NPCI 4-Attempt UPI Limit & RBI Spacing Enforced</p>
      </div>
    </aside>
  );
};
