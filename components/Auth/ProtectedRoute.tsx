
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/service/auth-service';
import { ShieldAlert, Lock, LogOut, RefreshCcw, UserCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading, checkAccess, signOut, refreshProfile } = useAuth();
  const location = useLocation();

  // On retire tout message de chargement bloquant pour fluidifier l'accès
  if (loading && !user) return null;

  // 1. Vérification Session Auth (Niveau technique)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Vérification Liaison Profil (Niveau métier)
  if (!profile) {
    // Si on charge encore le profil, on reste discret
    if (loading) return null;

    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="p-8 bg-iam-red/10 rounded-[3rem] border border-iam-red/20 mb-8 relative">
          <UserCircle size={80} className="text-iam-red relative z-10" />
        </div>
        
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Liaison Profil Introuvable</h2>
        
        <div className="space-y-4 max-w-md mx-auto mb-10">
          <p className="text-slate-400 font-medium leading-relaxed">
            Votre compte <span className="text-white font-mono">{user.email}</span> est authentifié, mais aucune fiche agent n'est liée dans le SIG.
          </p>
          <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Action Requise</p>
            <p className="text-xs text-slate-400">
              Veuillez demander à un administrateur d'activer votre profil dans la console de gestion des comptes.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button 
                onClick={refreshProfile}
                className="px-8 py-4 bg-white text-slate-950 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2"
            >
                <RefreshCcw size={16} /> Re-vérifier
            </button>
            <button 
                onClick={signOut}
                className="px-8 py-4 bg-slate-900 text-rose-500 border border-rose-500/30 font-black uppercase text-[11px] tracking-widest rounded-2xl flex items-center gap-2 hover:bg-rose-500/10 transition-all"
            >
                <LogOut size={16} /> Déconnexion
            </button>
        </div>
      </div>
    );
  }

  // 3. Vérification des Droits RBAC
  if (requiredRole && !checkAccess(requiredRole)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="p-8 bg-amber-500/10 rounded-[3rem] border border-amber-500/20 mb-8 relative">
          <Lock size={80} className="text-amber-500 relative z-10" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Habilitations Insuffisantes</h2>
        <p className="text-slate-400 max-w-md mb-10 font-medium">
          Accès refusé. Le rôle <span className="text-white font-black uppercase tracking-widest">{profile.role}</span> n'autorise pas l'accès à ce module.
        </p>
        <button 
            onClick={() => window.location.hash = '#/'}
            className="px-8 py-4 bg-amber-500 text-slate-950 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl hover:bg-amber-400 transition-all"
        >
            Retour au Tableau de bord
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
