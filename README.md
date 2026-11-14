# 🛰️ OrbitDrop: NASA Satellite Precision Irrigation Dispatch

OrbitDrop is a geospatial microservices platform for precision agriculture. Farmers draw parcel boundaries directly on high-resolution satellite imagery, query real-time NASA POWER agroclimatological telemetry, compute FAO-56 Penman-Monteith Evapotranspiration ($ET_0$), trigger Smart Rain Lockouts, and simulate variable-rate irrigation using an HTML5 Canvas particle spray engine.

---

## 🏛️ Microservice Architecture

```
OrbitDrop/
├── frontend/                      # [Next.js 14 + Leaflet + Canvas + Tailwind CSS]
│   ├── app/                       # App Router & Pages
│   ├── components/                # Satellite Map, StatsPanel, Presets, Header
│   ├── types/                     # Geospatial TypeScript interfaces
│   └── .env.local                 # Microservice API URL bindings
│
└── backend/                       # [Microservices Cluster]
    ├── telemetry-service/         # Node.js / Express (Port 5001)
    │   ├── src/services/nasaPower.js       # NASA POWER API client (Solar, Temp, Humidity, Wind)
    │   ├── src/services/penmanMonteith.js  # FAO-56 Penman-Monteith ET0 & Crop Deficit
    │   ├── src/services/rainLockout.js     # Open-Meteo 48h Rain Forecast & Smart Lockout
    │   └── src/index.js                    # REST API endpoints
    │
    └── ml-service/                # Python / FastAPI (Port 8000)
        ├── main.py                         # 30m Grid Downscaling & Inference Endpoint
        ├── train_colab_model.py            # Model training script for Google Colab
        ├── requirements.txt                # FastAPI, scikit-learn, shapely, joblib
        └── soil_moisture_model.joblib      # Exported Colab model weights (place here)
```

---

## 🚀 Quick Start Guide

### 1. Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 2. Telemetry & ET0 Microservice (Port 5001)
```bash
cd backend/telemetry-service
npm install
npm run dev
```
Health Check: **`http://localhost:5001/health`**

### 3. ML Micro-Stress Microservice (Port 8000)
```bash
cd backend/ml-service
pip install -r requirements.txt
python main.py
```
Swagger Documentation: **`http://localhost:8000/docs`**

---

## 🔬 Google Colab ML Training
1. Open [Google Colab](https://colab.research.google.com).
2. Copy and run `backend/ml-service/train_colab_model.py`.
3. Download the generated `soil_moisture_model.joblib`.
4. Drop it into `backend/ml-service/` for production inference.
