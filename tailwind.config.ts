import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'sans-serif'],
        'sans': ['var(--font-geist-sans)', 'sans-serif'],
        'mono': ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
