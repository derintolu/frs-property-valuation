import React from 'react';
import { createRoot } from 'react-dom/client';
import { PropertyValuation } from './PropertyValuation';
import '../index.css';

console.log('FRS Property Valuation widget loaded');

function init() {
  const container = document.getElementById('frs-pv-root');
  if (container) {
    console.log('Mounting Property Valuation widget');
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <PropertyValuation />
      </React.StrictMode>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
