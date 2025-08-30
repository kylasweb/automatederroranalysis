// Ambient declarations for third-party modules that lack type packages in this
// environment. We intentionally do NOT declare React/JSX here so the project's
// installed @types/react can provide correct types for hooks, ComponentProps,
// and JSX.

// Common UI libraries used across the repo (fallbacks)
declare module 'lucide-react' { const anyExport: any; export = anyExport; }
declare module 'class-variance-authority' { const anyExport: any; export = anyExport; }
declare module 'cmdk' { const anyExport: any; export = anyExport; }
declare module 'recharts' { const anyExport: any; export = anyExport; }
declare module 'react-day-picker' { const anyExport: any; export = anyExport; }
declare module 'embla-carousel-react' { const anyExport: any; export = anyExport; }
declare module 'input-otp' { const anyExport: any; export = anyExport; }
declare module 'react-hook-form' { const anyExport: any; export = anyExport; }
declare module 'react-resizable-panels' { const anyExport: any; export = anyExport; }
declare module 'vaul' { const anyExport: any; export = anyExport; }
declare module 'next-themes' { const anyExport: any; export = anyExport; }
declare module 'sonner' { const anyExport: any; export = anyExport; }

// Radix UI wildcard
declare module '@radix-ui/*' { const anyExport: any; export = anyExport; }
declare module '@radix-ui/react-*' { const anyExport: any; export = anyExport; }

// Next.js and related
declare module 'next/link' { const anyExport: any; export = anyExport; }
declare module 'next/navigation' { const anyExport: any; export = anyExport; }

// Other packages
declare module 'z-ai-web-dev-sdk' { const anyExport: any; export = anyExport; }

// Images/SVG imports
declare module '*.svg' { const content: any; export default content; }
declare module '*.png' { const content: any; export default content; }
declare module '*.jpg' { const content: any; export default content; }
