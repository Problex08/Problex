import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GitHub dark theme palette — semantic tokens used throughout the app.
        canvas:     '#0d1117', // page background
        surface:    '#161b22', // card / raised surface background
        line:       '#30363d', // border color
        fg:         '#e6edf3', // primary text
        muted:      '#8b949e', // secondary/muted text
        critical:   '#f85149', // red
        warning:    '#d29922', // amber
        suggestion: '#58a6ff', // blue
        success:    '#3fb950', // green
      },
    },
  },
  plugins: [],
};
export default config;
