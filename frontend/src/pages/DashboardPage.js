import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

export default function DashboardPage() {
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState('');

  const fetchAlerts = () => {
    const token = localStorage.getItem('careafterToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    axios.get(`${API_BASE_URL}/api/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setAlerts(response.data))
      .catch(() => setAlerts([]));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (alertId) => {
    const token = localStorage.getItem('careafterToken');
    try {
      await axios.patch(`${API_BASE_URL}/api/alerts/${alertId}/resolve`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Alert resolved');
      fetchAlerts();
    } catch (error) {
      setMessage('Failed to resolve alert');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Doctor dashboard</h1>
      <nav style={{ marginBottom: 20 }}>
        <a href="/patient" style={{ marginRight: 12 }}>Patient check-in</a>
        <a href="/notifications">Notifications</a>
      </nav>
      <p>Active alerts</p>
      {message && <p>{message}</p>}
      <ul>
        {alerts.map((alert) => (
          <li key={alert.id} style={{ marginBottom: 12 }}>
            <strong>{alert.message}</strong> ({alert.status})
            <button onClick={() => handleResolve(alert.id)} style={{ marginLeft: 10 }}>
              Resolve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
