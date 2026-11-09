/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Master Design Tokens
        navy: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C3D7EC',
          300: '#92B7DC',
          400: '#5A92C8',
          500: '#3272B1',
          600: '#235A94',
          700: '#1C4877',
          800: '#1A3F67',
          900: '#163A5F', // Primary Brand Navy
          950: '#0E243D',
        },
        teal: {
          50: '#F0FDFB',
          100: '#CCFBF6',
          200: '#99F6EC',
          300: '#5EE8DC',
          400: '#2CD2C5',
          500: '#13A89E', // Accent Brand Teal
          600: '#0E8880',
          700: '#0F6D67',
          800: '#115753',
          900: '#134845',
          950: '#042A29',
        },
        canvas: '#F5F7FA', // Master Background
        // Backward-compatible alias for existing UI components
        civic: {
          50: '#F0F5FA',
          100: '#CCFBF6',
          200: '#99F6EC',
          300: '#5EE8DC',
          400: '#2CD2C5',
          500: '#13A89E', // maps to Teal
          600: '#0E8880',
          700: '#1C4877',
          800: '#163A5F', // maps to Navy
          900: '#0E243D',
          950: '#081728',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(22, 58, 95, 0.08), 0 8px 10px -6px rgba(22, 58, 95, 0.04)',
        'glow-teal': '0 0 20px -3px rgba(19, 168, 158, 0.35)',
      }
    },
  },
  plugins: [],
}
