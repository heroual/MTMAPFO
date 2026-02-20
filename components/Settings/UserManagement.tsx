
import React, { useState, useEffect } from 'react';
// Added missing 'Mail' icon to the imports from lucide-react
import { Users, UserPlus, Search, Edit2, Check, X, Loader2, AlertCircle, ToggleLeft, ToggleRight, Shield, Trash2, AlertTriangle, Key, UserCheck, Mail } from 'lucide-react';
import { SettingsService, UserAccount } from '../../lib/service/settings-service';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Formulaire
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');
  const [isActive, setIsActive] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.fetchUserDirectory();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load user directory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    resetForm();
    setEmail(user.email);
    setFullName(user.full_name || '');
    setRole(user.role?.toLowerCase() || 'technician');
    setIsActive(user.is_active !== false);
    setEditingUserId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      setMsg(null);
      
      try {
          const result = isEditing 
              ? await SettingsService.updateUser(editingUserId!, { full_name: fullName, role, is_active: isActive })
              : await SettingsService.createUser({ email, full_name: fullName, password, role });
          
          if (result.success) {
              setMsg({ type: 'success', text: isEditing ? 'Agent mis à jour.' : 'Agent enrôlé. Accès immédiat autorisé.' });
              setTimeout(async () => { 
                await loadUsers();
                setShowModal(false); 
              }, 1500);
          } else {
              setMsg({ type: 'error', text: result.error?.includes('unique') ? 'Cet email est déjà utilisé.' : result.error || 'Erreur critique.' });
          }
      } catch (err: any) {
          setMsg({ type: 'error', text: 'Erreur de connexion avec le noyau IAM.' });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDeleteUser = async () => {
      if (!showDeleteConfirm) return;
      setIsProcessing(true);
      try {
          const result = await SettingsService.deleteUser(showDeleteConfirm.id);
          if (result.success) {
              await loadUsers();
              setShowDeleteConfirm(null);
          } else {
              alert("Suppression impossible : " + result.error);
          }
      } finally {
          setIsProcessing(false);
      }
  };

  const resetForm = () => {
      setEmail(''); setFullName(''); setPassword(''); setRole('technician'); setIsActive(true);
      setEditingUserId(null); setMsg(null);
  };

  const getRoleBadge = (r: string) => {
      const base = "px-3 py-1 rounded-full text-[9px] font-black uppercase border";
      switch(r.toLowerCase()) {
          case 'admin': return `${base} bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800`;
          case 'supervisor': return `${base} bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800`;
          case 'technician': return `${base} bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800`;
          default: return `${base} bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700`;
      }
  }

  const filteredUsers = users.filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Rechercher un agent IAM..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:border-iam-red transition-all"
              />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="w-full md:w-auto px-8 py-3.5 bg-iam-red text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
              <UserPlus size={18} /> Enrôler un Agent
          </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          <table className="w-full text-left">
              <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="px-8 py-6">Identité Agent</th>
                      <th className="px-8 py-6">Habilitations</th>
                      <th className="px-8 py-6">Statut SIG</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {loading ? (
                      <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-iam-red" size={40} /></td></tr>
                  ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">Aucun compte trouvé</td></tr>
                  ) : filteredUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-8 py-6">
                              <div className="flex items-center gap-5">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-sm ${user.is_active ? 'bg-white text-slate-900 border-slate-100 dark:bg-slate-800 dark:text-white dark:border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                      {user.full_name?.substring(0,2).toUpperCase() || '??'}
                                  </div>
                                  <div>
                                      <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                          {user.full_name}
                                          {user.role === 'admin' && <Shield size={12} className="text-rose-500" />}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-tighter mt-0.5">{user.email}</div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-8 py-6">
                              <span className={getRoleBadge(user.role)}>
                                  {user.role}
                              </span>
                          </td>
                          <td className="px-8 py-6">
                              <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                  {user.is_active ? 'Accès Actif' : 'Révoqué'}
                              </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => handleOpenEdit(user)} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all active:scale-90">
                                    <Edit2 size={16} />
                                </button>
                                {user.role !== 'admin' && (
                                    <button onClick={() => setShowDeleteConfirm(user)} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* MODALE DE SUPPRESSION */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 border border-white/10 text-center">
                  <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-8">
                      <AlertTriangle size={48} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-3">Révoquer l'accès ?</h2>
                  <p className="text-sm text-slate-500 mb-10 leading-relaxed">
                      L'agent <span className="text-slate-900 dark:text-white font-black">{showDeleteConfirm.full_name}</span> ne pourra plus se connecter au SIG MTMAP-FO.
                  </p>
                  <div className="space-y-3">
                      <button 
                        onClick={handleDeleteUser}
                        disabled={isProcessing}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20"
                      >
                          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} Confirmer Révocation
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                      >
                          Garder le compte
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODALE ENRÔLEMENT / ÉDITION */}
      {showModal && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                  <div className="p-10 pb-5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-iam-red/10 rounded-2xl text-iam-red"><Shield size={24}/></div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">
                                {isEditing ? 'Éditer Agent' : 'Nouvel Agent'}
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Autorisations Systèmes</p>
                        </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X size={28} /></button>
                  </div>

                  <form onSubmit={handleSaveUser} className="p-10 pt-5 space-y-6">
                      <div className="space-y-4">
                          {!isEditing && (
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input required type="email" placeholder="Email Professionnel IAM" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl pl-12 pr-5 py-4 font-bold text-sm outline-none transition-all" />
                            </div>
                          )}
                          
                          <div className="relative">
                              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input required placeholder="Nom et Prénom" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl pl-12 pr-5 py-4 font-bold text-sm outline-none transition-all" />
                          </div>

                          {!isEditing && (
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input required type="password" placeholder="Mot de passe temporaire" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl pl-12 pr-5 py-4 font-bold text-sm outline-none transition-all" />
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profil de Habilitation</label>
                            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl px-5 py-4 font-black text-xs uppercase outline-none cursor-pointer">
                                <option value="technician">Technicien Terrain</option>
                                <option value="supervisor">Superviseur BE</option>
                                <option value="admin">Administrateur Système</option>
                                <option value="viewer">Consultant (Lecture seule)</option>
                            </select>
                          </div>
                      </div>
                      
                      {isEditing && (
                          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                              <div>
                                <span className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">Statut du compte</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Accès aux serveurs SIG</span>
                              </div>
                              <button type="button" onClick={() => setIsActive(!isActive)} className="transition-transform active:scale-90">
                                  {isActive ? <ToggleRight size={44} className="text-emerald-500" /> : <ToggleLeft size={44} className="text-slate-300" />}
                              </button>
                          </div>
                      )}

                      {msg && (
                        <div className={`p-5 rounded-2xl text-xs font-black flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            <AlertCircle size={20} />
                            {msg.text}
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={isProcessing} 
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl flex items-center justify-center gap-4 transition-all hover:bg-iam-red hover:text-white dark:hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
                      >
                          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                          {isEditing ? 'Mettre à jour' : 'Confirmer l\'enrôlement'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserManagement;
