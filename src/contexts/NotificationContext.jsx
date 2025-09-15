import React, { createContext, useContext, useState } from 'react';
import { generateId } from '../utils/basic';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = (message, kind = 'info', timeout = 4000) => {
    const id = generateId();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  };

  const value = { show, toasts };
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 30000 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            marginBottom: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: t.kind === 'error' ? '#ff3b30' : t.kind === 'warning' ? '#ffcc00' : '#2ecc71',
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}>{t.message}</div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};
