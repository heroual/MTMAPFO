
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import i18n from './lib/i18n/config';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

// Suppress Recharts defaultProps warning in React 18.3+
const error = console.error;
console.error = (...args: any[]) => {
  if (/defaultProps/.test(args[0])) return;
  error(...args);
};

const container = document.getElementById('root');

if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>
);
