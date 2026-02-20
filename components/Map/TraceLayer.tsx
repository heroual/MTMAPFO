
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useNetwork } from '../../context/NetworkContext';

interface TraceLayerProps {
  map: L.Map;
}

const TraceLayer: React.FC<TraceLayerProps> = ({ map }) => {
  const { traceResult } = useNetwork();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    layerGroupRef.current = L.layerGroup().addTo(map);
    return () => {
      layerGroupRef.current?.remove();
    };
  }, [map]);

  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    if (!traceResult || !traceResult.segments) return;

    const cableSegments = traceResult.segments.filter(s => s.type === 'CABLE' && s.geometry);
    const nodes = traceResult.segments.filter(s => s.type === 'NODE' || s.type === 'ENDPOINT' || s.type === 'SPLICE');

    // 1. Dessiner les segments de câbles avec étiquettes
    cableSegments.forEach((seg) => {
        if (!seg.geometry || seg.geometry.length < 2) return;
        const latlngs = seg.geometry.map(p => [p.lat, p.lng] as [number, number]);
        
        // Ligne de lueur (Glow)
        L.polyline(latlngs, {
            color: '#22d3ee',
            weight: 10,
            opacity: 0.2,
            lineCap: 'round'
        }).addTo(layerGroupRef.current!);

        // Ligne principale animée
        const polyline = L.polyline(latlngs, {
            color: '#0891b2',
            weight: 4,
            opacity: 1,
            dashArray: '10, 10',
            className: 'trace-line-animation'
        });

        // Étiquette flottante sur le câble (Measurement + Name)
        const midpoint = latlngs[Math.floor(latlngs.length / 2)];
        const fiberLabel = seg.fiberIndex ? ` [FO#${seg.fiberIndex}]` : '';
        
        // On crée un label personnalisé pour le segment
        const labelHtml = `
            <div class="trace-segment-label">
                <span class="segment-name">${seg.entityName}${fiberLabel}</span>
                <span class="segment-dist">${seg.fiberColor ? '●' : ''} TRAÇAGE ACTIF</span>
            </div>
        `;

        polyline.bindTooltip(labelHtml, {
            permanent: true,
            direction: 'center',
            className: 'gis-trace-tooltip',
            sticky: true
        });

        polyline.addTo(layerGroupRef.current!);
    });

    // 2. Dessiner les points d'intérêt (Noeuds/Soudures)
    nodes.forEach(node => {
        if (!node.location) return;
        
        const isEndpoint = node.type === 'ENDPOINT';
        const color = isEndpoint ? '#e30613' : '#0891b2';
        
        const marker = L.circleMarker([node.location.lat, node.location.lng], {
            radius: isEndpoint ? 8 : 5,
            color: '#fff',
            fillColor: color,
            fillOpacity: 1,
            weight: 2,
            className: isEndpoint ? 'animate-pulse' : ''
        });

        marker.bindTooltip(`
            <div class="node-trace-tooltip">
                <div class="node-type">${node.entityType}</div>
                <div class="node-name">${node.entityName}</div>
            </div>
        `, { direction: 'top', offset: [0, -5] });

        marker.addTo(layerGroupRef.current!);
    });

    // 3. Ajuster la vue
    if (cableSegments.length > 0) {
       const allPoints = cableSegments.flatMap(s => s.geometry!).map(p => [p.lat, p.lng] as [number, number]);
       if (allPoints.length > 0) {
           map.fitBounds(L.latLngBounds(allPoints), { 
               padding: [100, 100], 
               maxZoom: 18,
               animate: true,
               duration: 1.5
           });
       }
    }

  }, [traceResult, map]);

  return (
    <style>{`
      @keyframes dash-move {
        to {
          stroke-dashoffset: -20;
        }
      }
      .trace-line-animation {
        animation: dash-move 1s linear infinite;
      }
      
      .gis-trace-tooltip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid #22d3ee !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          font-family: 'JetBrains Mono', monospace !important;
          pointer-events: none !important;
      }
      
      .gis-trace-tooltip:before {
          display: none !important;
      }

      .trace-segment-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
      }

      .segment-name {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
      }

      .segment-dist {
          font-size: 9px;
          color: #22d3ee;
          font-weight: 600;
      }

      .node-trace-tooltip {
          padding: 2px;
          min-width: 100px;
      }

      .node-type {
          font-size: 8px;
          color: #94a3b8;
          font-weight: 800;
          text-transform: uppercase;
      }

      .node-name {
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
      }

      .dark .node-name {
          color: white;
      }
    `}</style>
  );
};

export default TraceLayer;
