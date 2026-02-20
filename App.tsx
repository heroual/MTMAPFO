
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import InstallationPage from './pages/InstallationPage';
import EquipmentsPage from './pages/EquipmentsPage';
import OperationsPage from './pages/OperationsPage';
import GovernancePage from './pages/GovernancePage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './components/Auth/LoginPage';
import { NetworkProvider } from './context/NetworkContext';
import { Menu, Network } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Redirection logique pour le rôle VIEWER (Consultant)
  const isViewer = profile?.role === 'viewer';

  return (
    <NetworkProvider>
      <div className="flex h-screen w-screen bg-iam-gray dark:bg-slate-950 text-iam-text dark:text-slate-200 overflow-hidden selection:bg-iam-red selection:text-white dark:selection:bg-cyan-500/30 transition-colors duration-300">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
          <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 z-0"></div>
          
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-30 relative shrink-0">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                  <Network className="text-iam-red w-5 h-5" />
                  <span className="font-extrabold text-iam-text dark:text-white uppercase tracking-tighter">MTMAP-FO</span>
                </div>
             </div>
          </div>

          <div className="flex-1 relative z-1 overflow-hidden">
            <Routes>
              {/* Route racine intelligente : Dashboard pour Admin/Tech, Map pour Viewer */}
              <Route path="/" element={
                isViewer ? <Navigate to="/map" replace /> : <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              
              <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
              
              {/* Module d'installation : Accessible aux viewers en lecture, full pour les autres */}
              <Route path="/install" element={<ProtectedRoute requiredRole="viewer"><InstallationPage /></ProtectedRoute>} />
              
              {/* Modules Opérationnels : Uniquement Technician+ */}
              <Route path="/equipments" element={<ProtectedRoute requiredRole="technician"><EquipmentsPage /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute requiredRole="technician"><OperationsPage /></ProtectedRoute>} />
              
              {/* Modules Supervision : Uniquement Supervisor+ */}
              <Route path="/governance" element={<ProtectedRoute requiredRole="supervisor"><GovernancePage /></ProtectedRoute>} />
              
              {/* Paramètres : Uniquement Technician+ */}
              <Route path="/settings" element={<ProtectedRoute requiredRole="technician"><SettingsPage /></ProtectedRoute>} />
              
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </NetworkProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
