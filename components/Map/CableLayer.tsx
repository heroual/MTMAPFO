
import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { FiberCable, CableCategory, PhysicalEntity, EquipmentType, Equipment } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { FiberStandards } from '../../lib/fiber-standards';
import { useTranslation } from 'react-i18next';

interface CableLayerProps {
  map: L.Map;
  cables: FiberCable[];
  entities: Equipment[]; 
  onCableClick?: (cable: FiberCable) => void;
  onEdit?: (cable: FiberCable) => void;
  onDelete?: (cable: FiberCable) => void;
  visible: boolean;
  viewport?: L.LatLngBounds | null; 
}

const CableLayer: React.FC<CableLayerProps> = ({ map, cables, entities, onCableClick, onEdit, onDelete, visible, viewport }) => {
  const { t } = useTranslation();
  const { traceFiberPath } = useNetwork();
  const { profile } = useAuth();
  const layerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());

  const isViewer = profile?.role === 'viewer';

  useEffect(() => {
    if (!map) return;
    if (visible) {
      layerGroupRef.current.addTo(map);
    } else {
      layerGroupRef.current.remove();
    }
    return () => { layerGroupRef.current.remove(); };
  }, [map, visible]);

  // Optimization: Filter cables by viewport visibility
  const visibleCables = useMemo(() => {
    if (!viewport) return cables;
    return cables.filter(cable => {
        if (!cable.path || cable.path.length < 2) return true;
        return cable.path.some(p => viewport.contains([p.lat, p.lng]));
    });
  }, [cables, viewport]);

  useEffect(() => {
    if (!visible || !map) return;

    layerGroupRef.current.clearLayers();

    const entityMap = new Map<string, Equipment>();
    entities.forEach(e => entityMap.set(e.id, e));
    
    const cableMap = new Map<string, FiberCable>();
    visibleCables.forEach(c => cableMap.set(c.id, c));

    const getName = (id: string | null | undefined) => {
        if (!id || typeof id !== 'string') return '-';
        const realId = id.includes('::') ? id.split('::')[0] : id;
        return entityMap.get(realId)?.name || 'Unknown';
    };

    visibleCables.forEach(cable => {
      const isTransport = cable.category === CableCategory.TRANSPORT;
      const color = isTransport ? '#1e40af' : '#10b981';
      const weight = isTransport ? 4 : 3;
      const dashArray = cable.status === 'PLANNED' ? '5, 10' : undefined;

      const safePath = Array.isArray(cable.path) ? cable.path : [];
      const validPoints = safePath.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number');
      
      let latlngs: L.LatLngExpression[] = validPoints.map(p => [p.lat, p.lng]);
      
      if (latlngs.length < 2) {
          const sId = cable.startNodeId ? (cable.startNodeId.includes('::') ? cable.startNodeId.split('::')[0] : cable.startNodeId) : null;
          const eId = cable.endNodeId ? (cable.endNodeId.includes('::') ? cable.endNodeId.split('::')[0] : cable.endNodeId) : null;
          
          const startNode = sId ? entityMap.get(sId) : null;
          const endNode = eId ? entityMap.get(eId) : null;
          
          if (startNode?.location && endNode?.location) {
              latlngs = [[startNode.location.lat, startNode.location.lng], [endNode.location.lat, endNode.location.lng]];
          }
      }

      if (latlngs.length >= 2) {
        const polyline = L.polyline(latlngs, {
            color: color,
            weight: weight,
            opacity: 0.8,
            dashArray: dashArray,
            lineCap: 'round',
            lineJoin: 'round'
        });

        const hitBox = L.polyline(latlngs, {
            color: 'transparent',
            weight: 20,
            opacity: 0
        });

        const fiberMap = (cable.metadata as any)?.fibers || {};
        const traceTableRows = Array.from({length: Math.min(cable.fiberCount || 1, 8)}).map((_, i) => {
            const fib = i + 1;
            const mapInfo = fiberMap[fib];
            const struct = FiberStandards.getStructure(cable.cableType, fib);
            let destLabel = '-';
            
            if (mapInfo?.downstreamPort) {
                destLabel = `Port ${mapInfo.downstreamPort}`;
            } else if (mapInfo?.downstreamId) {
                destLabel = getName(mapInfo.downstreamId);
            } else {
                const eNodeId = cable.endNodeId ? (cable.endNodeId.includes('::') ? cable.endNodeId.split('::')[0] : cable.endNodeId) : null;
                const endNode = eNodeId ? entityMap.get(eNodeId) : null;
                if (endNode) {
                    destLabel = endNode.name;
                    if (endNode.type === EquipmentType.JOINT || endNode.type === EquipmentType.CHAMBER) {
                        const splices = (endNode as any).metadata?.splices || [];
                        const splice = splices.find((s: any) => 
                           (s.cableIn === cable.id && s.fiberIn === fib) || 
                           (s.cableOut === cable.id && s.fiberOut === fib)
                        );
                        if (splice) {
                            const nextId = splice.cableIn === cable.id ? splice.cableOut : splice.cableIn;
                            const nextName = cableMap.get(nextId)?.name || 'Unknown';
                            destLabel += ` → ${nextName}`;
                        }
                    }
                }
            }

            return `
              <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td class="py-2 px-2 font-mono font-bold text-center text-slate-500 text-[10px]">${fib}</td>
                <td class="py-2 px-2 text-center">
                    <div class="flex items-center justify-center gap-1" title="${struct.tubeColor.name} / ${struct.fiberColor.name}">
                       <span class="w-2 h-4 rounded-sm border border-black/10" style="background-color: ${struct.fiberColor.hex}"></span>
                    </div>
                </td>
                <td class="py-2 px-2 text-[10px] font-medium text-slate-700 truncate max-w-[120px]" title="${destLabel}">
                    ${destLabel}
                </td>
                <td class="py-2 px-2 text-center">
                   <button 
                      onclick="window.dispatchEvent(new CustomEvent('trace-request', { detail: { cableId: '${cable.id}', fiberId: ${fib} } }))"
                      class="px-2 py-1 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 rounded text-[9px] font-bold shadow-sm transition-colors"
                   >
                     Trace
                   </button>
                </td>
              </tr>
            `;
        }).join('');

        const popupContent = `
            <div class="font-sans min-w-[260px]">
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div>
                        <span class="text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase" style="background-color: ${color}">
                            ${cable.category}
                        </span>
                        <div class="text-sm font-bold text-slate-900 mt-1 leading-tight">${cable.name}</div>
                    </div>
                    <div class="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        ${cable.fiberCount} FO
                    </div>
                </div>
                
                <table class="w-full text-left border-collapse mb-3">
                    <thead class="bg-slate-50 text-slate-400 text-[9px] uppercase font-bold">
                        <tr>
                            <th class="py-1 px-2 text-center">#</th>
                            <th class="py-1 px-2 text-center">Col</th>
                            <th class="py-1 px-2">Dest</th>
                            <th class="py-1 px-2 text-center">Act</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${traceTableRows}
                    </tbody>
                </table>

                <button id="btn-full-${cable.id}" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-md transition-colors flex items-center justify-center gap-2 ${isViewer ? 'mb-0' : 'mb-2'}">
                    ${t('common.view')} <span>→</span>
                </button>

                ${!isViewer ? `
                <div class="flex gap-2 pt-2 border-t border-slate-100">
                    <button id="btn-edit-cbl-${cable.id}" class="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded transition-colors">${t('map_popup.edit')}</button>
                    <button id="btn-del-cbl-${cable.id}" class="flex-1 py-1 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-bold rounded transition-colors">${t('map_popup.delete')}</button>
                </div>
                ` : ''}
            </div>
        `;

        hitBox.bindPopup(popupContent, { minWidth: 260, className: 'clean-popup', offset: [0, -10] });

        hitBox.on('popupopen', () => {
            const btn = document.getElementById(`btn-full-${cable.id}`);
            if (btn) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    map.closePopup();
                    if (onCableClick) onCableClick(cable);
                };
            }
            if (!isViewer) {
              const btnEdit = document.getElementById(`btn-edit-cbl-${cable.id}`);
              if (btnEdit && onEdit) btnEdit.onclick = () => { map.closePopup(); onEdit(cable); };
              const btnDel = document.getElementById(`btn-del-cbl-${cable.id}`);
              if (btnDel && onDelete) btnDel.onclick = () => { map.closePopup(); onDelete(cable); };
            }
        });

        hitBox.on('mouseover', () => polyline.setStyle({ weight: weight + 4, opacity: 1 }));
        hitBox.on('mouseout', () => polyline.setStyle({ weight: weight, opacity: 0.8 }));

        layerGroupRef.current.addLayer(polyline);
        layerGroupRef.current.addLayer(hitBox);
      }
    });

  }, [visibleCables, entities, visible, onCableClick, onEdit, onDelete, t, profile, map]);

  useEffect(() => {
      const handler = (e: any) => traceFiberPath(e.detail.cableId, e.detail.fiberId);
      window.addEventListener('trace-request', handler);
      return () => window.removeEventListener('trace-request', handler);
  }, [traceFiberPath]);

  return null;
};

export default CableLayer;
