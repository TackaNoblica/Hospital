import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('careafterToken');
    if (!token) {
      window.location.href = '/';
      return;
    }

    axios.get(`${API_BASE_URL}/api/notifications/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setNotifications(response.data))
      .catch(() => setMessage('Unable to load notifications'));
  }, []);

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('careafterToken');
    try {
      await axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      setMessage('Unable to update notification');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Notifications</h1>
      {message && <p>{message}</p>}
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} style={{ marginBottom: 16 }}>
            <div>
              <strong>{notification.title}</strong>
              <span style={{ marginLeft: 10, opacity: notification.isRead ? 0.6 : 1 }}>
                {notification.isRead ? 'Read' : 'Unread'}
              </span>
            </div>
            <p>{notification.message}</p>
            <button onClick={() => markAsRead(notification.id)} disabled={notification.isRead}>
              Mark as read
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
