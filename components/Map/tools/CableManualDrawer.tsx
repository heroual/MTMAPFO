
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Undo, Check, X, MousePointer2 } from 'lucide-react';
import L from 'leaflet';
import { Coordinates, EquipmentType, PhysicalEntity } from '../../../types';
import { CablingRules } from '../../../lib/cabling-rules';
import { useTranslation } from 'react-i18next';

interface ManualDrawingResult {
  path: Coordinates[];
  chambers: { index: number; type: EquipmentType }[];
  distance: number;
}

interface CableManualDrawerProps {
  map: L.Map;
  startEntity: PhysicalEntity;
  endEntity: PhysicalEntity;
  onFinish: (result: ManualDrawingResult) => void;
  onCancel: () => void;
}

const CableManualDrawer: React.FC<CableManualDrawerProps> = ({ map, startEntity, endEntity, onFinish, onCancel }) => {
  const { t } = useTranslation();
  
  // Le premier point est figé sur la source
  const [points, setPoints] = useState<Coordinates[]>([startEntity.location]);
  const [specialNodes, setSpecialNodes] = useState<{ index: number; type: EquipmentType }[]>([]);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    layerGroupRef.current = L.layerGroup().addTo(map);
    return () => { layerGroupRef.current?.remove(); };
  }, [map]);

  const totalDistance = useMemo(() => {
      // On simule la distance avec le point d'arrivée final même s'il n'est pas encore "cliqué"
      const currentPath = [...points, endEntity.location];
      return CablingRules.calculateLength(currentPath);
  }, [points, endEntity]);

  useEffect(() => {
    if (!map) return;
    const handleClick = (e: L.LeafletMouseEvent) => {
      if ((e.originalEvent.target as HTMLElement).closest('.drawing-toolbar')) return;
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPoints(prev => [...prev, newPoint]);
    };

    map.on('click', handleClick);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [map]);

  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    // 1. Dessiner la ligne de projet (Source -> Points cliqués -> Cible)
    const fullPath = [...points, endEntity.location];
    const latlngs = fullPath.map(p => [p.lat, p.lng] as [number, number]);
    
    L.polyline(latlngs, {
        color: '#ec4899', 
        weight: 4,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(layerGroupRef.current);

    // 2. Dessiner les points
    fullPath.forEach((pt, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === fullPath.length - 1;
        
        L.circleMarker([pt.lat, pt.lng], {
            radius: (isStart || isEnd) ? 6 : 4,
            color: '#fff',
            fillColor: isStart ? '#3b82f6' : (isEnd ? '#10b981' : '#ec4899'),
            fillOpacity: 1,
            weight: 2
        }).addTo(layerGroupRef.current!);
    });
  }, [points, endEntity]);

  const handleFinish = () => {
      // On ferme le tracé sur la destination exacte
      const finalPath = [...points, endEntity.location];
      onFinish({
          path: finalPath,
          chambers: specialNodes,
          distance: CablingRules.calculateLength(finalPath)
      });
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] drawing-toolbar flex flex-col items-center gap-3">
        <div className="bg-slate-900/95 text-white px-5 py-2 rounded-2xl text-xs font-bold backdrop-blur shadow-2xl border border-pink-500/30 flex items-center gap-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="truncate max-w-[100px]">{startEntity.name}</span>
            </div>
            <ArrowRight size={14} className="text-slate-500" />
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="truncate max-w-[100px]">{endEntity.name}</span>
            </div>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <span className="text-pink-400 font-mono">{Math.round(totalDistance)}m</span>
        </div>

        <div className="glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2 bg-slate-900/90">
            <button onClick={handleFinish} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <Check size={16} /> VALIDER LE TRACÉ
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1" />
            <button onClick={() => setPoints(p => p.length > 1 ? p.slice(0, -1) : p)} className="p-2.5 text-slate-400 hover:text-white transition-colors"><Undo size={18} /></button>
            <button onClick={onCancel} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"><X size={18} /></button>
        </div>
    </div>
  );
};

const ArrowRight = ({size, className}: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;

export default CableManualDrawer;
