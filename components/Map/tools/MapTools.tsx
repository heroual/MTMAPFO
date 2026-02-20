
import React, { useState } from 'react';
import L from 'leaflet';
import NavigationControls from './NavigationControls';
import StyleSwitcher from './StyleSwitcher';
import MeasureTool from './MeasureTool';
import MapContextMenu from './MapContextMenu';
import { Download, HardHat } from 'lucide-react';
import ExportNetworkModal from '../../Modals/ExportNetworkModal';
import FieldOperationModal from '../../Modals/FieldOperationModal';
import { useNetwork } from '../../../context/NetworkContext';
import { useAuth } from '../../../context/AuthContext';
import { Coordinates, OperationType } from '../../../types';

interface MapToolsProps {
  map: L.Map;
  isDrawing?: boolean;
}

const MapTools: React.FC<MapToolsProps> = ({ map, isDrawing = false }) => {
  const { startOperation } = useNetwork();
  const { profile } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOpModal, setShowOpModal] = useState(false);
  const [opLocation, setOpLocation] = useState<Coordinates | null>(null);

  const isViewer = profile?.role === 'viewer';
  const canExport = profile?.role === 'admin' || profile?.role === 'supervisor';

  const handleNewOperation = () => {
    if (isViewer) return;
    const center = map.getCenter();
    const coords = { lat: center.lat, lng: center.lng };
    
    // Initialisation vitale de l'opération dans le contexte global
    startOperation({
      name: `OP-${new Date().toLocaleDateString()}-${new Date().getHours()}h${new Date().getMinutes()}`,
      type: OperationType.INFRA_BUILD,
      location: coords,
      zone: "Zone Active"
    });

    setOpLocation(coords);
    setShowOpModal(true);
  };

  return (
    <>
      {/* Right Toolbar */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[400] flex flex-col gap-4 transition-opacity duration-300">
        <NavigationControls map={map} />
        
        {!isDrawing && (
          <>
            <div className="h-px bg-slate-700/50 w-full" />
            <MeasureTool map={map} />
            
            {/* New Operation Button - Hidden for viewers */}
            {!isViewer && (
              <button 
                onClick={handleNewOperation}
                className="glass-panel p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-slate-900"
                title="New Field Operation"
              >
                <HardHat size={20} />
              </button>
            )}

            {/* Export Button - Only for admin/supervisor */}
            {canExport && (
              <button 
                onClick={() => setShowExportModal(true)}
                className="glass-panel p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors bg-white dark:bg-slate-900"
                title="Export Network Data"
              >
                <Download size={20} />
              </button>
            )}

            <div className="h-px bg-slate-700/50 w-full" />
            <StyleSwitcher map={map} />
          </>
        )}
      </div>

      {/* Context Menu Overlay */}
      {!isDrawing && <MapContextMenu map={map} />}

      {/* Export Modal */}
      {showExportModal && (
        <ExportNetworkModal onClose={() => setShowExportModal(false)} />
      )}
      
      {/* Field Operation Modal */}
      {showOpModal && (
        <FieldOperationModal initialLocation={opLocation} onClose={() => setShowOpModal(false)} />
      )}

      <style>{`
        .leaflet-control-scale-line {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(148, 163, 184, 0.2) !important;
          color: #94a3b8 !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 10px !important;
          text-shadow: none !important;
        }
      `}</style>
    </>
  );
};

export default MapTools;
