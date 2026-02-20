
import React from 'react';
import { EquipmentType, EquipmentStatus } from '../../types';

// --- RAW SVG PATHS (Professional GIS Glyphs) ---
const SVGS = {
  SITE: `<path d="M12 2l10 6v10l-10 6-10-6V8l10-6z" fill="currentColor" opacity="0.1"/><path d="M12 22V12M12 12L2 6M12 12l10-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/>`,
  OLT: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  MSAN: `<path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 4v16M15 4v16" stroke="currentColor" stroke-width="1.5" opacity="0.6"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/>`,
  SPLITTER: `<path d="M12 22V12M12 12L4 4M12 12l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>`,
  PCO: `<rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/>`,
  JOINT: `<path d="M12 2l10 10-10 10L2 12 12 2z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/>`,
  CHAMBER: `<rect x="5" y="5" width="14" height="14" rx="1" stroke="currentColor" stroke-width="2" fill="none"/><line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>`,
  DEFAULT: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/>`
};

export const getStatusColor = (status: EquipmentStatus): string => {
  switch(status) {
    case EquipmentStatus.AVAILABLE: return '#10b981';
    case EquipmentStatus.WARNING: return '#f59e0b';
    case EquipmentStatus.SATURATED: return '#f43f5e';
    case EquipmentStatus.MAINTENANCE: return '#3b82f6';
    case EquipmentStatus.OFFLINE: return '#64748b';
    case EquipmentStatus.DECOMMISSIONED: return '#1e293b';
    default: return '#94a3b8';
  }
};

/**
 * Generates exact sizing info for GponMap Leaflet Anchor
 */
export const getMarkerDimensions = (type: EquipmentType, isSelected: boolean) => {
  let size = isSelected ? 40 : 32;
  if (type === EquipmentType.SITE) size = isSelected ? 56 : 48;
  if (type === EquipmentType.CHAMBER) size = isSelected ? 32 : 24;
  
  // Selected markers use a "Pin" style with a triangle pointing down
  // We add 8px height for the triangle tip
  const totalHeight = isSelected ? size + 8 : size;
  
  return { 
    width: size, 
    height: totalHeight,
    // For non-selected (circles), anchor is center
    // For selected (pins), anchor is at the very bottom center tip
    anchorX: size / 2,
    anchorY: isSelected ? totalHeight : size / 2
  };
};

export const getMarkerHtml = (type: EquipmentType, status: EquipmentStatus, isSelected: boolean): string => {
  const { width, height } = getMarkerDimensions(type, isSelected);
  const svgContent = SVGS[type as keyof typeof SVGS] || SVGS.DEFAULT;
  const color = getStatusColor(status);
  const baseColor = isSelected ? '#ffffff' : '#f8fafc';
  const iconColor = isSelected ? '#0f172a' : (type === EquipmentType.CHAMBER ? '#64748b' : '#334155'); 
  
  // Glyph scale
  const iconScale = Math.round(width * 0.6);

  let badgeHtml = '';
  if ((type === EquipmentType.PCO || type === EquipmentType.SPLITTER) && status === EquipmentStatus.SATURATED) {
    badgeHtml = `<div class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white shadow-sm">!</div>`;
  }

  return `
    <div class="relative flex flex-col items-center" style="width: ${width}px; height: ${height}px;">
      <!-- Halo Pulsant for Issues -->
      ${(status === EquipmentStatus.WARNING || status === EquipmentStatus.SATURATED) ? 
        `<div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${color}; width: ${width}px; height: ${width}px;"></div>` : ''}
      
      <!-- Main Marker Body -->
      <div class="relative flex items-center justify-center rounded-${type === EquipmentType.CHAMBER ? 'md' : 'full'} shadow-xl border-2 transition-transform"
           style="
             width: ${width}px; 
             height: ${width}px; 
             background-color: ${baseColor}; 
             border-color: ${isSelected ? color : 'rgba(255,255,255,0.9)'};
             z-index: 2;
           ">
        
        <svg width="${iconScale}" height="${iconScale}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: ${iconColor}">
          ${svgContent}
        </svg>

        ${badgeHtml}

        <!-- Status Dot (if not saturated or chamber) -->
        ${!badgeHtml && type !== EquipmentType.CHAMBER ? `
        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
             style="background-color: ${color};">
        </div>
        ` : ''}
      </div>
      
      <!-- Pin Pointer (Only when selected) -->
      ${isSelected ? `
        <div class="z-10 -mt-1" style="color: ${color}">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
            <path d="M8 10L0 0H16L8 10Z"/>
          </svg>
        </div>
      ` : ''}
    </div>
  `;
};

// --- REACT COMPONENTS ---
interface IconProps { className?: string; size?: number; color?: string; }

export const IconCentrale: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.SITE}} />
);
export const IconOLT: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.OLT}} />
);
export const IconCabinet: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.MSAN}} />
);
export const IconSplitter: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.SPLITTER}} />
);
export const IconPCO: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.PCO}} />
);
export const IconJoint: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.JOINT}} />
);
export const IconChamber: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}} dangerouslySetInnerHTML={{__html: SVGS.CHAMBER}} />
);
export const IconUser: React.FC<IconProps> = ({ className, size=24, color='currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{color}}>
     <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
export const IconBuilding = IconCentrale;
