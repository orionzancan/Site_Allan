import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070709',
          900: '#09090b',
          850: '#101014',
          800: '#16161c',
          700: '#1f1f27'
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          dark: 'rgb(var(--brand-primary-dark-rgb) / <alpha-value>)'
        }
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'Impact', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
