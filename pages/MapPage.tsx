
import React, { useState, useEffect, useCallback } from 'react';
import GponMap from '../components/Map/GponMap';
import GlobalSearch from '../components/Map/GlobalSearch';
import AddEquipmentModal from '../components/Modals/AddEquipmentModal';
import AddCableModal from '../components/Modals/AddCableModal';
import GponTreeView from '../components/Gpon/GponTreeView';
import NavigationPanel from '../components/Map/NavigationPanel';
import PcoDetailPanel from '../components/Gpon/PcoDetailPanel';
import SplitterDetailPanel from '../components/Gpon/SplitterDetailPanel'; 
import JointDetailPanel from '../components/Gpon/JointDetailPanel'; 
import BoardDetailPanel from '../components/Gpon/BoardDetailPanel'; 
import CableDetailPanel from '../components/Gpon/CableDetailPanel'; 
import EquipmentDetailPanel from '../components/Map/EquipmentDetailPanel';
import FiberTracePanel from '../components/Trace/FiberTracePanel'; 
import TraceLayer from '../components/Map/TraceLayer';
import ErrorBoundary from '../components/ErrorBoundary';
import { DEFAULT_VIEW_STATE } from '../constants';
import { Layers, Locate, AlertCircle, ChevronDown, Network, X, Cable, Eye } from 'lucide-react';
import { useGeolocation } from '../lib/gis/useGeolocation';
import { Coordinates, PhysicalEntity, RouteDetails, EquipmentType, PCO, Splitter, NetworkEntity, Equipment, FiberCable } from '../types';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import { getRoute } from '../lib/gis/routing';
import { useTranslation } from 'react-i18next';

const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const { equipments, pcos, mapFocusLocation, setMapFocusLocation, isTracing } = useNetwork();
  const { profile } = useAuth();

  const isViewer = profile?.role === 'viewer';

  const [activeLayers, setActiveLayers] = useState({ olt: true, splitter: true, pco: true, msan: true, site: true, joint: true });
  const [layersOpen, setLayersOpen] = useState(true);
  const [treeOpen, setTreeOpen] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCableModalOpen, setAddCableModalOpen] = useState(false);
  const [addLocation, setAddLocation] = useState<Coordinates | null>(null);
  const [addParentEntity, setAddParentEntity] = useState<NetworkEntity | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<Equipment | FiberCable | null>(null);
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [routeProfile, setRouteProfile] = useState<'driving' | 'walking'>('driving');
  
  const [highlightClientId, setHighlightClientId] = useState<string | null>(null);

  // Cable Drawing State
  const [isDrawingCable, setIsDrawingCable] = useState(false);
  const [manualCableData, setManualCableData] = useState<any | null>(null);
  const [cableDraft, setCableDraft] = useState<any | null>(null);

  const { location: userCoords, accuracy, error: gpsError, loading: gpsLoading } = useGeolocation();
  const [center, setCenter] = useState<Coordinates>(DEFAULT_VIEW_STATE);
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [searchResult, setSearchResult] = useState<{location: Coordinates; label: string} | null>(null);

  // GESTION DU FOCUS EXTERNE (Ex: depuis la page Operations)
  useEffect(() => {
    if (mapFocusLocation) {
        console.log("Centrage sur la zone de travaux :", mapFocusLocation);
        setCenter(mapFocusLocation);
        setShouldRecenter(true);
        // On ne reset pas immédiatement pour laisser à GponMap le temps de voir le changement
        const timer = setTimeout(() => {
            setShouldRecenter(false);
            setMapFocusLocation(null);
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [mapFocusLocation, setMapFocusLocation]);

  const handleNavigate = async () => {
      const entity = selectedEntity as any;
      if (entity && entity.location && userCoords) {
        const routeData = await getRoute(userCoords, entity.location, routeProfile);
        setRoute(routeData);
      }
  };

  const handleSearchResult = (result: any) => {
    if (result) {
      if (result.category === 'CLIENT' && result.pcoId) {
          const pco = pcos.find(p => p.id === result.pcoId);
          if (pco && pco.location) {
              setCenter(pco.location);
              setShouldRecenter(true);
              setTimeout(() => setShouldRecenter(false), 500);
              setSelectedEntity(pco);
              setHighlightClientId(result.id);
          }
      } else if (result.category === 'EQUIPMENT' && result.entity) {
          if (result.location) {
              setCenter(result.location);
              setShouldRecenter(true);
              setTimeout(() => setShouldRecenter(false), 500);
          }
          setSelectedEntity(result.entity);
      } else {
          setSearchResult({ location: result.location, label: result.label });
          setCenter(result.location);
          setShouldRecenter(true);
          setTimeout(() => setShouldRecenter(false), 500);
      }
    } else {
      setSearchResult(null);
    }
  };

  const handleCenterUser = () => {
    if (userCoords) {
      setCenter(userCoords);
      setShouldRecenter(true);
      setTimeout(() => setShouldRecenter(false), 500);
    }
  };

  const handleAddEquipmentRequest = (coords: Coordinates) => {
    if (isViewer) return;
    setAddLocation(coords);
    setAddParentEntity(null); 
    setAddModalOpen(true);
  };

  const handleAddChildRequest = (parent: NetworkEntity) => {
      if (isViewer) return;
      setAddParentEntity(parent);
      if ((parent as any).location) {
          setAddLocation((parent as any).location);
      }
      setAddModalOpen(true);
  };

  const handleEquipmentSelect = (entity: Equipment | FiberCable) => {
    if (isDrawingCable) return; 
    setSelectedEntity(entity);
    setHighlightClientId(null);
    setRoute(null);
  };

  const handleQuitNavigation = () => {
    setSelectedEntity(null);
    setRoute(null);
  };

  const handleTreeSelect = (id: string, type: string) => {
    const realId = id.includes('::') ? id.split('::')[0] : id;
    const entity = equipments.find(e => e.id === realId);
    
    if (entity && (entity as any).location) {
      setCenter((entity as any).location);
      setShouldRecenter(true);
      setSelectedEntity(entity); 
      setRoute(null);
      setTimeout(() => setShouldRecenter(false), 500);
    } 

    if (window.innerWidth < 768) {
        setTreeOpen(false);
    }
  };

  const handleStartDrawing = (draftState: any) => {
      if (isViewer) return;
      setCableDraft(draftState); 
      setAddCableModalOpen(false);
      setIsDrawingCable(true);
  };

  const handleDrawingFinish = (result: any) => {
      setIsDrawingCable(false);
      setManualCableData(result);
      setAddCableModalOpen(true);
  };

  const handleDrawingCancel = () => {
      setIsDrawingCable(false);
      setManualCableData(null);
      setAddCableModalOpen(true); 
  };

  const handleMapClick = useCallback((coords: Coordinates) => {
      console.debug("Map Clicked at:", coords);
  }, []);

  return (
    <div className="relative w-full h-full flex">
      <div className="flex-1 relative h-full">
        {/* Barre de recherche et filtres */}
        <div className={`absolute top-4 left-4 md:top-6 md:left-6 z-[400] flex flex-col gap-3 items-start w-[calc(100%-2rem)] md:max-w-[400px] transition-opacity duration-300 ${isDrawingCable ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <GlobalSearch onSelectResult={handleSearchResult} />

          <div className="flex gap-2 w-full">
             <div className="glass-panel rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex-1">
                <button 
                  onClick={() => setLayersOpen(!layersOpen)}
                  className="w-full flex items-center justify-between p-3 text-slate-600 dark:text-slate-400 hover:text-iam-red dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{t('map_tools.layers')}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${layersOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {layersOpen && (
                  <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.site} onChange={e => setActiveLayers(prev => ({...prev, site: e.target.checked}))} className="w-3 h-3 accent-iam-red" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">SITES</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.olt} onChange={e => setActiveLayers(prev => ({...prev, olt: e.target.checked}))} className="w-3 h-3 accent-blue-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">OLTS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.msan} onChange={e => setActiveLayers(prev => ({...prev, msan: e.target.checked}))} className="w-3 h-3 accent-cyan-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">MSANS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.splitter} onChange={e => setActiveLayers(prev => ({...prev, splitter: e.target.checked}))} className="w-3 h-3 accent-purple-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">SPLTRS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.pco} onChange={e => setActiveLayers(prev => ({...prev, pco: e.target.checked}))} className="w-3 h-3 accent-emerald-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">PCOS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={activeLayers.joint} onChange={e => setActiveLayers(prev => ({...prev, joint: e.target.checked}))} className="w-3 h-3 accent-amber-500" />
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-tight">JOINTS</span>
                      </label>
                    </div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="flex gap-2 w-full">
             <button 
                onClick={() => setTreeOpen(!treeOpen)}
                className={`glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center sm:justify-start gap-3 flex-1 transition-colors ${treeOpen ? 'bg-slate-100 dark:bg-slate-800 border-iam-red dark:border-cyan-500/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
             >
                <Network size={18} className={treeOpen ? 'text-iam-red dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'} />
                <span className={`text-sm font-bold hidden sm:inline ${treeOpen ? 'text-iam-red dark:text-cyan-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  {t('map.network_explorer')}
                </span>
             </button>
             
             {!isViewer && (
               <button 
                  onClick={() => { setManualCableData(null); setCableDraft(null); setAddCableModalOpen(true); }}
                  className={`glass-panel p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center sm:justify-start gap-3 flex-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
               >
                  <Cable size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
                    {t('map.deploy_cable')}
                  </span>
               </button>
             )}
          </div>
          
          {isViewer && (
            <div className="glass-panel px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md flex items-center gap-2 text-blue-600 dark:text-cyan-400 shadow-xl animate-in slide-in-from-left-4">
              <Eye size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mode Consultation uniquement</span>
            </div>
          )}
        </div>

        <div className={`absolute bottom-20 md:bottom-10 right-4 md:right-6 z-[400] flex flex-col gap-3 transition-opacity duration-300 ${isDrawingCable ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {gpsError && (
            <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 border border-rose-500/30 text-rose-500 text-xs mb-2 bg-rose-50 dark:bg-rose-500/10 font-bold">
              <AlertCircle size={14} /> {gpsError}
            </div>
          )}
          <button 
            onClick={handleCenterUser}
            disabled={!userCoords}
            className={`glass-panel p-3 rounded-full border transition-all duration-300 shadow-lg group ${userCoords ? 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'}`}
          >
            {gpsLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-cyan-500 rounded-full animate-spin" /> : <Locate className={`w-5 h-5 ${userCoords ? 'group-hover:scale-110' : ''} transition-transform`} />}
          </button>
        </div>

        <NavigationPanel 
          destination={selectedEntity && 'location' in selectedEntity ? (selectedEntity as PhysicalEntity) : null} 
          route={route}
          onClose={() => setSelectedEntity(null)}
          onProfileChange={setRouteProfile}
          onQuit={handleQuitNavigation}
        />
        
        {selectedEntity && !isDrawingCable && !isTracing && (
            <>
                {selectedEntity.type === EquipmentType.CABLE ? (
                    <CableDetailPanel 
                        cable={selectedEntity as FiberCable}
                        onClose={() => setSelectedEntity(null)}
                    />
                ) : selectedEntity.type === EquipmentType.PCO ? (
                    <PcoDetailPanel 
                        pco={selectedEntity as PCO}
                        onClose={() => setSelectedEntity(null)}
                        onNavigate={handleNavigate}
                        defaultSelectedClientId={highlightClientId}
                    />
                ) : selectedEntity.type === EquipmentType.SPLITTER ? (
                    <SplitterDetailPanel 
                        splitter={selectedEntity as Splitter}
                        onClose={() => setSelectedEntity(null)}
                        onNavigate={handleNavigate}
                        onSelectPco={(pco) => setSelectedEntity(pco)}
                    />
                ) : selectedEntity.type === EquipmentType.JOINT ? (
                    <JointDetailPanel
                        joint={selectedEntity as Equipment}
                        onClose={() => setSelectedEntity(null)}
                        onNavigate={handleNavigate}
                    />
                ) : selectedEntity.type === EquipmentType.BOARD ? (
                    <BoardDetailPanel 
                        board={selectedEntity as Equipment}
                        onClose={() => setSelectedEntity(null)}
                    />
                ) : (
                    <EquipmentDetailPanel 
                        entity={selectedEntity as NetworkEntity}
                        onClose={() => setSelectedEntity(null)}
                        onNavigate={handleNavigate}
                        onAddChild={handleAddChildRequest}
                        onSelectEntity={(e) => handleEquipmentSelect(e as Equipment)}
                    />
                )}
            </>
        )}

        <FiberTracePanel />

        <div className="w-full h-full relative">
           <ErrorBoundary>
             <GponMap 
                center={center}
                shouldRecenter={shouldRecenter}
                userLocation={userCoords ? { location: userCoords, accuracy } : null}
                searchLocation={searchResult}
                onAddEquipment={handleAddEquipmentRequest}
                onEquipmentSelect={handleEquipmentSelect}
                onMapClick={handleMapClick}
                selectedEntity={selectedEntity}
                route={route}
                isDrawingMode={isDrawingCable}
                onDrawingFinish={handleDrawingFinish}
                onDrawingCancel={handleDrawingCancel}
                activeLayers={activeLayers}
             />
           </ErrorBoundary>
        </div>
      </div>

      {treeOpen && (
        <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full animate-in slide-in-from-right-10 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
              <Network size={18} className="text-iam-red dark:text-cyan-400" />
              {t('map.network_explorer')}
            </h2>
            <button onClick={() => setTreeOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
             <GponTreeView 
               equipments={equipments}
               selectedEntityId={selectedEntity?.id}
               onSelect={handleTreeSelect} 
             />
          </div>
        </div>
      )}

      {addModalOpen && addLocation && (
        <AddEquipmentModal 
          initialLocation={addLocation} 
          initialParent={addParentEntity}
          onClose={() => setAddModalOpen(false)} 
        />
      )}
      
      {addCableModalOpen && (
          <AddCableModal 
            onClose={() => setAddCableModalOpen(false)} 
            onStartDrawing={handleStartDrawing}
            manualDrawingData={manualCableData}
            draftState={cableDraft}
          />
      )}
    </div>
  );
};

export default MapPage;
