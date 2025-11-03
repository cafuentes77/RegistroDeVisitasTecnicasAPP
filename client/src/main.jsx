// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { SnackbarProvider } from 'notistack';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={3000}
      // 👇 Variantes personalizadas
      classes={{
        variantSuccess: 'snackbar-success',
        variantError: 'snackbar-error',
        variantWarning: 'snackbar-warning', // ← amarillo para actualizaciones
      }}
    >
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);
