# app.py
import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from sqlalchemy import create_engine, text

# ==============================
# 🔹 Flask App Setup
# ==============================
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# ==============================
# 🔹 Absolute Path for ML Model
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR,  'model.pkl')

# Debug print to verify path
print("Looking for model at:", MODEL_PATH)

# Load the model
try:
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully!")
except FileNotFoundError:
    print("❌ Model file not found! Please check path.")
    raise

# ==============================
# 🔹 PostgreSQL Database Setup
# ==============================
DB_USER = "postgres"
DB_PASSWORD = "your_password"
DB_HOST = "localhost"   # use your internal or external host
DB_PORT = "5432"
DB_NAME = "edupredict"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
print("✅ Database engine created!")

# ==============================
# 🔹 Routes
# ==============================

@app.route('/')
def home():
    return render_template('index.html')


# ==============================
# 🔹 Prediction API
# ==============================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        df = pd.DataFrame([data])
        prediction = model.predict(df)[0]

        # Store in DB
        df['prediction'] = prediction
        df.to_sql('predictions', con=engine, if_exists='append', index=False)

        return jsonify({"prediction": str(prediction)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==============================
# 🔹 Login API (Example)
# ==============================
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        with engine.connect() as conn:
            query = text("SELECT * FROM users WHERE username = :username AND password = :password")
            result = conn.execute(query, {"username": username, "password": password}).fetchone()

            if result:
                return jsonify({"message": "Login successful", "user": username})
            else:
                return jsonify({"message": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==============================
# 🔹 Run Server
# ==============================
if __name__ == '__main__':
    app.run(debug=True)
