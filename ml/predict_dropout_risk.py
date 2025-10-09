import pandas as pd
import numpy as np
import joblib
import os

# ------------------------- CONFIG -------------------------
INPUT_FILE = "data - Copy.xlsx"   # 🔹 change this to your Excel file name
OUTPUT_FILE = "predicted_output.xlsx"
MODEL_FILE = "model.pkl"          # or "model.pkl"
ENCODER_FILE = "label_encoder.pkl"
# -----------------------------------------------------------

print("📂 Loading model and encoder...")
if not os.path.exists(MODEL_FILE) or not os.path.exists(ENCODER_FILE):
    raise FileNotFoundError("❌ Model or encoder file not found. Make sure both .pkl files exist.")

model = joblib.load(MODEL_FILE)
encoder = joblib.load(ENCODER_FILE)
print("✅ Model and encoder loaded successfully!")

# ------------------------------------------------------------
# Step 1: Load Excel file
# ------------------------------------------------------------
print(f"📘 Reading input file: {INPUT_FILE}")
df = pd.read_excel(INPUT_FILE)

# 🧩 Ensure all column names are strings
df.columns = df.columns.astype(str)

# Ignore the Target column if present
if "Target" in df.columns:
    print("⚠️ Detected 'Target' column — this will be ignored for prediction.")
    df = df.drop(columns=["Target"])

# Assign roll numbers if not present
if "Roll No" not in df.columns:
    df.insert(0, "Roll No", range(1, len(df) + 1))

print(f"✅ Loaded {len(df)} students for prediction.")

# ------------------------------------------------------------
# Step 2: Preprocess
# ------------------------------------------------------------
X = df.copy()

# Convert categorical columns to numeric codes (same as training)
for col in X.select_dtypes(include=['object']).columns:
    X[col] = X[col].astype('category').cat.codes

# ------------------------------------------------------------
# Step 3: Predict
# ------------------------------------------------------------
print("🎯 Predicting dropout probabilities...")

# 🧩 FIX: Ensure all column names are strings (avoids sklearn TypeError)
X.columns = X.columns.astype(str)

# Optional: Keep only columns model was trained on (if feature_names_in_ exists)
if hasattr(model, "feature_names_in_"):
    expected_features = set(model.feature_names_in_)
    current_features = set(X.columns)
    extra = current_features - expected_features
    missing = expected_features - current_features
    if extra:
        print(f"⚠️ Ignoring unexpected columns: {extra}")
        X = X.drop(columns=list(extra))
    if missing:
        print(f"⚠️ Missing columns detected: {missing}. Proceeding with available ones...")

# Drop Roll No before prediction
if "Roll No" in X.columns:
    X = X.drop(columns=["Roll No"])

# Predict
y_pred_encoded = model.predict(X)
y_pred_proba = model.predict_proba(X)

# Decode predictions
y_pred = encoder.inverse_transform(y_pred_encoded)

# Get probability of dropout
dropout_index = list(encoder.classes_).index("Dropout")
dropout_prob = y_pred_proba[:, dropout_index]

# Risk categorization
def risk_category(p):
    if p > 0.7:
        return "High"
    elif p >= 0.3:
        return "Medium"
    else:
        return "Low"

# ------------------------------------------------------------
# Step 4: Save results
# ------------------------------------------------------------
result_df = df.copy()
result_df["Predicted"] = y_pred
result_df["Dropout Probability"] = dropout_prob
result_df["Risk Category"] = result_df["Dropout Probability"].apply(risk_category)

# Save output to Excel
result_df.to_excel(OUTPUT_FILE, index=False)

print(f"\n✅ Prediction completed successfully!")
print(f"💾 Results saved to: {OUTPUT_FILE}")
print(f"📈 Columns in output: Roll No, Predicted, Dropout Probability, Risk Category")
