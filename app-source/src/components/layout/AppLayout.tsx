import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TopHeader } from './TopHeader';
import { RoleSidebar } from './RoleSidebar';
import { AndroidPWAInstallBanner } from '../common/AndroidPWAInstallBanner';
import { OpenShiftModal } from '../shift/OpenShiftModal';
import { CloseShiftModal } from '../shift/CloseShiftModal';

// Master Pages
import { MasterDashboard } from '../../pages/master/MasterDashboard';
import { MasterOwnersPage } from '../../pages/master/MasterOwnersPage';
import { MasterSettingsPage } from '../../pages/master/MasterSettingsPage';

// Owner Pages
import { OwnerDashboard } from '../../pages/owner/OwnerDashboard';
import { OwnerProductsPage } from '../../pages/owner/OwnerProductsPage';
import { OwnerStockPage } from '../../pages/owner/OwnerStockPage';
import { OwnerTransactionsPage } from '../../pages/owner/OwnerTransactionsPage';
import { OwnerReportsPage } from '../../pages/owner/OwnerReportsPage';
import { OwnerCashiersPage } from '../../pages/owner/OwnerCashiersPage';
import { OwnerShiftsPage } from '../../pages/owner/OwnerShiftsPage';
import { OwnerExpensesPage } from '../../pages/owner/OwnerExpensesPage';
import { OwnerSettingsPage } from '../../pages/owner/OwnerSettingsPage';

// Cashier Pages
import { CashierPOSPage } from '../../pages/cashier/CashierPOSPage';
import { CashierShiftPage } from '../../pages/cashier/CashierShiftPage';
import { CashierTransactionsPage } from '../../pages/cashier/CashierTransactionsPage';
import { CashierReportsPage } from '../../pages/cashier/CashierReportsPage';
import { CashierProfilePage } from '../../pages/cashier/CashierProfilePage';

export const AppLayout: React.FC = () => {
  const { user, setActiveShift } = useAuth();

  // Default tab based on role
  const getDefaultTab = () => {
    switch (user?.role) {
      case 'MASTER':
        return 'dashboard';
      case 'OWNER':
        return 'dashboard';
      case 'CASHIER':
        return 'pos';
      default:
        return 'dashboard';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(getDefaultTab());
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);

  const renderContent = () => {
    // 1. MASTER ROLE
    if (user?.role === 'MASTER') {
      switch (currentTab) {
        case 'dashboard':
          return <MasterDashboard onNavigateToOwners={() => setCurrentTab('owners')} />;
        case 'owners':
          return <MasterOwnersPage />;
        case 'settings':
          return <MasterSettingsPage />;
        default:
          return <MasterDashboard onNavigateToOwners={() => setCurrentTab('owners')} />;
      }
    }

    // 2. OWNER ROLE
    if (user?.role === 'OWNER') {
      switch (currentTab) {
        case 'dashboard':
          return <OwnerDashboard onNavigate={setCurrentTab} />;
        case 'pos':
          return <CashierPOSPage onNavigateHome={() => setCurrentTab('dashboard')} />;
        case 'products':
          return <OwnerProductsPage />;
        case 'stock':
          return <OwnerStockPage />;
        case 'transactions':
          return <OwnerTransactionsPage />;
        case 'reports':
          return <OwnerReportsPage />;
        case 'cashiers':
          return <OwnerCashiersPage />;
        case 'shifts':
          return <OwnerShiftsPage />;
        case 'expenses':
          return <OwnerExpensesPage />;
        case 'settings':
          return <OwnerSettingsPage />;
        default:
          return <OwnerDashboard onNavigate={setCurrentTab} />;
      }
    }

    // 3. CASHIER ROLE
    if (user?.role === 'CASHIER') {
      switch (currentTab) {
        case 'dashboard':
          return <OwnerDashboard onNavigate={setCurrentTab} />;
        case 'pos':
          return <CashierPOSPage onNavigateHome={() => setCurrentTab('dashboard')} />;
        case 'shift':
          return <CashierShiftPage />;
        case 'transactions':
          return <CashierTransactionsPage />;
        case 'reports':
          return <CashierReportsPage />;
        case 'profile':
          return <CashierProfilePage />;
        default:
          return <CashierPOSPage onNavigateHome={() => setCurrentTab('dashboard')} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* PWA / Android APK banner */}
      <AndroidPWAInstallBanner />

      {/* Top Application Header */}
      <TopHeader
        onOpenShiftModal={() => setShowOpenShiftModal(true)}
        onCloseShiftModal={() => setShowCloseShiftModal(true)}
        onNavigateHome={() => setCurrentTab('dashboard')}
      />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <RoleSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Content area: full bleed for POS, padded container for dashboards */}
        <main
          className={`flex-1 overflow-y-auto ${
            currentTab === 'pos'
              ? 'p-0'
              : 'p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full mb-16 md:mb-0'
          }`}
        >
          {renderContent()}
        </main>
      </div>

      {/* Header-triggered Shift Modals */}
      {showOpenShiftModal && (
        <OpenShiftModal
          isOpen={true}
          onClose={() => setShowOpenShiftModal(false)}
          onSuccess={(s) => {
            setActiveShift(s);
            setShowOpenShiftModal(false);
          }}
        />
      )}

      {showCloseShiftModal && (
        <CloseShiftModal
          isOpen={true}
          onClose={() => setShowCloseShiftModal(false)}
          onSuccess={() => {
            setActiveShift(null);
            setShowCloseShiftModal(false);
          }}
        />
      )}
    </div>
  );
};
