CREATE TABLE colleges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  principal_name VARCHAR(255),
  college_type VARCHAR(50),
  category VARCHAR(50),
  aided VARCHAR(50),
  password_hash TEXT NOT NULL
);
