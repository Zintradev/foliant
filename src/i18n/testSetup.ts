import { loadLanguage } from './translations';

// Pre-load Spanish in test environment so synchronous component tests with language="es" find cached translations
await loadLanguage('es');
await loadLanguage('en');
