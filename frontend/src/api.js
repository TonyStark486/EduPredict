// src/api.js
const API_URL = "https://edupredict-l9eg.onrender.com";

// Example login request
fetch('${API_URL}/api/login', {
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

const backendUrl = 'https://edupredict-l9eg.onrender.com';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const code = document.getElementById('code').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.textContent = '';

  try {
    const res = await fetch(`${backendUrl}/api/college/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('collegeData', JSON.stringify(data));
      window.location.href = 'collegehomepage.html';
    } else {
      errorMsg.textContent = data.error || 'Login failed';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = 'Error connecting to server.';
  }
});
