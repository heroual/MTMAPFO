
import { OperationType, MaterialItem, CableCategory, EquipmentType, CableType } from '../types';

export const OperationUtils = {
  getSuggestedMaterials: (type: OperationType): MaterialItem[] => {
    const base = [
        { id: 'mat-label', name: 'Étiquettes Laser IP67', reference: 'LBL-PRO-IAM', quantity: 2, unit: 'pcs', status: 'PLANNED' as const },
        { id: 'mat-photo', name: 'Dossier Photos (Avant/Après)', reference: 'DOE-DIGITAL', quantity: 1, unit: 'set', status: 'PLANNED' as const }
    ];

    switch (type) {
      case OperationType.INFRA_BUILD:
        return [
          { id: 'mat-pco-box', name: 'Boîtier ODP/PCO 1:8', reference: 'PCO-G8-STD', quantity: 1, unit: 'pcs', status: 'PLANNED' as const },
          { id: 'mat-splitter', name: 'Splitter PLC 1:32', reference: 'SPL-32-TIA', quantity: 1, unit: 'pcs', status: 'PLANNED' as const },
          { id: 'mat-sleeve', name: 'Manchons Thermo 60mm', reference: 'SLV-60', quantity: 40, unit: 'pcs', status: 'PLANNED' as const },
          ...base
        ];
      default:
        return base;
    }
  },

  downloadReport: (op: any, nodes: any[]) => {
    const snapshot = op.mapSnapshot || op.metadata?.mapSnapshot;
    const hasImage = snapshot && String(snapshot).startsWith('data:image');
    // On récupère le premier et dernier nœud pour le récapitulatif
    const startNode = nodes[0];
    const endNode = nodes[nodes.length - 1];
    const cables = op.draftCables || [];
    const materials = op.materials || [];
    const observations = op.comments || op.metadata?.comments || "Aucune observation technique particulière.";

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>OT_FIBRE_${(op.id || 'DRAFT').substring(0,8)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@500;700&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; max-width: 1000px; margin: 0 auto; background: #fff; }
          
          .header { border-bottom: 6px solid #E30613; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo-box { display: flex; flex-direction: column; }
          .logo { font-size: 32px; font-weight: 800; color: #E30613; letter-spacing: -2px; }
          .logo span { color: #0f172a; }
          .ot-title { background: #0f172a; color: white; padding: 10px 25px; border-radius: 8px; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .meta-card { background: #f1f5f9; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .meta-card h4 { font-size: 10px; text-transform: uppercase; color: #64748b; margin: 0 0 5px 0; font-weight: 800; letter-spacing: 0.5px; }
          .meta-card p { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
 
          .blueprint-frame { 
            width: 100%; 
            border-radius: 20px; 
            border: 3px solid #0f172a; 
            margin-bottom: 35px; 
            background: #020617; 
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          }
          .blueprint-frame img { width: 100%; height: auto; display: block; }
          
          .section-title { font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-left: 5px solid #E30613; padding-left: 15px; margin: 40px 0 20px 0; display: flex; justify-content: space-between; align-items: center; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
          th { background: #0f172a; padding: 12px; text-align: left; color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          
          .gps { font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 700; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }
          .badge-transport { color: #2563eb; font-weight: 800; }
          .badge-distrib { color: #059669; font-weight: 800; }
          
          .obs-box { background: #fffbeb; border: 2px dashed #fef3c7; padding: 25px; border-radius: 15px; font-size: 14px; color: #92400e; min-height: 80px; }
          
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; }
          .sig-box { border: 1px solid #cbd5e1; height: 120px; border-radius: 12px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; }
 
          @media print {
            body { padding: 0; }
            .blueprint-frame { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <div class="logo">MTMAP<span>-FO</span></div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">INGÉNIERIE RÉSEAU & DÉPLOIEMENT</div>
          </div>
          <div class="ot-title">Ordre de Travail N°${(op.id || 'DRAFT').substring(0,8).toUpperCase()}</div>
        </div>
 
        <div class="meta-grid">
          <div class="meta-card">
            <h4>Chef de Projet / Technicien</h4>
            <p>${op.technicianName || 'N/A'} (${op.teamId || 'N/A'})</p>
          </div>
          <div class="meta-card">
            <h4>Zone d'Intervention</h4>
            <p>${(op.zone || 'N/A').toUpperCase()} SECTOR</p>
          </div>
          <div class="meta-card">
            <h4>Date d'Émission</h4>
            <p>${new Date(op.date).toLocaleString('fr-FR')}</p>
          </div>
        </div>
 
        <div class="section-title">Croquis d'Exécution (AS-BUILT)</div>
        <div class="blueprint-frame">
          ${hasImage ? `<img src="${snapshot}" />` : `<div style="height: 350px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">[ SNAPSHOT NON DISPONIBLE ]</div>`}
        </div>

        <div class="section-title">Coordonnées Géospatiales des Points Clés</div>
        <table>
          <thead>
            <tr>
              <th>Rôle Technique</th>
              <th>Désignation Équipement</th>
              <th>Type d'Asset</th>
              <th>Coordonnées GPS (WGS84)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>ORIGINE SIGNAL</b></td>
              <td>${startNode?.name || 'N/A'}</td>
              <td>${startNode?.type || 'N/A'}</td>
              <td><span class="gps">${startNode?.location ? `${startNode.location.lat.toFixed(7)}, ${startNode.location.lng.toFixed(7)}` : 'N/A'}</span></td>
            </tr>
            <tr>
              <td><b>TERMINUS LIAISON</b></td>
              <td>${endNode?.name || 'N/A'}</td>
              <td>${endNode?.type || 'N/A'}</td>
              <td><span class="gps">${endNode?.location ? `${endNode.location.lat.toFixed(7)}, ${endNode.location.lng.toFixed(7)}` : 'N/A'}</span></td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Inventaire des Liaisons Optiques</div>
        <table>
          <thead>
            <tr>
              <th>ID Câble</th>
              <th>Segment</th>
              <th>Spécification FO</th>
              <th>Longueur (SIG)</th>
              <th>Capacité</th>
            </tr>
          </thead>
          <tbody>
            ${cables.map((c: any) => `
              <tr>
                <td><b>${c.name}</b></td>
                <td><span class="${c.category === 'TRANSPORT' ? 'badge-transport' : 'badge-distrib'}">${c.category}</span></td>
                <td>${c.cableType}</td>
                <td><span class="gps">${c.lengthMeters} m</span></td>
                <td>${c.fiberCount} Brins</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Allocation Matérielle (BOM)</div>
        <table>
          <thead>
            <tr>
              <th>Article / Composant</th>
              <th>Référence Catalogue</th>
              <th>Quantité</th>
              <th>Unité</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map((m: any) => `
              <tr>
                <td><b>${m.name}</b></td>
                <td style="font-family: monospace;">${m.reference}</td>
                <td style="font-weight: 800; font-size: 14px;">${m.quantity}</td>
                <td>${m.unit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Observations & Instructions de Pose</div>
        <div class="obs-box">
          ${observations}
        </div>

        <div class="sig-grid">
            <div class="sig-box">Signature Technicien Terrain</div>
            <div class="sig-box">Validation Bureau d'Études (Bon pour exécution)</div>
        </div>

        <div class="footer">
          Document généré numériquement par l'Intelligence Engine MTMAP-FO v1.2. Propriété exclusive de Maroc Telecom.<br/>
          Toute reproduction sans autorisation du BE est formellement interdite.
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OT_FIBRE_${(op.id || 'DRAFT').substring(0,8).toUpperCase()}.html`;
    a.click();
  }
};
