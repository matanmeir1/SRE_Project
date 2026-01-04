import { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage('Error connecting to API'));

    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setHealth({ status: 'error' }));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>SRE Project</h1>
      <p>Client: React + Vite</p>
      <p>API Message: {message}</p>
      <p>API Health: {health ? JSON.stringify(health) : 'Checking...'}</p>
    </div>
  );
}

export default App;

