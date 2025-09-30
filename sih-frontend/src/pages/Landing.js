import React from "react";

function Landing() {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-3xl font-bold text-blue-700">Welcome to SIH Dropout Solution</h1>
      <p className="text-gray-700">A platform to predict and prevent student dropouts with timely interventions.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-6 bg-white shadow rounded-lg">📊 Analytics Dashboard</div>
        <div className="p-6 bg-white shadow rounded-lg">🧑‍🎓 Student Resources</div>
        <div className="p-6 bg-white shadow rounded-lg">🔔 Dropout Alerts</div>
      </div>
    </div>
  );
}

export default Landing;