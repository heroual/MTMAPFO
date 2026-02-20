
import React from 'react';
import { 
  Network, CheckCircle2, Zap, ShieldCheck, 
  HardHat, Copyright, Server, Spline, Database, Clock, 
  Flag, ArrowRight, Fingerprint, Palette, Globe, 
  FileText, Users, Microscope, LineChart, Layers, 
  ArrowDown, Building, Cable as CableIcon, Box, User, 
  Search, AlertCircle, Wrench, BarChart3, Briefcase,
  // Added missing imports for Activity and Link (aliased as LinkIcon)
  Activity, Link as LinkIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const fiberColors = [
    { id: 1, name: 'Bleu', hex: '#0074D9' },
    { id: 2, name: 'Orange', hex: '#FF851B' },
    { id: 3, name: 'Vert', hex: '#2ECC40' },
    { id: 4, name: 'Brun', hex: '#8B572A' },
    { id: 5, name: 'Gris', hex: '#AAAAAA' },
    { id: 6, name: 'Blanc', hex: '#FFFFFF', border: true },
    { id: 7, name: 'Rouge', hex: '#FF4136' },
    { id: 8, name: 'Noir', hex: '#111111' }
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
      
      {/* --- PAGE 1: VISION STRATÉGIQUE & ARCHITECTE --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-900 dark:text-white"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-large)" />
            </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-iam-red/10 border border-iam-red/30 text-iam-red dark:text-white backdrop-blur-md">
                <Flag size={16} fill="currentColor" className="text-iam-red" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Vision Intelligence FTTH 2026</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                L'EXCELLENCE <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-iam-red via-orange-500 to-amber-500">OPÉRATIONNELLE</span> <br/>
                PAR LE SIG
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                MTMAP-FO n'est pas qu'un outil cartographique, c'est le cœur battant de l'ingénierie fibre, unifiant inventaire physique et continuité logique.
            </p>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group w-full md:w-[650px] mx-auto text-left">
                <Fingerprint size={120} className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity text-iam-red" />
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-iam-red flex items-center justify-center shadow-xl shadow-red-500/20 shrink-0">
                        <HardHat size={32} className="text-white" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-xs font-black text-iam-red uppercase tracking-[0.3em]">Concepteur & Architecte</h2>
                        <p className="text-slate-800 dark:text-slate-200 text-2xl font-bold leading-tight">
                            Une solution signée <span className="text-iam-red">ELHEROUAL SALAH-EDDINE</span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                            "Face à la densification massive du réseau FTTH, l'erreur humaine sur le terrain devient le premier facteur de perte. MTMAP-FO automatise la vérité réseau pour chaque fibre, de l'OLT jusqu'au client."
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-16">
                <ArrowDown size={32} className="text-slate-300 animate-bounce" />
            </div>
        </div>
      </section>

      {/* --- PAGE 2: ARCHITECTURE NIS & FLUX LOGIQUE --- */}
      <section className="min-h-screen py-24 px-6 md:px-12 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto space-y-20">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl"><Layers size={32} /></div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Le Système NIS (Network Inventory System)</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Intelligence Logicielle & Topologie Réseau</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-8">
                    <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-inner relative">
                        <div className="absolute top-4 left-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Chaîne de Continuité Optique</div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                            {[
                                { name: 'Site / CO', icon: Building, color: 'text-blue-500' },
                                { name: 'OLT Port', icon: Server, color: 'text-cyan-500' },
                                { name: 'Splitter', icon: Network, color: 'text-purple-500' },
                                { name: 'PCO / ODP', icon: Box, color: 'text-emerald-500' },
                                { name: 'ONT Client', icon: User, color: 'text-iam-red' }
                            ].map((step, i, arr) => (
                                <React.Fragment key={i}>
                                    <div className="flex flex-col items-center gap-2 group transition-all hover:scale-110">
                                        <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md ${step.color}`}>
                                            <step.icon size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{step.name}</span>
                                    </div>
                                    {i < arr.length - 1 && <ArrowRight size={16} className="text-slate-300 hidden md:block" />}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="mt-12 p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Chaque nœud de cet arbre logique est stocké avec sa géométrie PostGIS. Le système assure la **cohérence topologique** : il est impossible de raccorder un PCO sans passer par un Splitter validé. L'allocation des brins est dynamique et respecte les brassages enregistrés.
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                        <Database size={24} className="text-blue-600 mb-4" />
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Base Relationnelle SIG</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PostgreSQL/PostGIS gérant plus de 100 000 objets avec indexation spatiale GIST pour des recherches instantanées.</p>
                    </div>
                    <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/20">
                        <Spline size={24} className="text-purple-600 mb-4" />
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Trace Engine v2.0</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Algorithme de tracé de fibre simulant un OTDR virtuel pour localiser les coupures et calculer le bilan optique estimé.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PAGE 3: POINTS FORTS & CAS D'USAGE (CONTENU UTILISATEUR) --- */}
      <section className="min-h-screen py-24 px-6 md:px-12 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto space-y-16">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl"><LineChart size={32} /></div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Points Forts & Cas d'Usage</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">L'Impact Métier sur toute la chaîne de valeur</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Décideurs */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Pour les Décideurs</h4>
                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Vue Globale :</b> Accès à une vue d'ensemble complète de l'infrastructure FTTH.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Pilotage CAPEX :</b> Taux d'utilisation en temps réel pour optimiser les investissements.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Coordonnées Réelles :</b> Actifs géolocalisés précisément pour des plans d'action basés sur la réalité terrain.</li>
                    </ul>
                </div>

                {/* Commerciales */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-iam-red transition-colors group">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-iam-red rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Briefcase size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Équipes Commerciales</h4>
                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Faisabilité Immédiate :</b> Savoir si l'installation est faisable en quelques secondes.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Validation de Commande :</b> Validation instantanée des ordres de vente avant signature.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Zéro Faux Contact :</b> Évite la promesse de service sur une zone saturée.</li>
                    </ul>
                </div>

                {/* Bureau d'Études */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-purple-500 transition-colors group">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Microscope size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Bureau d'Études (BE)</h4>
                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Simplicité Extrême :</b> Création de réseau assistée via assistants intelligents.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Modélisation Précise :</b> Représentation fidèle des câbles, brins et PCO.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Suivi des Brins :</b> Visibilité totale sur l'affectation des brins dans les câbles.</li>
                    </ul>
                </div>

                {/* Installation */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-amber-500 transition-colors group">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Équipes d'Installation</h4>
                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Allocation de Trajet :</b> Trajet précis de la fibre du central vers le client.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Génération d'ODT :</b> Ordres de Travail automatiques contenant toutes les données.</li>
                        <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> <b>Navigation Précise :</b> Accès aux coordonnées GPS exactes des équipements.</li>
                    </ul>
                </div>

                {/* Dérangements */}
                <div className="lg:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-slate-800">
                    <Wrench size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform" />
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 text-emerald-400 rounded-3xl flex items-center justify-center">
                            <Activity size={32} />
                        </div>
                        <div className="space-y-4 flex-1">
                            <h4 className="text-2xl font-black uppercase tracking-tight">Gestion des Dérangements & Maintenance</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                En cas de dérangement (ex: "No Reply"), le technicien n'a plus besoin de tester physiquement chaque port au hasard.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <h5 className="font-bold text-emerald-400 text-xs uppercase mb-2">Intervention Chirurgicale</h5>
                                    <p className="text-[11px] text-slate-300">Connaissance instantanée du port exact dans le PCO auquel le client est raccordé logiquement.</p>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <h5 className="font-bold text-blue-400 text-xs uppercase mb-2">Gain de Temps & Réactivité</h5>
                                    <p className="text-[11px] text-slate-300">Résolution des incidents optimisée pour le service client (Customer Care).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PAGE 4: STANDARDS, COULEURS & CLÔTURE --- */}
      <section className="min-h-screen py-24 px-6 md:px-12 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl"><Microscope size={32} /></div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Standards d'Ingénierie</h2>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Normes TIA-598-A Appliquées</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <BarChart3 className="text-blue-500" size={20} />
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase">Disponibilité Systèmes</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">99.99% SLA</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-10">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="flex items-center gap-4">
                            <Palette size={24} className="text-iam-red" />
                            <h4 className="font-black text-slate-800 dark:text-white uppercase text-lg">Code Couleur des Fibres</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            MTMAP-FO intègre nativement la codification couleur internationale. Chaque brin est identifié visuellement sur l'interface de brassage, éliminant les erreurs de raccordement lors du soudage en boîte.
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                            {fiberColors.map(color => (
                                <div key={color.id} className="flex flex-col items-center gap-1.5">
                                    <div 
                                        className={`w-10 h-10 rounded-xl shadow-inner border-2 ${color.border ? 'border-slate-200' : 'border-transparent'}`} 
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <div className="text-[9px] font-black text-slate-400 uppercase">{color.id}. {color.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-l-8 border-iam-red shadow-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-iam-red" size={20} />
                            <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-widest">Sécurité des Données</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Piste d'audit immuable : chaque ajout, modification ou suppression est tracé avec l'identifiant du technicien, l'heure et l'empreinte GPS de l'action.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 dark:bg-slate-100 rounded-[3rem] p-10 text-white dark:text-slate-900 relative overflow-hidden">
                        <Globe size={100} className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform" />
                        <h4 className="text-amber-500 dark:text-iam-red font-black uppercase text-xs tracking-[0.3em] mb-6">Workflow Terrain</h4>
                        <div className="space-y-6">
                            {[
                                { title: 'Diagnostic OLT', desc: 'Vérification du signal sur le port GPON source.', icon: Server },
                                { title: 'Soudure Joint', desc: 'Raccordement des brins selon le plan de boîte dynamique.', icon: LinkIcon },
                                { title: 'Test d\'Abonné', desc: 'Validation de la réception optique sur le port PCO.', icon: Activity }
                            ].map((w, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-slate-900/10 flex items-center justify-center shrink-0">
                                        <w.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold">{w.title}</div>
                                        <p className="text-[10px] opacity-70">{w.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl relative">
                        <h5 className="text-blue-200 font-black uppercase text-[10px] tracking-widest mb-4">Moteur Géospatial</h5>
                        <p className="text-sm leading-relaxed font-bold">
                            Calcul automatique de la distance de pose et des traversées de chaussée via l'intégration OSRM & Mapbox.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center pt-24 pb-12">
                <div className="inline-flex gap-4 mb-8">
                    <div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-mono text-sm shadow-2xl flex items-center gap-3 border border-white/10 transition-transform hover:scale-105">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                        MTMAP-FO Intelligence Engine v1.0.0
                    </div>
                </div>
                
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-2">
                        COPYRIGHT <Copyright size={14} /> 2026 • DOCUMENTATION TECHNIQUE CONFIDENTIELLE
                    </p>
                    <p className="text-[11px] font-black text-iam-red uppercase tracking-[0.2em]">{t('about.copyright')}</p>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
