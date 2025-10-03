import { useState } from "react";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    cgpa: "",
    attendance: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-cyan-500 flex flex-col items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          🎓 Dropout Predictor
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="number"
            name="cgpa"
            placeholder="CGPA (0-10)"
            value={form.cgpa}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400"
            required
            min="0"
            max="10"
            step="0.1"
          />
          <input
            type="number"
            name="attendance"
            placeholder="Attendance % (0-100)"
            value={form.attendance}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400"
            required
            min="0"
            max="100"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            {result.error ? (
              <p className="text-red-600 font-semibold">⚠️ {result.error}</p>
            ) : (
              <>
                <p className="text-gray-800">
                  <span className="font-bold">Risk Category:</span>{" "}
                  {result.riskCategory || "N/A"}
                </p>
                <p className="text-gray-800">
                  <span className="font-bold">Dropout Probability:</span>{" "}
                  {result.dropoutProbability || "N/A"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
