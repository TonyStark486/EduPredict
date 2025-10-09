import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from imblearn.over_sampling import SMOTE
import joblib
from sklearn.model_selection import cross_val_score

print("📂 Loading dataset...")
df = pd.read_csv("data.csv")
print(f"✅ Dataset loaded successfully! Shape: {df.shape}")

# ---- Target column ----
target_col = "Target"
if target_col not in df.columns:
    raise ValueError(f"❌ Column '{target_col}' not found in dataset. Available columns: {df.columns.tolist()}")

# ---- Separate features and target ----
X = df.drop(columns=[target_col])
y = df[target_col]

# ---- Encode categorical columns ----
print("🔠 Encoding categorical columns...")
for col in X.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))

# ---- Encode target ----
target_encoder = LabelEncoder()
y = target_encoder.fit_transform(y)

# ---- Train-test split ----
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ---- Handle imbalance using SMOTE ----
print("⚖️ Applying SMOTE to balance classes...")
sm = SMOTE(random_state=42)
X_train, y_train = sm.fit_resample(X_train, y_train)
print("✅ Data balanced after SMOTE:", np.bincount(y_train))

# ---- Random Forest hyperparameter tuning ----
print("🔍 Starting hyperparameter search (this may take a few minutes)...")

param_dist = {
    'n_estimators': [100, 200, 300, 400, 500],
    'max_depth': [None, 10, 20, 30, 40, 50],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4],
    'bootstrap': [True, False],
    'max_features': ['sqrt', 'log2']
}

rf = RandomForestClassifier(random_state=42, class_weight='balanced')
random_search = RandomizedSearchCV(
    rf, param_distributions=param_dist, 
    n_iter=25, cv=3, verbose=2, n_jobs=-1, scoring='accuracy', random_state=42
)

random_search.fit(X_train, y_train)
best_model = random_search.best_estimator_
print("✅ Best parameters found:", random_search.best_params_)

# ---- Evaluate model ----
y_pred = best_model.predict(X_test)
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))
print("🎯 Test Accuracy:", accuracy_score(y_test, y_pred))

# ---- Cross-validation ----
cv_scores = cross_val_score(best_model, X, y, cv=5)
print(f"📈 Cross-validation accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ---- Save model and encoder ----
joblib.dump(best_model, "best_model.pkl")
joblib.dump(target_encoder, "target_encoder.pkl")

print("\n💾 Model saved as 'best_model.pkl'")
print("💾 Label encoder saved as 'target_encoder.pkl'")
print("✅ Training completed successfully!")
