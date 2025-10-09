# ---------------------------------------------
# Student Dropout Prediction - Random Forest Model Trainer
# ---------------------------------------------

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# -------------------- PATH HANDLING --------------------
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "data.csv")

# -------------------- LOAD DATA --------------------
print("📂 Loading dataset...")
df = pd.read_csv(csv_path)
print(f"✅ Dataset loaded successfully! Shape: {df.shape}")

# -------------------- CHECK TARGET --------------------
target_col = "Target"cd
if target_col not in df.columns:
    raise ValueError(f"❌ Column '{target_col}' not found in dataset. Check your CSV column names.")

print("\n🔍 Available columns:", list(df.columns))

# -------------------- HANDLE MISSING VALUES --------------------
df = df.dropna()
print(f"✅ After removing missing values: {df.shape}")

# -------------------- ENCODE TARGET --------------------
print("\n🎯 Encoding target labels (Enrolled / Graduated / Dropout)...")
label_encoder = LabelEncoder()
df[target_col] = label_encoder.fit_transform(df[target_col])

# -------------------- SPLIT FEATURES & TARGET --------------------
X = df.drop(columns=[target_col])
y = df[target_col]

# Encode categorical features (non-numeric columns)
X = pd.get_dummies(X, drop_first=True)

# -------------------- TRAIN/TEST SPLIT --------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# -------------------- TRAIN RANDOM FOREST --------------------
print("\n🌲 Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced"
)
rf_model.fit(X_train, y_train)
print("✅ Model training complete!")

# -------------------- EVALUATE MODEL --------------------
y_pred = rf_model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n📊 Accuracy: {acc:.4f}")
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# Confusion Matrix Visualization
plt.figure(figsize=(6, 4))
sns.heatmap(confusion_matrix(y_test, y_pred), annot=True, fmt="d", cmap="Blues")
plt.title("Confusion Matrix - Random Forest")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.tight_layout()
plt.show()

# -------------------- SAVE MODEL --------------------
model_path = os.path.join(script_dir, "model.pkl")
encoder_path = os.path.join(script_dir, "label_encoder.pkl")

joblib.dump(rf_model, model_path)
joblib.dump(label_encoder, encoder_path)

print(f"\n💾 Model saved to: {model_path}")
print(f"💾 Label encoder saved to: {encoder_path}")

# -------------------- FEATURE IMPORTANCE --------------------
feature_importance = pd.Series(rf_model.feature_importances_, index=X.columns)
top_features = feature_importance.sort_values(ascending=False).head(15)

plt.figure(figsize=(8, 6))
sns.barplot(x=top_features.values, y=top_features.index)
plt.title("Top 15 Important Features")
plt.xlabel("Feature Importance Score")
plt.ylabel("Features")
plt.tight_layout()
plt.show()
