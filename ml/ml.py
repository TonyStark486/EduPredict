"""
Student's Dropout Prediction using Random Forest
Ready-to-run Python script (single file) that:
 - Loads the CSV dataset (expects: /mnt/data/student's dropout dataset.csv)
 - Performs basic cleaning and preprocessing
 - Encodes categorical variables
 - Trains a Random Forest classifier on the `Target` column (Graduate/Dropout/Enrolled)
 - Evaluates the model (accuracy, precision, recall, F1, confusion matrix)
 - Saves the trained model to /mnt/data/dropout_random_forest_model.pkl

How to run:
 1. Place this file in the same environment that has scikit-learn, pandas, matplotlib, joblib installed.
 2. Make sure the dataset is at: /mnt/data/student's dropout dataset.csv
 3. Run: python Student_Dropout_RF_ready_to_run.py

"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib.pyplot as plt
import joblib
import warnings

warnings.filterwarnings('ignore')

import os

import os

# Automatically use current folder (where ml.py is located)
DATA_PATH = os.path.join(os.getcwd(), "data.csv")
MODEL_PATH = os.path.join(os.getcwd(), "dropout_random_forest_model.pkl")

def load_data(path=DATA_PATH):
    print(f"Looking for dataset at: {path}")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}. Please make sure it's in the same folder as ml.py.")
    df = pd.read_csv(path)
    return df




def preprocess(df, target_name='Target'):
    # Basic copy
    df = df.copy()

    # Drop columns that are fully empty (if any)
    df.dropna(axis=1, how='all', inplace=True)

    # If the target column is not present, try to detect common names
    if target_name not in df.columns:
        candidates = [c for c in df.columns if c.lower() in ('target','status','result') or 'drop' in c.lower()]
        if candidates:
            target_name = candidates[0]
        else:
            # fallback to last column
            target_name = df.columns[-1]
    
    # Drop rows with missing target
    df = df[~df[target_name].isna()]

    # Clean column names (strip whitespace)
    df.columns = [c.strip() for c in df.columns]
    target_name = target_name.strip()

    # Identify features and target
    y = df[target_name].astype(str).copy()
    X = df.drop(columns=[target_name]).copy()

    # Fill missing values for numerical and categorical separately
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(include=['object']).columns.tolist()

    # For numeric columns, fill with median
    for c in num_cols:
        X[c] = X[c].fillna(X[c].median())

    # For categorical columns, fill with 'Unknown'
    for c in cat_cols:
        X[c] = X[c].fillna('Unknown')

    # Encode categorical string columns with LabelEncoder (simple and reproducible)
    encoders = {}
    for c in cat_cols:
        le = LabelEncoder()
        X[c] = le.fit_transform(X[c].astype(str))
        encoders[c] = le

    # Encode target (Graduate/Dropout/Enrolled or similar)
    target_le = LabelEncoder()
    y_enc = target_le.fit_transform(y)

    # Return processed arrays and metadata
    return X, y_enc, {'target_name': target_name, 'feature_columns': X.columns.tolist(), 'encoders': encoders, 'target_encoder': target_le}


def train_random_forest(X_train, y_train, n_estimators=200, random_state=42):
    rf = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state, n_jobs=-1, class_weight='balanced_subsample')
    rf.fit(X_train, y_train)
    return rf


def evaluate_model(model, X_test, y_test, target_encoder=None, show_confusion_plot=True):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}\n")
    print("Classification report:\n")
    print(classification_report(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred)
    print("Confusion matrix:\n", cm)

    if show_confusion_plot:
        plt.figure(figsize=(6,5))
        plt.imshow(cm, interpolation='nearest')
        plt.title('Confusion matrix')
        plt.colorbar()
        ticks = np.arange(cm.shape[0])
        if target_encoder is not None:
            labels = target_encoder.classes_
        else:
            labels = ticks
        plt.xticks(ticks, labels, rotation=45)
        plt.yticks(ticks, labels)
        plt.ylabel('True label')
        plt.xlabel('Predicted label')
        plt.tight_layout()
        plt.show()

    return acc, cm


def plot_feature_importances(model, feature_names, top_n=20):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:top_n]
    plt.figure(figsize=(10,6))
    plt.bar(range(len(indices)), importances[indices])
    plt.xticks(range(len(indices)), [feature_names[i] for i in indices], rotation=90)
    plt.title('Top feature importances')
    plt.tight_layout()
    plt.show()


def main():
    print("Loading data...")
    df = load_data()
    print(f"Raw data shape: {df.shape}")

    print("Preprocessing...")
    X, y, meta = preprocess(df, target_name='Target')
    print(f"Features: {len(meta['feature_columns'])}, Target classes: {list(meta['target_encoder'].classes_)}")

    # Train/test split with stratification to keep class balance
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    print("Training Random Forest classifier...")
    rf = train_random_forest(X_train, y_train)

    print("Evaluating model on test set...")
    acc, cm = evaluate_model(rf, X_test, y_test, target_encoder=meta['target_encoder'])

    print("Plotting top feature importances...")
    plot_feature_importances(rf, meta['feature_columns'], top_n=20)

    # Save model and metadata
    print(f"Saving model to {MODEL_PATH} ...")
    joblib.dump({'model': rf, 'meta': meta}, MODEL_PATH)
    print("Saved successfully.")

    # Show few sample predictions
    sample_X = X_test.iloc[:10]
    sample_preds = rf.predict(sample_X)
    sample_preds_labels = meta['target_encoder'].inverse_transform(sample_preds)
    sample_true_labels = meta['target_encoder'].inverse_transform(y_test[:10])

    sample_df = sample_X.copy()
    sample_df['predicted'] = sample_preds_labels
    sample_df['true'] = sample_true_labels
    print("\nSample predictions (first 10 rows):")
    print(sample_df[['predicted','true']])


if __name__ == '__main__':
    main()
