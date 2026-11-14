export interface FieldData {
  id: string;
  name: string;
  coordinates: number[][][]; // GeoJSON Polygon coordinates [lng, lat]
  latLngs: { lat: number; lng: number }[];
  centroid: {
    lat: number;
    lng: number;
  };
  areaHectares: number;
  areaAcres: number;
  perimeterMeters: number;
  cropType: string;
  createdAt: string;
}

export interface PresetLocation {
  name: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
}

export interface GridCell {
  id: string;
  lat: number;
  lng: number;
  moisturePercentage: number;
  stressLevel: "critical" | "warning" | "optimal";
  irrigationMultiplier: number; // 3.0 for critical, 1.0 for warning, 0.0 for optimal
}

export interface DownscalingResult {
  totalCells: number;
  criticalCount: number;
  warningCount: number;
  optimalCount: number;
  averageMoisture: number;
  cells: GridCell[];
}
