import type { Config } from "tailwindcss";

export default {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			boxShadow: {
				'inset-soft': '0px 0px 8px 0px #FFFFFF inset',
				'inset-badge': '0px 0px 8px 0px rgba(255, 255, 255, 0.5) inset',
				'inset-glow': '0px 0px 24px 0px #FFFFFF80 inset',
				'inset-hard': '0px 0px 32px 0px #FFFFFF inset',
				"inset-strong": "inset 0px 0px 48px 0px #FFFFFF",
				'inset-heavy': '0px 0px 48px 0px #FFFFFF inset',
				'inset-avatar': '0px 0px 32px 6px #FFFFFF inset, 0px 0px 100px 0px #FFFFFF inset',
				'inset-hard-2': '0px 0px 32px 0px rgba(255, 255, 255, 1) inset',
				"inset-soft-glow": "inset 0px 0px 8px 0px #FFFFFF, inset 0px 0px 24px 0px #FFFFFF80",
				"inset-glow-64": "inset 0px 0px 64px 0px #FFFFFF",

			},
			textColor: {
				DEFAULT: '#bad7f5',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				borderColor: {
					DEFAULT: 'hsl(var(--border))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			animation: {
				'infinite-scroll': 'infinite-scroll 25s linear infinite',
			},
			keyframes: {
				'infinite-scroll': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-50%)' },
				}
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
