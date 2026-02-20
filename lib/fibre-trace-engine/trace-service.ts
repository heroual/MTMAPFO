
import { NetworkState, FiberCable, Equipment, EquipmentType, TraceResult, FiberSegment, Coordinates, ClientProfile } from '../../types';
import { OpticalCalculator, OpticalConstants } from '../optical-calculation';
import { FiberStandards } from '../fiber-standards';

export const TraceService = {
  /**
   * Remonte la chaîne de continuité pour trouver l'origine réelle du signal (Port OLT)
   */
  findSignalOrigin: (cableId: string, fiberIdx: number, network: NetworkState): { cableId: string, fiberIdx: number, foundSource: boolean } => {
      let currentCableId = cableId;
      let currentFiberIdx = fiberIdx;
      let iterations = 0;

      while (iterations < 20) {
          iterations++;
          const cable = network.cables.find(c => c.id === currentCableId);
          if (!cable) break;

          const fiberMeta = cable.metadata?.fibers?.[currentFiberIdx];
          const upstream = fiberMeta?.upstreamPort;

          if (!upstream) break; // Pas de continuité amont

          if (upstream.startsWith('SPLICE:')) {
              // C'est une soudure, on remonte au câble précédent
              const parts = upstream.split(':');
              currentCableId = parts[1];
              currentFiberIdx = parseInt(parts[2]);
          } else {
              // C'est un port physique (OLT/MSAN), on a trouvé la source
              return { cableId: currentCableId, fiberIdx: currentFiberIdx, foundSource: true };
          }
      }
      // Si on arrive ici, on n'a pas trouvé d'OLT mais on a peut-être un point de départ cohérent
      return { cableId: currentCableId, fiberIdx: currentFiberIdx, foundSource: iterations > 1 };
  },

  traceFiber: async (
    startCableId: string, 
    fiberIndex: number, 
    network: NetworkState
  ): Promise<TraceResult> => {
    // Simulation légère de calcul
    await new Promise(resolve => setTimeout(resolve, 400));

    // ÉTAPE 0 : REMONTER À LA SOURCE SI POSSIBLE
    const origin = TraceService.findSignalOrigin(startCableId, fiberIndex, network);
    
    let currentCableId = origin.cableId;
    let currentFiberIdx = origin.fiberIdx;
    
    const segments: FiberSegment[] = [];
    let totalDistance = 0;
    let totalLoss = 0;
    let isTracing = true;
    let iterations = 0;
    let status: 'CONNECTED' | 'BROKEN' | 'UNUSED' = origin.foundSource ? 'CONNECTED' : 'UNUSED';
    let endPointData: any = { type: 'OPEN', name: 'Extrémité libre' };

    let currentCable = network.cables.find(c => c.id === currentCableId);
    if (!currentCable) throw new Error("Câble initial introuvable");

    // ÉTAPE 1 : IDENTIFIER LA TÊTE DE LIGNE (SOURCE)
    const firstNodeId = currentCable.startNodeId.split('::')[0];
    const firstNode = network.equipments.find(e => e.id === firstNodeId);

    if (firstNode) {
        const fiberMapping = currentCable.metadata?.fibers?.[currentFiberIdx];
        const upstream = fiberMapping?.upstreamPort;
        
        let sourceLabel = firstNode.name;
        let entityType = firstNode.type as string;
        let meta = 'Origine du signal';

        if (upstream && !upstream.startsWith('SPLICE:')) {
            sourceLabel = `${firstNode.name} (${upstream})`;
            entityType = 'PORT ACTIF OLT/MSAN';
            meta = 'Signal optique injecté';
            status = 'CONNECTED';
        }

        segments.push({
            id: 'source-node',
            type: 'NODE',
            entityName: sourceLabel,
            entityId: firstNode.id,
            entityType: entityType,
            location: firstNode.location,
            meta: meta
        });
    }

    // ÉTAPE 2 : PARCOURIR LA CHAÎNE VERS L'AVAL
    while (isTracing && iterations < 50) {
      iterations++;
      
      // Ajouter le segment de câble actuel
      totalDistance += currentCable!.lengthMeters;
      totalLoss += OpticalCalculator.calculateFiberLoss(currentCable!.lengthMeters);
      segments.push(createCableSegment(currentCable!, currentFiberIdx));

      const endNodeId = currentCable!.endNodeId.split('::')[0];
      const endNode = network.equipments.find(e => e.id === endNodeId);

      if (!endNode) {
        if (status === 'CONNECTED') status = 'BROKEN';
        break;
      }

      // Cas 1: Terminaison (PCO ou Splitter)
      if (endNode.type === EquipmentType.PCO || endNode.type === EquipmentType.SPLITTER) {
          if (endNode.type === EquipmentType.PCO) {
              const pcoPorts = (endNode as any).ports || [];
              const fiberMeta = currentCable!.metadata?.fibers?.[currentFiberIdx];
              const pcoPortIdx = parseInt(fiberMeta?.downstreamPort || "0");
              const client = pcoPorts.find((p: any) => p.id === pcoPortIdx)?.client;

              endPointData = { 
                  type: 'CLIENT', 
                  name: client ? `Abonné : ${client.login}` : `Port PCO #${pcoPortIdx}` 
              };
              
              segments.push({
                  id: `endpoint-${endNode.id}`,
                  type: 'ENDPOINT',
                  entityName: endPointData.name,
                  entityId: endNode.id,
                  entityType: 'TERMINAISON PCO',
                  location: endNode.location,
                  meta: client ? `Client : ${client.name}` : 'Port libre'
              });
          } else {
              const splitLoss = OpticalCalculator.getSplitterLoss(endNode.metadata?.ratio || '1:32');
              totalLoss += splitLoss;
              segments.push({
                  id: `node-${endNode.id}`,
                  type: 'NODE',
                  entityName: `${endNode.name} (Entrée)`,
                  entityId: endNode.id,
                  entityType: 'SPLITTER',
                  location: endNode.location,
                  meta: `Division optique (-${splitLoss}dB)`
              });
              endPointData = { type: 'OLT', name: 'Répartition Splitter' };
          }
          isTracing = false;
          break;
      }

      // Cas 2: Boîte de raccordement (Splicing)
      if (endNode.type === EquipmentType.JOINT) {
          totalLoss += OpticalConstants.SPLICE_LOSS;
          const splices = endNode.metadata?.splices || [];
          
          // Trouver la soudure sortante correspondant à l'entrée actuelle
          const nextSplice = splices.find((s: any) => 
              (s.cableIn === currentCable!.id && s.fiberIn === currentFiberIdx) || 
              (s.cableOut === currentCable!.id && s.fiberOut === currentFiberIdx)
          );

          if (nextSplice) {
              const isForward = nextSplice.cableIn === currentCable!.id;
              const nextCableId = isForward ? nextSplice.cableOut : nextSplice.cableIn;
              const nextFiberIdx = isForward ? nextSplice.fiberOut : nextSplice.fiberIn;
              
              const nextCable = network.cables.find(c => c.id === nextCableId && !c.isDeleted);
              if (nextCable) {
                  segments.push({
                      id: `joint-${endNode.id}-${iterations}`,
                      type: 'SPLICE',
                      entityName: endNode.name,
                      entityId: endNode.id,
                      entityType: 'SOUDURE EN BOÎTE',
                      location: endNode.location,
                      meta: `Jonction : ${currentCable!.name} ➔ ${nextCable.name}`
                  });
                  currentCable = nextCable;
                  currentFiberIdx = nextFiberIdx;
                  continue; 
              }
          }
          
          // Si on est dans un joint mais sans soudure vers la suite
          status = status === 'CONNECTED' ? 'BROKEN' : 'UNUSED';
          isTracing = false;
      } else {
          // Autres (Chambre/Génie Civil)
          segments.push({
              id: `pass-${endNode.id}`,
              type: 'NODE',
              entityName: endNode.name,
              entityId: endNode.id,
              entityType: endNode.type,
              location: endNode.location,
              meta: 'Passage infrastructure'
          });
          isTracing = false;
      }
    }

    return {
      fiberId: fiberIndex,
      startCableId,
      segments,
      totalDistance,
      totalLossEst: parseFloat(totalLoss.toFixed(2)),
      status,
      endPoint: endPointData
    };
  }
};

const createCableSegment = (cable: FiberCable, fiberIdx: number): FiberSegment => {
  const structure = FiberStandards.getStructure(cable.cableType, fiberIdx);
  return {
    id: `seg-${cable.id}-${fiberIdx}`,
    type: 'CABLE',
    entityName: cable.name,
    entityId: cable.id,
    entityType: cable.category === 'TRANSPORT' ? 'CÂBLE TRANSPORT' : 'CÂBLE DISTRIBUTION',
    fiberIndex: fiberIdx,
    fiberColor: structure.fiberColor.hex,
    geometry: cable.path, 
    meta: `T:${structure.tubeId} (${structure.tubeColor.name}) • F:${fiberIdx} (${structure.fiberColor.name})`
  };
};
