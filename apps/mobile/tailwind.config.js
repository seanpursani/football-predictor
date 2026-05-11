/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#080808',
        surface: '#141414',
        elevated: '#1C1C1C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#7A7A7A',
        'text-muted': '#404040',
        'border-subtle': '#1E1E1E',
        'border-active': '#B4FF32',
        accent: '#B4FF32',
        success: '#B4FF32',
        jackpot: '#FFD700',
        captain: '#FFD700',
        deadline: '#FF6B35',
        streak: '#A78BFA',
        miss: '#303030',
      },
      spacing: {
        'space-1': 4,
        'space-2': 8,
        'space-3': 12,
        'space-4': 16,
        'space-5': 24,
        'space-6': 32,
        'space-8': 48,
      },
      borderRadius: {
        'radius-sm': 4,
        'radius-md': 6,
        'radius-lg': 8,
        'radius-full': 9999,
      },
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
