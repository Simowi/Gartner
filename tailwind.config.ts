import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#154212',
        'primary-container': '#2d5a27',
        secondary: '#4a7c59',
        'secondary-container': '#d4e8d0',
        tertiary: '#7c6a2d',
        'tertiary-container': '#f0e0a0',
        background: '#fcf9f2',
        surface: '#f7f4ed',
        'surface-low': '#f0ece3',
        'surface-container': '#e8e4db',
        'surface-lowest': '#fdfaf3',
        'on-surface': '#1c1c18',
        'on-surface-variant': '#4a4a42',
        'on-primary': '#ffffff',
        'outline-variant': '#c4c0b7',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
