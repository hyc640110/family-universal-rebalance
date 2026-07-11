import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<ErrorBoundary><HashRouter><App /></HashRouter></ErrorBoundary>);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => undefined);
  });
}
