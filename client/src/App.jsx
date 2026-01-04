import { useState, useEffect } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('Loading...');
  const [health, setHealth] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token invalid, clear it
        setToken('');
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Error connecting to API'));

    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setHealth({ status: 'error' }));

    // If token exists, fetch user info
    if (token) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form validation
    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    // Password length validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setEmail('');
        setPassword('');
        await fetchUser();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error connecting to API');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>SRE Project</h1>
      <p>Client: React + Vite</p>
      
      {!token ? (
        <div style={{ marginTop: '2rem' }}>
          <h2>Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                  placeholder="admin@example.com"
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box' }}
                  placeholder="admin123"
                  disabled={loading}
                />
              </label>
            </div>
            {error && (
              <div style={{ color: 'red', padding: '0.5rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '0.9rem' }}>
            <p><strong>Default credentials:</strong></p>
            <p>Email: admin@example.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <h2>Welcome!</h2>
          {user && (
            <div style={{ padding: '1rem', backgroundColor: '#e6f7ff', borderRadius: '4px', marginBottom: '1rem' }}>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{ padding: '0.75rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '0.9rem' }}>
        <p><strong>API Status:</strong></p>
        <p>API Message: {message}</p>
        <p>API Health: {health ? JSON.stringify(health) : 'Checking...'}</p>
      </div>
    </div>
  );
}

export default App;

