import React from "react";

function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white shadow rounded-lg">📈 Dropout Prediction Graph (placeholder)</div>
        <div className="p-6 bg-white shadow rounded-lg">📰 Student Updates (placeholder)</div>
      </div>
    </div>
  );
}

export default Dashboard;