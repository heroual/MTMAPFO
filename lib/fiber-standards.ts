
import { CableType } from '../types';

// The Immutable Color Order defined in requirements (Fallback)
export const STANDARD_COLORS = [
  { name: 'Blue', hex: '#0074D9', text: 'white' },    // 1
  { name: 'Orange', hex: '#FF851B', text: 'white' },  // 2
  { name: 'Green', hex: '#2ECC40', text: 'white' },   // 3
  { name: 'Brown', hex: '#8B572A', text: 'white' },   // 4
  { name: 'Grey', hex: '#AAAAAA', text: 'black' },    // 5
  { name: 'White', hex: '#FFFFFF', text: 'black', border: true }, // 6
  { name: 'Red', hex: '#FF4136', text: 'white' },     // 7
  { name: 'Black', hex: '#111111', text: 'white' }    // 8
];

export interface FiberStructure {
  fiberId: number;
  tubeId: number;
  tubeColor: typeof STANDARD_COLORS[0];
  fiberColor: typeof STANDARD_COLORS[0];
  structureType: string;
}

export const FiberStandards = {
  /**
   * Returns the color definition for a specific index (1-based)
   * Loops if index > 8
   * @param overrideColors Optionnel: Liste personnalisée venant des paramètres système
   */
  getColor: (index: number, overrideColors?: any[]) => {
    const palette = overrideColors && overrideColors.length >= 8 ? overrideColors : STANDARD_COLORS;
    const i = (index - 1) % palette.length;
    return palette[i];
  },

  /**
   * Calculates the Tube and Fiber colors based on Cable Type and Fiber Index
   */
  getStructure: (cableType: CableType | string, fiberIndex: number, overrideColors?: any[]): FiberStructure => {
    let fibersPerTube = 12; // Default Standard TIA
    let structureName = 'Standard';

    // Apply Specific Rules from Requirements
    if (cableType === CableType.FO16 || cableType === 'FO16') {
      fibersPerTube = 4;
      structureName = 'FO16 (4x4)';
    } else if (cableType === CableType.FO24 || cableType === 'FO24') {
      fibersPerTube = 4;
      structureName = 'FO24 (6x4)';
    } else if (cableType === CableType.FO56 || cableType === 'FO56') {
      fibersPerTube = 8;
      structureName = 'FO56 (7x8)';
    } else if (['FO04', 'FO08', 'FO12'].includes(cableType)) {
       fibersPerTube = 12; 
    }

    const tubeId = Math.ceil(fiberIndex / fibersPerTube);
    let fiberInTube = fiberIndex % fibersPerTube;
    if (fiberInTube === 0) fiberInTube = fibersPerTube;

    return {
      fiberId: fiberIndex,
      tubeId: tubeId,
      tubeColor: FiberStandards.getColor(tubeId, overrideColors),
      fiberColor: FiberStandards.getColor(fiberInTube, overrideColors),
      structureType: structureName
    };
  }
};
