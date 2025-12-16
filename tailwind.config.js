/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        // Tokens semánticos para roles
        'role-admin': 'var(--color-role-admin)',
        'role-admin-bg': 'var(--color-role-admin-bg)',
        'role-admin-text': 'var(--color-role-admin-text)',
        'role-operador': 'var(--color-role-operador)',
        'role-operador-bg': 'var(--color-role-operador-bg)',
        'role-operador-text': 'var(--color-role-operador-text)',
        'role-analista': 'var(--color-role-analista)',
        'role-analista-bg': 'var(--color-role-analista-bg)',
        'role-analista-text': 'var(--color-role-analista-text)',
        'role-default': 'var(--color-role-default)',
        'role-default-bg': 'var(--color-role-default-bg)',
        'role-default-text': 'var(--color-role-default-text)',
      },
    },
  },
  plugins: [],
}
