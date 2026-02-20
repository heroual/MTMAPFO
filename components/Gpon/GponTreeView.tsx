
import React, { useState, useMemo, useEffect } from 'react';
import { Server, CircuitBoard, Cable, Network, Box, ChevronRight, ChevronDown, Building, Search, Activity, AlertCircle, X, User, CircleDot, AlertTriangle } from 'lucide-react';
import { Equipment, EquipmentType, EquipmentStatus } from '../../types';
import { EquipmentArchitectureFactory } from '../../lib/factory/equipment-architecture';
import { OperationalStatusEngine } from '../../lib/operational-status';

interface GponTreeViewProps {
  equipments: Equipment[];
  selectedEntityId?: string | null;
  onSelect: (id: string, type: string) => void;
}

interface TreeNodeProps {
  item: Equipment;
  level: number;
  allEquipments: Equipment[];
  onSelect: (id: string, type: string) => void;
  selectedEntityId: string | null;
  searchTerm: string;
  autoExpandIds: Set<string>;
}

// Optimization: Memoized TreeNode to prevent heavy re-renders of the entire tree
const TreeNode: React.FC<TreeNodeProps> = React.memo(({ item, level, allEquipments, onSelect, selectedEntityId, searchTerm, autoExpandIds }) => {
  const isSelected = selectedEntityId === item.id;
  const { percent, isSaturated } = useMemo(() => OperationalStatusEngine.computeSaturation(item), [item]);
  
  const children = useMemo(() => {
    const virtual = EquipmentArchitectureFactory.getChildren(item);
    const physical = allEquipments.filter(e => e.parentId === item.id && !e.isDeleted);
    
    if (item.type === EquipmentType.GPON_PORT) {
        const splittersLinked = allEquipments.filter(e => 
            e.type === EquipmentType.SPLITTER && 
            (e.parentId === item.id || (e as any).portId === item.id) &&
            !e.isDeleted
        );
        return [...virtual, ...physical, ...splittersLinked];
    }

    if (item.type === EquipmentType.SPLITTER) {
        const connections = item.metadata?.connections || {};
        const pcoIds = new Set(Object.values(connections).filter((c: any) => c.status === 'USED').map((c: any) => c.connectedToId));
        const linkedPcos = allEquipments.filter(e => pcoIds.has(e.id) && !e.isDeleted);
        const merged = [...physical];
        linkedPcos.forEach(p => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
        return merged;
    }

    if (item.type === EquipmentType.PCO) {
        const pcoPorts = (item as any).ports || [];
        return pcoPorts.map((p: any) => ({
            id: `${item.id}::CLIENT::${p.id}`,
            name: p.client ? p.client.login : `FO #${p.id} (Libre)`,
            type: p.client ? EquipmentType.CLIENT : EquipmentType.FREE_PORT,
            status: p.client ? EquipmentStatus.AVAILABLE : EquipmentStatus.PLANNED,
            parentId: item.id,
            isVirtual: true
        }));
    }

    return [...virtual, ...physical];
  }, [item, allEquipments]);

  const matchesSearch = searchTerm ? (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) : false;
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (searchTerm && matchesSearch) setIsOpen(true);
    else if (autoExpandIds.has(item.id)) setIsOpen(true);
  }, [searchTerm, matchesSearch, autoExpandIds, item.id]);

  const getIcon = () => {
    switch (item.type) {
      case EquipmentType.SITE: return <Building size={14} />;
      case EquipmentType.OLT_BIG:
      case EquipmentType.OLT_MINI:
      case EquipmentType.MSAN: return <Server size={14} />;
      case EquipmentType.SLOT: return <div className="font-mono text-[9px] border border-current px-1 rounded-sm opacity-70">S</div>;
      case EquipmentType.BOARD: return <CircuitBoard size={14} />;
      case EquipmentType.GPON_PORT: return <Cable size={14} />;
      case EquipmentType.SPLITTER: return <Network size={14} />;
      case EquipmentType.PCO: return <Box size={14} />;
      case EquipmentType.CLIENT: return <User size={12} className="text-emerald-500" />;
      case EquipmentType.FREE_PORT: return <CircleDot size={12} className="text-slate-400 opacity-50" />;
      default: return <Box size={14} />;
    }
  };

  if (searchTerm && !matchesSearch && children.length === 0) return null;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 mx-1 my-0.5 cursor-pointer rounded-lg transition-all ${
            isSelected 
            ? 'bg-blue-600 text-white shadow-md z-10' 
            : isSaturated 
                ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
        }`}
        style={{ marginLeft: `${level * 12}px` }}
        onClick={() => onSelect(item.id, item.type)}
      >
        <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-1">
          {children.length > 0 ? (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <div className="w-3" />}
        </div>
        
        <div className={`${isSelected ? 'text-white' : isSaturated ? 'text-rose-500' : 'text-slate-400'} shrink-0 w-4`}>
            {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : isSaturated ? 'text-rose-700 dark:text-rose-400' : ''}`}>
              {item.name}
            </span>
          
          <div className="flex items-center gap-1.5 shrink-0">
              {percent > 0 && item.type !== EquipmentType.CLIENT && item.type !== EquipmentType.FREE_PORT && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isSaturated ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                  }`}>
                      {isSaturated && <AlertTriangle size={8} />}
                      {percent}%
                  </span>
              )}
          </div>
        </div>
      </div>
      
      {isOpen && children.length > 0 && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-2 w-px bg-slate-200 dark:bg-slate-800" style={{ marginLeft: `${level * 12 + 13}px` }} />
          <div>
            {children.map((child) => (
              <TreeNode 
                  key={child.id} item={child as Equipment} level={level + 1} 
                  allEquipments={allEquipments} onSelect={onSelect} 
                  selectedEntityId={selectedEntityId} searchTerm={searchTerm} autoExpandIds={autoExpandIds}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
    // Custom comparison for high-performance tree
    return prev.selectedEntityId === next.selectedEntityId && 
           prev.searchTerm === next.searchTerm && 
           prev.item.id === next.item.id &&
           prev.item.status === next.item.status &&
           prev.allEquipments.length === next.allEquipments.length;
});

const GponTreeView: React.FC<GponTreeViewProps> = ({ equipments, selectedEntityId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const autoExpandIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedEntityId) return ids;
    const realId = selectedEntityId.includes('::') ? selectedEntityId.split('::')[0] : selectedEntityId;
    let current = equipments.find(e => e.id === realId);
    while (current && current.parentId) {
        ids.add(current.parentId);
        current = equipments.find(e => e.id === current.parentId);
    }
    return ids;
  }, [selectedEntityId, equipments]);

  const roots = useMemo(() => equipments.filter(e => !e.parentId && !e.isVirtual), [equipments]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrer structure..." 
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-9 text-xs focus:border-blue-500 outline-none shadow-sm" 
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {roots.map(root => (
            <TreeNode 
                key={root.id} item={root} level={0} 
                allEquipments={equipments} onSelect={onSelect} 
                selectedEntityId={selectedEntityId || null} searchTerm={searchTerm} autoExpandIds={autoExpandIds}
            />
        ))}
      </div>
    </div>
  );
};

export default GponTreeView;
