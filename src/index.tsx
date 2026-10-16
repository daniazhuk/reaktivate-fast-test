import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { stores } from './bootstrap';
import { StoresContext } from './Shared/Stores/Stores.context';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoresContext value={stores}>
      <App />
    </StoresContext>
  </StrictMode>,
);
