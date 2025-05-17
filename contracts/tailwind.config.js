// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      './app/**/*.{js,ts,jsx,tsx}',     // your App Router pages & layouts
      './components/**/*.{js,ts,jsx,tsx}', 
      './hooks/**/*.{js,ts,jsx,tsx}',
      // add other folders where you use Tailwind classes
    ],
    theme: {
      extend: {
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
          // add others if needed
        },
      },
    },
    plugins: [],
  };
  