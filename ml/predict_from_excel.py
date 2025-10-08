import pandas as pd
import joblib
import os

# --- CONFIG ---
MODEL_PATH = r"C:\Users\Asus\Desktop\SIH\ml\dropout_random_forest_model.pkl"
INPUT_EXCEL = r"C:\Users\Asus\Desktop\SIH\ml\student_data_2.xlsx"
OUTPUT_EXCEL = r"C:\Users\Asus\Desktop\SIH\ml\student_predictions.xlsx"

def load_model(path):
    model = joblib.load(path)
    if isinstance(model, dict) and "model" in model:
        model = model["model"]
    print("✅ Model loaded successfully.")
    return model

def predict_dropout(model, df):
    # Remove Roll No and Target before prediction
    X = df.drop(columns=["Roll No", "Target"], errors="ignore")

    # Predict dropout probability (assuming class 1 = Dropout)
    probs = model.predict_proba(X)[:, 1]

    # Assign color-coded risk levels
    risk_levels = []
    colors = []
    for p in probs:
        if p < 0.33:
            risk_levels.append("Low")
            colors.append("Green")
        elif p < 0.66:
            risk_levels.append("Medium")
            colors.append("Yellow")
        else:
            risk_levels.append("High")
            colors.append("Red")

    # Add columns to DataFrame
    df["Dropout_Probability"] = probs.round(3)
    df["Risk_Level"] = risk_levels
    df["Alert_Color"] = colors
    return df

def main():
    print(f"Loading model from: {MODEL_PATH}")
    model = load_model(MODEL_PATH)

    print(f"Loading student data from: {INPUT_EXCEL}")
    df = pd.read_excel(INPUT_EXCEL)
    print(f"✅ Loaded {len(df)} student records.")

    # Make predictions
    df_pred = predict_dropout(model, df)

    # Save results
    df_pred.to_excel(OUTPUT_EXCEL, index=False)
    print(f"✅ Predictions saved to: {OUTPUT_EXCEL}")

if __name__ == "__main__":
    main()
