// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',    // Brand purple
        secondary: '#22D3EE',  // Brand cyan
        accent: '#F59E0B',     // Accent amber
        surface: '#F9FAFB',    // Light surface
        darkSurface: '#1F2937',// Dark surface
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'deep': '0 10px 15px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
