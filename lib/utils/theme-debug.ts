/**
 * Theme debugging utilities for development
 */

export function debugThemeState() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const themeData = {
    localStorage: localStorage.getItem('stride-theme'),
    htmlClass: document.documentElement.className,
    systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    timestamp: new Date().toISOString()
  };

  console.log('🎨 Theme Debug State:', themeData);
  return themeData;
}

export function logThemeChange(from: string, to: string, source: string) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log(`🎨 Theme Change: ${from} → ${to} (source: ${source})`);
}

export function validateThemeConsistency() {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = localStorage.getItem('stride-theme');
  const htmlHasDark = document.documentElement.classList.contains('dark');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let expectedDark = false;
  if (stored === 'dark') {
    expectedDark = true;
  } else if (stored === 'light') {
    expectedDark = false;
  } else {
    expectedDark = systemDark;
  }

  const isConsistent = htmlHasDark === expectedDark;

  if (!isConsistent && process.env.NODE_ENV === 'development') {
    console.warn('🎨 Theme Inconsistency Detected:', {
      stored,
      htmlHasDark,
      systemDark,
      expectedDark,
      isConsistent
    });
  }

  return isConsistent;
}