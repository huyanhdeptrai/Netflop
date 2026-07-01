import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FavoritesProvider } from './services/FavoritesContext';
import { HistoryProvider } from './services/HistoryContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HistoryProvider>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </HistoryProvider>
  </StrictMode>,
);
