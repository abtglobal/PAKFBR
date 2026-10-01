import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enforce 100% virgin clean slate on root bootstrap
if (typeof window !== 'undefined') {
  const VIRGIN_SLATE_KEY = 'paktax_virgin_state_v5';
  if (!localStorage.getItem(VIRGIN_SLATE_KEY)) {
    try {
      localStorage.clear();
      localStorage.setItem(VIRGIN_SLATE_KEY, 'true');
    } catch (_) {}
  }
}

createRoot(document.getElementById('root')!).render(<App />);
