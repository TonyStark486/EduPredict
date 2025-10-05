# 🎓 SIH Project – Student Dropout Predictor

## 📌 Overview
This project predicts the **dropout risk of students** using academic and attendance data.
It helps colleges identify at-risk students early and provide timely interventions.

This repository contains:
- **Frontend (React + Tailwind CSS)** → Deployed on Vercel
- **Serverless API (Vercel function)** → Mock predictions
- **Optional Backend** → For integrating real ML models

## 🚀 Features
- ✅ Student input form (Name, Email, CGPA, Attendance %)
- ✅ Real-time dropout risk prediction (High / Medium / Low)
- ✅ Responsive UI (mobile & desktop friendly)
- ✅ API-ready integration
- ✅ Free deployment on **Vercel**

## 📂 Project Structure
```
frontend/
 ├── api/               # Serverless function (predict.js)
 ├── src/
 │    ├── App.jsx
 │    ├── main.jsx
 │    └── index.css
 ├── package.json
 └── ...
README.md
```

## ⚡ Getting Started

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/sih-project.git
cd sih-project/frontend
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Run locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4️⃣ Deploy on Vercel
1. Push the repo to GitHub.
2. Go to [Vercel](https://vercel.com/) → Import project.
3. Select **Vite + React** framework.
4. Deploy 🚀

## 🔌 API Integration
- The frontend posts form data to `/api/predict`.
- Vercel serverless function returns a **mock prediction**.

Example API response:
```json
{
  "dropoutProbability": 0.34,
  "riskCategory": "Medium"
}
```

## 📊 Future Enhancements
- Integrate real ML model for accurate predictions.
- Add **Admin Dashboard** to monitor at-risk students.
- Provide **Personalized Recommendations** for students.
- Multi-language support for inclusivity.

## 👨‍💻 Team Members
- [Roshan Raut] – Frontend Developer
- [Teammate] – Backend / ML
- [Teammate] – Documentation & Testing

## 📜 License
This project is developed for **Smart India Hackathon (SIH)**.
Open-source for educational and demo purposes.
