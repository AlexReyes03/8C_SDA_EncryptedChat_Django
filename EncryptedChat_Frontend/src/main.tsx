import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Librerías base
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Estilos globales de la aplicación
import './assets/css/global-styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
