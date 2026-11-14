"""
OrbitDrop - Soil Moisture Downscaling ML Training Script (Run this in Google Colab)

Instructions:
1. Open Google Colab (https://colab.research.google.com)
2. Create a new notebook, copy and paste this script, and run it.
3. Download the generated 'soil_moisture_model.joblib' file.
4. Place 'soil_moisture_model.joblib' into:
   OrbitDrop/backend/ml-service/soil_moisture_model.joblib
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

print("🌱 1. Generating synthetic USDA / SMAP spatial downscaling dataset...")

np.random.seed(42)
N_SAMPLES = 5000

# Input Features:
# 1. regional_moisture: Coarse satellite pixel soil moisture (10% - 35%)
# 2. slope: Terrain slope in degrees (0 - 0.25)
# 3. ndvi: Normalized Difference Vegetation Index (0.1 - 0.9)
# 4. rel_x, rel_y: Normalized coordinates within farm parcel (0 - 1)
regional_moisture = np.random.uniform(10.0, 32.0, N_SAMPLES)
slope = np.random.uniform(0.0, 0.20, N_SAMPLES)
ndvi = np.random.uniform(0.15, 0.85, N_SAMPLES)
rel_x = np.random.uniform(0.0, 1.0, N_SAMPLES)
rel_y = np.random.uniform(0.0, 1.0, N_SAMPLES)

# Ground truth hydrological physics:
# High slope drains water -> lower moisture
# Dense vegetation (high NDVI) retains water -> higher moisture
# Topographic depression (center of parcel) accumulates moisture
topographic_accumulation = (np.sin(rel_x * np.pi) * np.sin(rel_y * np.pi)) * 3.5
noise = np.random.normal(0, 0.8, N_SAMPLES)

target_soil_moisture = (
    regional_moisture 
    + (ndvi * 7.5) 
    - (slope * 30.0) 
    + topographic_accumulation 
    + noise
)
target_soil_moisture = np.clip(target_soil_moisture, 8.0, 38.0)

# Build DataFrame
X = pd.DataFrame({
    "regional_moisture": regional_moisture,
    "slope": slope,
    "ndvi": ndvi,
    "rel_x": rel_x,
    "rel_y": rel_y
})
y = target_soil_moisture

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("🚀 2. Training Random Forest Spatial Downscaling Regressor...")
model = RandomForestRegressor(
    n_estimators=100, 
    max_depth=12, 
    random_state=42, 
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"✅ Training Complete! Test R² Score: {r2:.4f}, MSE: {mse:.4f}")

# Feature importances
importances = dict(zip(X.columns, model.feature_importances_))
print(f"📊 Feature Importances: {importances}")

# Export Model
OUTPUT_FILENAME = "soil_moisture_model.joblib"
joblib.dump(model, OUTPUT_FILENAME)
print(f"💾 Model exported successfully as '{OUTPUT_FILENAME}'!")

# In Google Colab, you can trigger auto-download by uncommenting:
# from google.colab import files
# files.download(OUTPUT_FILENAME)
