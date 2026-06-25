import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem('careafterToken', response.data.token);
      setMessage('Login successful');
      window.location.href = '/dashboard';
    } catch (error) {
      setMessage('Login failed');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: '0 auto' }}>
      <h1>CareAfter</h1>
      <p>Login</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Sign in</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
