
import React from 'react';
import { Mail, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileSettings: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const initials = (profile.full_name || 'Agent')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-10 max-w-4xl">
      {/* En-tête Profil */}
      <section className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-10 shadow-sm">
          <div className="w-32 h-32 rounded-[2.5rem] bg-iam-red flex items-center justify-center text-white text-[48px] font-black shadow-2xl shadow-red-500/30 relative shrink-0">
              {initials}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-slate-50 dark:border-slate-900 shadow-lg">
                  <CheckCircle2 size={20} />
              </div>
          </div>
          <div className="space-y-2 text-center md:text-left">
              <h3 className="text-[36px] font-[900] text-slate-900 dark:text-white leading-none tracking-tighter">{profile.full_name}</h3>
              <p className="text-slate-500 font-black text-sm uppercase tracking-wide">Équipe Infrastructure • {profile.role}</p>
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase rounded-full border border-emerald-500/20">
                  COMPTE ACTIF & VÉRIFIÉ
              </div>
          </div>
      </section>

      {/* Email de contact */}
      <div className="p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email de raccordement</label>
          <div className="flex items-center gap-5 text-slate-800 dark:text-slate-200">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
                  <Mail size={24} />
              </div>
              <span className="text-xl font-bold truncate">{profile.email}</span>
          </div>
      </div>

      {/* Sécurité du compte */}
      <div className="p-10 bg-amber-50/50 dark:bg-amber-900/10 rounded-[3rem] border border-amber-100 dark:border-amber-800/40 space-y-6">
          <div className="flex items-center gap-4 text-amber-700 dark:text-amber-400">
              <Shield size={28} strokeWidth={2.5} />
              <h4 className="font-black uppercase text-base tracking-widest">GOUVERNANCE DES ACCÈS</h4>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold max-w-2xl">
              Vos habilitations de niveau <span className="text-iam-red uppercase">{profile.role}</span> sont gérées par la console d'administration IAM. 
              Pour toute demande de modification de privilèges, veuillez contacter le superviseur SIG.
          </p>
      </div>
    </div>
  );
};

export default ProfileSettings;
