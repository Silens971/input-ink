 import type { Config } from "tailwindcss";
 
 export default {
   darkMode: ["class"],
   content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
   prefix: "",
   theme: {
     container: {
       center: true,
       padding: "2rem",
       screens: {
         "2xl": "1400px",
       },
     },
     extend: {
       fontFamily: {
         sans: ["Inter", "system-ui", "sans-serif"],
         mono: ["JetBrains Mono", "Fira Code", "monospace"],
       },
       colors: {
         border: "hsl(var(--border))",
         input: "hsl(var(--input))",
         ring: "hsl(var(--ring))",
         background: "hsl(var(--background))",
         foreground: "hsl(var(--foreground))",
         primary: {
           DEFAULT: "hsl(var(--primary))",
           foreground: "hsl(var(--primary-foreground))",
         },
         secondary: {
           DEFAULT: "hsl(var(--secondary))",
           foreground: "hsl(var(--secondary-foreground))",
         },
         destructive: {
           DEFAULT: "hsl(var(--destructive))",
           foreground: "hsl(var(--destructive-foreground))",
         },
         muted: {
           DEFAULT: "hsl(var(--muted))",
           foreground: "hsl(var(--muted-foreground))",
         },
         accent: {
           DEFAULT: "hsl(var(--accent))",
           foreground: "hsl(var(--accent-foreground))",
         },
         popover: {
           DEFAULT: "hsl(var(--popover))",
           foreground: "hsl(var(--popover-foreground))",
         },
         card: {
           DEFAULT: "hsl(var(--card))",
           foreground: "hsl(var(--card-foreground))",
         },
         recording: {
           DEFAULT: "hsl(var(--recording))",
           glow: "hsl(var(--recording-glow))",
         },
         success: {
           DEFAULT: "hsl(var(--success))",
           foreground: "hsl(var(--success-foreground))",
         },
         grid: {
           DEFAULT: "hsl(var(--grid))",
           accent: "hsl(var(--grid-accent))",
         },
         canvas: "hsl(var(--canvas))",
         trajectory: {
           DEFAULT: "hsl(var(--trajectory))",
           glow: "hsl(var(--trajectory-glow))",
         },
         center: "hsl(var(--center-point))",
       },
       borderRadius: {
         lg: "var(--radius)",
         md: "calc(var(--radius) - 2px)",
         sm: "calc(var(--radius) - 4px)",
       },
       keyframes: {
         "accordion-down": {
           from: { height: "0" },
           to: { height: "var(--radix-accordion-content-height)" },
         },
         "accordion-up": {
           from: { height: "var(--radix-accordion-content-height)" },
           to: { height: "0" },
         },
         "pulse-recording": {
           "0%, 100%": { opacity: "1" },
           "50%": { opacity: "0.5" },
         },
       },
       animation: {
         "accordion-down": "accordion-down 0.2s ease-out",
         "accordion-up": "accordion-up 0.2s ease-out",
         "pulse-recording": "pulse-recording 1s ease-in-out infinite",
       },
     },
   },
   plugins: [require("tailwindcss-animate")],
 } satisfies Config;
