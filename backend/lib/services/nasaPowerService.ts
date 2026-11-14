/**
 * Domain Service: NASA POWER Telemetry Ingestion
 * Fetches solar radiation, temperature, relative humidity, wind speed & precipitation
 * Supports single-day real-time and 7-day time-series history
 * Zero API keys or tokens required.
 */

export interface NasaTelemetry {
  solarRadiation_MJ_m2_day: number;
  temperature_C: number;
  tempMax_C: number;
  tempMin_C: number;
  relativeHumidity_percent: number;
  windSpeed_m_s: number;
  precipitation_mm: number;
}

export interface DailyTelemetryRecord extends NasaTelemetry {
  date: string;
  formattedDate: string;
}

export interface NasaResponse {
  success: boolean;
  isFallback?: boolean;
  dataDate: string;
  telemetry: NasaTelemetry;
  history: DailyTelemetryRecord[];
  error?: string;
}

export async function fetchNasaTelemetry(
  latitude: number,
  longitude: number
): Promise<NasaResponse> {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 10);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const start = formatDate(pastDate);
  const end = formatDate(today);

  const parameters = "ALLSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR";
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=AG&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=JSON`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "OrbitDrop/1.0" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NASA POWER HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const paramData = data.properties?.parameter;

    if (!paramData) {
      throw new Error("Invalid response format from NASA POWER API");
    }

    const solarMap = paramData["ALLSKY_SFC_SW_DWN"] || {};
    const t2mMap = paramData["T2M"] || {};
    const tMaxMap = paramData["T2M_MAX"] || {};
    const tMinMap = paramData["T2M_MIN"] || {};
    const rhMap = paramData["RH2M"] || {};
    const wsMap = paramData["WS2M"] || {};
    const precMap = paramData["PRECTOTCORR"] || {};

    const dates = Object.keys(solarMap).sort();
    const validHistory: DailyTelemetryRecord[] = [];

    for (const d of dates) {
      const solar = solarMap[d];
      const t2m = t2mMap[d];
      const tMax = tMaxMap[d];
      const tMin = tMinMap[d];
      const rh = rhMap[d];
      const ws = wsMap[d];
      const prec = precMap[d];

      // Exclude invalid NASA missing value flags (-999)
      if (
        solar !== undefined && solar > -900 &&
        t2m !== undefined && t2m > -900
      ) {
        // Format YYYYMMDD to MMM DD
        const yr = d.substring(0, 4);
        const mo = parseInt(d.substring(4, 6), 10) - 1;
        const dy = parseInt(d.substring(6, 8), 10);
        const dt = new Date(parseInt(yr, 10), mo, dy);
        const formattedDate = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        validHistory.push({
          date: d,
          formattedDate,
          solarRadiation_MJ_m2_day: Number(solar),
          temperature_C: Number(t2m ?? 24.0),
          tempMax_C: Number(tMax ?? 29.0),
          tempMin_C: Number(tMin ?? 20.0),
          relativeHumidity_percent: Number(rh ?? 60.0),
          windSpeed_m_s: Number(ws ?? 2.0),
          precipitation_mm: Number(prec ?? 0.0),
        });
      }
    }

    // Latest recorded day
    const latest = validHistory.length > 0 ? validHistory[validHistory.length - 1] : null;

    if (!latest) {
      throw new Error("No valid telemetry records found in NASA response");
    }

    return {
      success: true,
      dataDate: latest.date,
      telemetry: {
        solarRadiation_MJ_m2_day: latest.solarRadiation_MJ_m2_day,
        temperature_C: latest.temperature_C,
        tempMax_C: latest.tempMax_C,
        tempMin_C: latest.tempMin_C,
        relativeHumidity_percent: latest.relativeHumidity_percent,
        windSpeed_m_s: latest.windSpeed_m_s,
        precipitation_mm: latest.precipitation_mm,
      },
      history: validHistory.slice(-7), // Last 7 valid days
    };
  } catch (error: any) {
    console.warn("[NasaService] Live query fallback engaged:", error.message);
    const mockHistory: DailyTelemetryRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = formatDate(d);
      mockHistory.push({
        date: dStr,
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        solarRadiation_MJ_m2_day: parseFloat((18.5 + Math.sin(i) * 3).toFixed(1)),
        temperature_C: parseFloat((26.0 + Math.cos(i) * 2).toFixed(1)),
        tempMax_C: parseFloat((31.0 + Math.cos(i) * 2).toFixed(1)),
        tempMin_C: parseFloat((21.0 + Math.cos(i) * 1.5).toFixed(1)),
        relativeHumidity_percent: Math.round(75 + Math.sin(i * 2) * 10),
        windSpeed_m_s: parseFloat((1.8 + Math.cos(i) * 0.7).toFixed(1)),
        precipitation_mm: i === 1 ? 4.5 : 0.0,
      });
    }

    const latest = mockHistory[mockHistory.length - 1];

    return {
      success: false,
      isFallback: true,
      error: error.message,
      dataDate: latest.date,
      telemetry: {
        solarRadiation_MJ_m2_day: latest.solarRadiation_MJ_m2_day,
        temperature_C: latest.temperature_C,
        tempMax_C: latest.tempMax_C,
        tempMin_C: latest.tempMin_C,
        relativeHumidity_percent: latest.relativeHumidity_percent,
        windSpeed_m_s: latest.windSpeed_m_s,
        precipitation_mm: latest.precipitation_mm,
      },
      history: mockHistory,
    };
  }
}
