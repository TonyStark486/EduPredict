import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# ✅ Load dataset
df = pd.read_csv("students.csv", sep = '|')

# ✅ Clean the dataset
df.columns = df.columns.str.strip()             # Remove spaces from column names
df = df.dropna(axis=1, how='all')               # Drop empty columns
df = df.dropna(axis=0, how='all')               # Drop empty rows
df = df[df['Attendance'] != '----------']       # Remove the extra header row

# ✅ Convert numeric columns properly
df['Attendance'] = df['Attendance'].astype(float)
df['GPA'] = df['GPA'].astype(float)
df['Assignments'] = df['Assignments'].astype(float)
df['FamilyIncome'] = df['FamilyIncome'].astype(float)
df['Dropout'] = df['Dropout'].astype(int)

# ✅ Encode categorical column
df['Activities'] = df['Activities'].map({'Yes': 1, 'No': 0})

# ✅ Split features and target
X = df.drop("Dropout", axis=1)
y = df["Dropout"]

# ✅ Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# ✅ Model
model = LogisticRegression()
model.fit(X_train, y_train)

# ✅ Evaluate
y_pred = model.predict(X_test)
print("\n✅ Model trained successfully!")
print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")

# ✅ Test Prediction
sample = [[75, 7.5, 8, 25000, 1]]  # sample student
prediction = model.predict(sample)
print("\n🎯 Predicted Dropout:", "Yes" if prediction[0] == 1 else "No")
