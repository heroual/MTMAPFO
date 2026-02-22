
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PCO, OLT, Splitter, GponPort, Coordinates, EquipmentType, EquipmentStatus, RouteDetails, MSAN, FiberCable, Equipment } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import L from 'leaflet';
import MapTools from './tools/MapTools';
import RouteLayer from './RouteLayer';
import CableLayer from './CableLayer';
import TraceLayer from './TraceLayer';
import { getMarkerHtml, getMarkerDimensions } from '../Icons/NetworkIcons';

interface GponMapProps {
  center: Coordinates;
  onAddEquipment?: (coords: Coordinates) => void;
  onEquipmentSelect?: (entity: Equipment | FiberCable) => void;
  selectedEntity?: Equipment | FiberCable | null;
  route?: RouteDetails | null;
  highlightLocation?: Coordinates | null;
  userLocation?: any;
  searchLocation?: any;
  shouldRecenter?: boolean;
  isDrawingMode?: boolean;
  onDrawingFinish?: (result: any) => void;
  onDrawingCancel?: () => void;
  onMapClick?: (coords: Coordinates) => void; 
  activeLayers?: Record<string, boolean>;
}

const GponMap: React.FC<GponMapProps> = ({ 
  center, onAddEquipment, onEquipmentSelect, selectedEntity, route, highlightLocation, searchLocation, shouldRecenter,
  isDrawingMode, onDrawingFinish, onDrawingCancel, onMapClick, activeLayers = { olt: true, splitter: true, pco: true, msan: true, site: true, joint: true, cable: true }
}) => {
  const { sites, msans, olts, splitters, pcos, joints, chambers, cables, equipments } = useNetwork();
  const { profile } = useAuth();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [viewport, setViewport] = useState<L.LatLngBounds | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const searchMarkerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const draftRef = useRef<L.LayerGroup>(new L.LayerGroup());

  const isViewer = profile?.role === 'viewer';

  // 1. Initialisation stable
  useEffect(() => {
    if (mapContainer.current && !mapInstanceRef.current) {
      const mapInstance = L.map(mapContainer.current, { 
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true 
      }).setView([center.lat, center.lng], 16);
      
      mapInstanceRef.current = mapInstance;
      
      // CRITIQUE: On expose l'instance pour les modales sœurs (comme AddCableModal)
      (window as any).L_MAP_INSTANCE = mapInstance;
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);
      markersRef.current.addTo(mapInstance);
      searchMarkerRef.current.addTo(mapInstance);
      draftRef.current.addTo(mapInstance);

      let timer: any;
      const updateBounds = () => {
        clearTimeout(timer);
        timer = setTimeout(() => setViewport(mapInstance.getBounds()), 100);
      };

      mapInstance.on('moveend', updateBounds);
      mapInstance.on('zoomend', updateBounds);

      setMap(mapInstance);
      setViewport(mapInstance.getBounds());
    }
    
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            delete (window as any).L_MAP_INSTANCE;
        }
    };
  }, []);

  // 2. Filtrage des équipements par Viewport
  const visibleEntities = useMemo(() => {
    const all = [...sites, ...msans, ...olts, ...splitters, ...pcos, ...joints, ...chambers];
    if (!viewport) return all.slice(0, 50);

    return all.filter(entity => {
      if (!entity.location || entity.isDeleted) return false;
      
      if (entity.type === EquipmentType.SITE && !activeLayers.site) return false;
      if (entity.type === EquipmentType.MSAN && !activeLayers.msan) return false;
      if ([EquipmentType.OLT, EquipmentType.OLT_BIG, EquipmentType.OLT_MINI].includes(entity.type) && !activeLayers.olt) return false;
      if (entity.type === EquipmentType.SPLITTER && !activeLayers.splitter) return false;
      if (entity.type === EquipmentType.PCO && !activeLayers.pco) return false;
      if (entity.type === EquipmentType.JOINT && !activeLayers.joint) return false;

      return viewport.contains([entity.location.lat, entity.location.lng]);
    });
  }, [sites, msans, olts, splitters, pcos, joints, chambers, activeLayers, viewport]);

  // 3. Sync des Marqueurs
  useEffect(() => {
    if (!map) return;
    markersRef.current.clearLayers();
    
    visibleEntities.forEach(entity => {
      const isSel = selectedEntity?.id === entity.id;
      const html = getMarkerHtml(entity.type, entity.status, isSel);
      const { width, height, anchorX, anchorY } = getMarkerDimensions(entity.type, isSel);
      
      const icon = L.divIcon({ 
        className: 'bg-transparent', 
        html, 
        iconSize: [width, height], 
        iconAnchor: [anchorX, anchorY] 
      });
      
      const marker = L.marker([entity.location!.lat, entity.location!.lng], { 
        icon, 
        zIndexOffset: isSel ? 2000 : (entity.type === EquipmentType.SITE ? 1000 : 0) 
      });

      marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onEquipmentSelect?.(entity as any);
      });
      marker.addTo(markersRef.current);
    });
  }, [visibleEntities, selectedEntity, map, onEquipmentSelect]);

  // 4. Highlight Search Result
  useEffect(() => {
    if (!map) return;
    searchMarkerRef.current.clearLayers();

    if (searchLocation?.location) {
        const { lat, lng } = searchLocation.location;
        
        // Dynamic pulsant marker for search
        const html = `
          <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
            <div class="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25"></div>
            <div class="w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-lg relative z-10"></div>
          </div>
        `;

        const icon = L.divIcon({
            className: 'search-pin-icon',
            html,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        L.marker([lat, lng], { icon, zIndexOffset: 3000 }).addTo(searchMarkerRef.current);
    }
  }, [searchLocation, map]);

  // 5. Logic de clic et ÉVÉNEMENTS PERSONNALISÉS
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (onMapClick) onMapClick(coords);
        window.dispatchEvent(new CustomEvent('gpon-map-click', { detail: coords }));
    };

    const handleAddFromCtx = (e: any) => {
        if (isViewer) return;
        if (onAddEquipment) {
            onAddEquipment({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    };
    
    map.on('click', handleClick);
    map.on('equipment:add' as any, handleAddFromCtx);

    return () => { 
        map.off('click', handleClick); 
        map.off('equipment:add' as any, handleAddFromCtx);
    };
  }, [map, onMapClick, onAddEquipment, isViewer]);

  // Recentrage
  useEffect(() => {
    if (map && shouldRecenter) {
        map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 16), { animate: true, duration: 1 });
    }
  }, [center, shouldRecenter, map]);

  return (
    <div className="w-full h-full relative">
       <div ref={mapContainer} className="w-full h-full z-0 bg-slate-50" id="gpon-map-canvas" />
       {map && (
           <>
               <MapTools map={map} isDrawing={isDrawingMode} />
               <RouteLayer map={map} route={route} />
               <CableLayer 
                  map={map} 
                  cables={cables} 
                  entities={equipments} 
                  visible={activeLayers.cable} 
                  onCableClick={(cable) => onEquipmentSelect?.(cable)} 
                  viewport={viewport}
               />
               <TraceLayer map={map} />
           </>
       )}
    </div>
  );
};

export default GponMap;
