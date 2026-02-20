
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Network, Lock, Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fix: Cast supabase.auth to any to resolve property 'signInWithPassword' does not exist on type 'SupabaseAuthClient'
      const { error: authError } = await (supabase.auth as any).signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError("Identifiants incorrects. Veuillez vérifier votre email et mot de passe.");
        } else {
          setError(authError.message);
        }
      }
      // Success will trigger AuthContext listener
    } catch (err: any) {
      setError("Une erreur inattendue est survenue au raccordement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-iam-red/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-panel p-10 rounded-[3rem] border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-2xl">
          
          <div className="text-center mb-12">
            <div className="inline-flex p-5 bg-iam-red rounded-[2rem] shadow-2xl shadow-red-500/20 mb-8 transition-transform hover:scale-105">
              <Network size={44} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
              MTMAP<span className="text-iam-red">-FO</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Réseau & SIG</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email IAM</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-iam-red transition-colors" size={20} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@mtmap.ma"
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-iam-red focus:bg-white/10 transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clé de Sécurité</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-iam-red transition-colors" size={20} />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-iam-red focus:bg-white/10 transition-all font-bold text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-5 bg-iam-red hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 group"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <>Se connecter <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Tunnel Chiffré AES-256</span>
             </div>
             <p className="text-[10px] text-slate-600 leading-relaxed font-black uppercase tracking-tight opacity-40">
                Maroc Telecom Proprietary System<br/>Infrastructure Critical Node v1.0.3
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
