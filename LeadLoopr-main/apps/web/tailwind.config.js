/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'], // used by next-themes (attribute="class")
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: { '2xl': '1400px' },
		},
		extend: {
			fontFamily: {
				sans: [
					'Inter',
					'ui-sans-serif',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'Noto Sans',
					'sans-serif',
				],
				inter: ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',

				// Optional: keep these chart colors you already had
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},

				// Glass + palette (lets you use bg-glass, text-glass-foreground, etc.)
				glass: {
					DEFAULT: 'hsl(var(--glass))',
					foreground: 'hsl(var(--glass-foreground))',
					border: 'hsl(var(--glass-border))',
				},

				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					muted: 'hsl(var(--primary-muted))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))',
					muted: 'hsl(var(--secondary-muted))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},

			// ⬇️ These make bg-gradient-primary / -secondary work
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-background': 'var(--gradient-background)',
				'gradient-glass': 'var(--gradient-glass)',
			},

			// Optional: lets you use shadow-glass / shadow-glow utilities
			boxShadow: {
				glass: 'var(--shadow-glass)',
				glow: 'var(--shadow-glow)',
				'glow-secondary': 'var(--shadow-glow-secondary)',
				elevated: 'var(--shadow-elevated)',
			},

			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},

			// Optional: exposes Lovable keyframes as tailwind animations
			keyframes: {
				float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
				glow: { '0%': { boxShadow: 'var(--shadow-glow)' }, '100%': { boxShadow: '0 0 60px hsl(var(--primary) / 0.6)' } },
				marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(calc(-100% - 1rem))' } },
				'marquee-vertical': { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(calc(-100% - 1rem))' } },
			},
			animation: {
				float: 'float 6s ease-in-out infinite',
				glow: 'glow 2s ease-in-out infinite alternate',
				marquee: 'marquee var(--duration, 40s) linear infinite',
				'marquee-vertical': 'marquee-vertical var(--duration, 40s) linear infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
