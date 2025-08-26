// theme.ts

// Color constants for backward compatibility
export const COLORS = {
  // Brand Colors
  primary: "hsl(154, 86%, 47%)", // Emerald
  "primary-foreground": "hsl(0, 0%, 100%)",
  "primary-glow": "hsl(154, 86%, 65%)",
  secondary: "hsl(193, 100%, 46%)", // Neon Blue
  "secondary-foreground": "hsl(0, 0%, 100%)",
  "secondary-glow": "hsl(193, 100%, 65%)",
  accent: "hsl(200, 14%, 77%)", // Silver
  "accent-foreground": "hsl(220, 13%, 18%)",
  
  // Background System
  background: "hsl(198, 100%, 7%)",
  "background-secondary": "hsl(220, 100%, 4%)",
  foreground: "hsl(0, 0%, 98%)",
  
  // Card
  card: "hsl(200, 50%, 12%)",
  "card-foreground": "hsl(0, 0%, 98%)",
  "card-border": "hsl(200, 30%, 20%)",
  
  // States
  border: "hsl(200, 30%, 25%)",
  muted: "hsl(200, 30%, 20%)",
  "muted-foreground": "hsl(200, 10%, 70%)",
  destructive: "hsl(0, 84%, 60%)",
  "destructive-foreground": "hsl(0, 0%, 98%)",
} as const;

// Theme object for new components
export const theme = {
  colors: COLORS,
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontFamily: {
    orbitron: "Orbitron",
    roboto: "Roboto",
  },
} as const;

export default theme;