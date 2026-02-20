
import { NetworkState, EquipmentStatus, CableCategory, EquipmentType, RiskLevel } from '../types';

export const DashboardAnalytics = {
  /**
   * Calculate Global Network Totals
   */
  getTotals: (data: NetworkState) => {
    return {
      sites: data.sites.filter(x => !x.isDeleted).length,
      olts: data.olts.filter(x => !x.isDeleted).length,
      msans: data.msans.filter(x => !x.isDeleted).length,
      joints: data.joints.filter(x => !x.isDeleted).length,
      pcos: data.pcos.filter(x => !x.isDeleted).length,
      splitters: data.splitters.filter(x => !x.isDeleted).length,
      cables: data.cables.filter(x => !x.isDeleted).length,
    };
  },

  /**
   * Calculate Fiber Infrastructure Metrics (Lengths in km)
   */
  getFiberMetrics: (data: NetworkState) => {
    const activeCables = data.cables.filter(c => !c.isDeleted);
    
    const transportCables = activeCables.filter(c => c.category === CableCategory.TRANSPORT);
    const distributionCables = activeCables.filter(c => c.category === CableCategory.DISTRIBUTION);

    const transportLength = transportCables.reduce((acc, c) => acc + c.lengthMeters, 0);
    const distributionLength = distributionCables.reduce((acc, c) => acc + c.lengthMeters, 0);

    return {
      totalLengthKm: (transportLength + distributionLength) / 1000,
      transportKm: transportLength / 1000,
      distributionKm: distributionLength / 1000,
      transportCount: transportCables.length,
      distributionCount: distributionCables.length
    };
  },

  /**
   * Calculate Port Utilization & Risk Levels
   */
  getUtilization: (data: NetworkState) => {
    const activePcos = data.pcos.filter(p => !p.isDeleted);
    
    let totalPorts = 0;
    let usedPorts = 0;
    let criticalRisks = 0;
    let warningNodes = 0;

    activePcos.forEach(pco => {
      totalPorts += pco.totalPorts;
      usedPorts += pco.usedPorts;
      
      const usage = pco.usedPorts / pco.totalPorts;
      if (usage >= 1) criticalRisks++;
      else if (usage >= 0.8) warningNodes++;
    });

    const globalUtilization = totalPorts > 0 ? (usedPorts / totalPorts) * 100 : 0;

    return {
      totalPorts,
      usedPorts,
      freePorts: totalPorts - usedPorts,
      globalUtilization: parseFloat(globalUtilization.toFixed(1)),
      criticalRisks,
      warningNodes
    };
  },

  /**
   * Get Incident / Health Stats
   */
  getHealthStatus: (data: NetworkState) => {
    const allEntities = [
      ...data.sites, ...data.olts, ...data.msans, ...data.pcos, ...data.cables, ...data.splitters, ...data.joints
    ];

    return {
      available: allEntities.filter(e => e.status === EquipmentStatus.AVAILABLE).length,
      warning: allEntities.filter(e => e.status === EquipmentStatus.WARNING).length,
      critical: allEntities.filter(e => e.status === EquipmentStatus.SATURATED || e.status === EquipmentStatus.OFFLINE).length,
      maintenance: allEntities.filter(e => e.status === EquipmentStatus.MAINTENANCE).length,
      planned: allEntities.filter(e => e.status === EquipmentStatus.PLANNED).length
    };
  },

  /**
   * Prepare Chart Data for Saturation Distribution
   */
  getSaturationChartData: (data: NetworkState) => {
    const activePcos = data.pcos.filter(p => !p.isDeleted);
    return [
      { name: 'Libre (0%)', value: activePcos.filter(p => p.usedPorts === 0).length, color: '#94a3b8' },
      { name: 'Faible (1-50%)', value: activePcos.filter(p => p.usedPorts > 0 && (p.usedPorts / p.totalPorts) <= 0.5).length, color: '#10b981' },
      { name: 'Élevée (51-99%)', value: activePcos.filter(p => (p.usedPorts / p.totalPorts) > 0.5 && (p.usedPorts / p.totalPorts) < 1).length, color: '#f59e0b' },
      { name: 'Saturé (100%)', value: activePcos.filter(p => p.usedPorts === p.totalPorts).length, color: '#f43f5e' }
    ];
  }
};
