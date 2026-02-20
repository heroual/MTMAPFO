
export enum EquipmentType {
  SITE = 'SITE',
  MSAN = 'MSAN',
  OLT = 'OLT', 
  OLT_BIG = 'OLT_BIG',
  OLT_MINI = 'OLT_MINI',
  SLOT = 'SLOT',
  BOARD = 'BOARD',
  GPON_PORT = 'GPON_PORT',
  ODF = 'ODF',
  SPLITTER = 'SPLITTER',
  JOINT = 'JOINT',
  CHAMBER = 'CHAMBER', 
  PCO = 'PCO',
  ONT = 'ONT', 
  CABLE = 'CABLE',
  CLIENT = 'CLIENT',
  FREE_PORT = 'FREE_PORT'
}

export enum EquipmentStatus {
  PLANNED = 'PLANNED',
  INSTALLING = 'INSTALLING',
  AVAILABLE = 'AVAILABLE',
  WARNING = 'WARNING',
  SATURATED = 'SATURATED',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  reference: string;
  quantity: number;
  unit: string;
  status: 'PLANNED' | 'CONSUMED';
  assignedToId?: string;
}

export enum OperationStatus {
  DRAFT = 'DRAFT',
  CONFIGURED = 'CONFIGURED',
  DEPLOYED = 'DEPLOYED',
  VALIDATED = 'VALIDATED',
  ARCHIVED = 'ARCHIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  PLANNED = 'PLANNED'
}

export enum OperationType {
  INFRA_BUILD = 'INFRA_BUILD',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  DECOMMISSION = 'DECOMMISSION'
}

export interface FieldOperation {
  id: string;
  name: string;
  type: OperationType;
  status: OperationStatus;
  date: string;
  technicianName: string;
  teamId: string;
  zone: string;
  zonePolygon?: Coordinates[];
  location: Coordinates;
  draftEquipments: any[];
  draftCables: any[];
  materials: MaterialItem[];
  comments?: string;
  targetEntityId?: string;
  createdEntityId?: string;
  createdEntityType?: string;
  mapSnapshot?: string; // Base64 or URL of the engineering trace
}

export interface NetworkEntity {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  parentId?: string | null; 
  location?: Coordinates; 
  logicalPath?: string; 
  metadata?: Record<string, any>;
  isDeleted?: boolean;
  updatedAt?: string;
  operationId?: string;
  isVirtual?: boolean;
}

export interface Equipment extends NetworkEntity {
  totalCapacity?: number; 
  usedCapacity?: number;
  ports?: any[];
  totalPorts?: number;
  usedPorts?: number;
  portNumber?: number;
  boardNumber?: number;
  slotNumber?: number;
}

export interface OLT extends Equipment {}
export interface MSAN extends Equipment {
  msanType?: MsanType;
  siteId?: string;
}
export interface Splitter extends Equipment {
  ratio: string;
  portId?: string;
}
export interface PCO extends Equipment {
  splitterId?: string;
}
export interface Slot extends Equipment {
  oltId?: string;
}
export interface GponPort extends Equipment {
  slotId?: string;
}
export interface PhysicalSite extends Equipment {
  siteType: SiteType;
}
export interface PhysicalEntity extends Equipment {
  location: Coordinates;
}

export enum SiteType {
  CENTRALE = 'CENTRALE',
  POP = 'POP'
}

export enum MsanType {
  OUTDOOR = 'OUTDOOR',
  INDOOR = 'INDOOR'
}

export enum BoardType {
  GPON = 'GPON',
  XGSPON = 'XGSPON',
  UPLINK = 'UPLINK',
  CONTROL = 'CONTROL'
}

export interface SlotConfig {
  slotNumber: number;
  status: 'EMPTY' | 'OCCUPIED';
  boardType?: BoardType;
  portCount?: number;
  ports?: Record<number, any>;
}

export enum CableCategory {
  TRANSPORT = 'TRANSPORT',
  DISTRIBUTION = 'DISTRIBUTION'
}

export enum CableType {
  FO01 = 'FO01',
  FO48 = 'FO48',
  FO72 = 'FO72',
  FO144 = 'FO144',
  FO16 = 'FO16',
  FO24 = 'FO24',
  FO56 = 'FO56'
}

export interface FiberCable extends NetworkEntity {
  type: EquipmentType.CABLE;
  category: CableCategory;
  cableType: CableType;
  fiberCount: number;
  lengthMeters: number;
  startNodeId: string;
  endNodeId: string;
  path: Coordinates[];
  installationMode?: InstallationMode;
}

export enum InstallationMode {
  UNDERGROUND = 'UNDERGROUND',
  AERIAL = 'AERIAL'
}

export interface RouteDetails {
  distance: number;
  duration: number;
  profile: 'driving' | 'walking';
  geometry: any;
}

export interface NetworkState {
  equipments: Equipment[];
  cables: FiberCable[];
  sites: PhysicalSite[];
  msans: MSAN[];
  olts: OLT[];
  slots: Slot[];
  ports: GponPort[];
  splitters: Splitter[];
  pcos: PCO[];
  joints: Equipment[];
  chambers: Equipment[];
}

export enum RiskLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface TraceResult {
  fiberId: number;
  startCableId?: string;
  segments: FiberSegment[];
  totalDistance: number;
  totalLossEst: number;
  status: string;
  endPoint?: any;
}

export interface FiberSegment {
  id: string;
  type: 'CABLE' | 'NODE' | 'ENDPOINT' | 'SPLICE';
  entityName: string;
  entityId: string;
  entityType: string;
  location?: Coordinates;
  meta?: string;
  fiberIndex?: number;
  fiberColor?: string;
  geometry?: Coordinates[];
}

export interface InstallationResult {
  feasible: boolean;
  distanceMeters: number;
  signalLossDb: number;
  message: string;
  nearestPCO?: PCO;
}

export interface ClientProfile {
  id: string;
  login: string;
  name: string;
  ontSerial: string;
  status: ClientStatus;
  installedAt: string;
  clientType: ClientType;
  offer: CommercialOffer;
  phone?: string;
  email?: string;
  routerModel?: string;
  address?: string;
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export enum ClientType {
  RESIDENTIAL = 'RESIDENTIAL',
  BUSINESS = 'BUSINESS'
}

export enum CommercialOffer {
  FIBRE_100M = 'FIBRE_100M',
  FIBRE_200M = 'FIBRE_200M',
  FIBRE_500M = 'FIBRE_500M'
}

export interface PCOPort {
  id: number;
  status: 'FREE' | 'USED' | 'DAMAGED';
  client?: ClientProfile;
}

export interface NetworkSnapshot {
  id: string;
  name: string;
  description?: string;
  date: string;
  createdAt: string;
  createdBy: string;
  data: NetworkState;
}
