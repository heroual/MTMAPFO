
import React from 'react';
import { Map as MapIcon, Globe, Layers, MousePointer2, ZoomIn, Magnet, Check, Eye } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const GisSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const styles = [
    { id: 'light', name: 'Vectoriel (IAM)', img: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-8.87,30.47,13/200x120?access_token=none' },
    { id: 'dark', name: 'Dark Matter', img: 'https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-8.87,30.47,13/200x120?access_token=none' },
    { id: 'satellite', name: 'Imagerie Satellite', img: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-8.87,30.47,13/200x120?access_token=none' },
  ];

  const layerList = [
    { id: 'sites', label: 'Centrales (Sites)', color: 'bg-blue-500' },
    { id: 'olts', label: 'OLTs & MSANs', color: 'bg-cyan-500' },
    { id: 'splitters', label: 'Splitters PLC', color: 'bg-purple-500' },
    { id: 'pcos', label: 'PCOs (NAPs)', color: 'bg-emerald-500' },
    { id: 'cables', label: 'Câbles Fibre', color: 'bg-blue-600' },
    { id: 'joints', label: 'Boîtes (Joints)', color: 'bg-amber-500' },
  ];

  const currentLayers = settings['gis.layers_visibility'] || {};

  const toggleLayer = (layerId: string) => {
      const newLayers = { ...currentLayers, [layerId]: !currentLayers[layerId] };
      updateSetting('gis.layers_visibility', newLayers, 'USER');
  };

  return (
    <div className="space-y-12">
      {/* 1. MAP STYLE SELECTION */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Fond de plan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {styles.map(style => (
                  <div 
                    key={style.id}
                    onClick={() => updateSetting('gis.map_style', style.id, 'USER')}
                    className={`relative rounded-[2rem] border-4 overflow-hidden cursor-pointer transition-all group ${settings['gis.map_style'] === style.id ? 'border-blue-500 shadow-xl' : 'border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'}`}
                  >
                      <div className="h-32 bg-slate-200 dark:bg-slate-800 relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-4 text-white text-xs font-black uppercase tracking-widest">{style.name}</div>
                          {settings['gis.map_style'] === style.id && (
                              <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                                  <Check size={12} />
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* 2. LAYER DEFAULTS */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600">
                <Layers size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Calques par défaut</h3>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 mb-6 font-medium italic">Sélectionnez les éléments à afficher automatiquement à chaque ouverture de carte.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {layerList.map(layer => (
                      <div 
                        key={layer.id}
                        onClick={() => toggleLayer(layer.id)}
                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${currentLayers[layer.id] !== false ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-transparent border-dashed border-slate-200 dark:border-slate-800 opacity-40'}`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${layer.color}`} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{layer.label}</span>
                          </div>
                          {currentLayers[layer.id] !== false && <Eye size={14} className="text-blue-500" />}
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 3. INTELLIGENT BEHAVIOR */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600">
                <Magnet size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Comportement du tracé</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600">
                          <Magnet size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">Snap to Road (Auto-Routage)</p>
                          <p className="text-[10px] text-slate-500">Magnétisme sur la voirie lors du dessin manuel.</p>
                      </div>
                  </div>
                  <div 
                    onClick={() => updateSetting('gis.snap_to_road', !settings['gis.snap_to_road'], 'USER')}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${settings['gis.snap_to_road'] !== false ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${settings['gis.snap_to_road'] !== false ? 'right-1' : 'left-1'}`} />
                  </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                          <ZoomIn size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">Auto-zoom intelligent</p>
                          <p className="text-[10px] text-slate-500">Recalage automatique lors d'une recherche.</p>
                      </div>
                  </div>
                  <div 
                    onClick={() => updateSetting('gis.auto_zoom_on_select', !settings['gis.auto_zoom_on_select'], 'USER')}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${settings['gis.auto_zoom_on_select'] !== false ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${settings['gis.auto_zoom_on_select'] !== false ? 'right-1' : 'left-1'}`} />
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default GisSettings;
