// src/api.js
const API_URL = "https://edupredict-l9eg.onrender.com";

// Example login request
fetch(`${API_URL}/api/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
})
.then(res => res.json())
.then(data => { /* handle response */ });

fetch('/api/college/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, email, password }),
});
