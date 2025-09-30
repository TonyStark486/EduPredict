import React from "react";

function Register() {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form className="space-y-4">
        <input type="text" placeholder="Full Name" className="w-full border p-2 rounded"/>
        <input type="email" placeholder="Email" className="w-full border p-2 rounded"/>
        <input type="password" placeholder="Password" className="w-full border p-2 rounded"/>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">Register</button>
      </form>
    </div>
  );
}

export default Register;