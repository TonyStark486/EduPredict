import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Login from "./Login.jsx"; // 👈 your login page component

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />         {/* Home / Welcome Page */}
      <Route path="/login" element={<Login />} />   {/* Login Page */}
    </Routes>
  </BrowserRouter>
);
