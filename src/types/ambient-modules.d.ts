// Minimal ambient module declarations to reduce TypeScript noise in this workspace.
// These declare modules used by the UI components so tsc doesn't error when @types
// packages are not installed in this environment. They should be replaced by
// proper @types packages or real typings in a real dev setup.

declare module 'react-hook-form' {
    export const Controller: any;
    export const FormProvider: any;
    export function useFormContext(): any;
    export function useFormState(opts?: any): any;
    export type ControllerProps<TFieldValues = any, TName = any> = any;
    export type FieldPath<T> = any;
    export type FieldValues = any;
}

declare module '@radix-ui/react-label' {
    export const Root: any;
}

declare module '@radix-ui/react-slot' {
    export const Slot: any;
}

declare module '@radix-ui/react-dialog' { export const Root: any; export const Trigger: any; export const Content: any; export const Portal: any; }
declare module '@radix-ui/react-popover' { export const Root: any; export const Trigger: any; export const Content: any; export const Portal: any; }
declare module '@radix-ui/react-select' { export const Root: any; export const Trigger: any; export const Content: any; export const Item: any; }

declare module 'lucide-react' { export const Icon: any; export const ChevronDown: any; export const Menu: any; export const Search: any; export default any; }
declare module 'recharts' {
    export const ResponsiveContainer: any;
    export const Tooltip: any;
    export const Legend: any;
    export type LegendProps = any;
    export namespace RechartsPrimitive { export type LegendProps = any; export const Legend: any; export const Tooltip: any; export const ResponsiveContainer: any; }
    const RechartsPrimitive: any;
    export default RechartsPrimitive;
}
declare module 'next-themes' { export function useTheme(): any; }

declare module 'sonner' { export const toast: any; export const Toaster: any; }

declare module 'next/link' { const Link: any; export default Link; }
declare module 'next/navigation' { export function useRouter(): any; export function usePathname(): string; export function useSearchParams(): any; }

declare module 'clsx' { const cx: any; export default cx; }

declare module '@headlessui/react' { export const Menu: any; export const Dialog: any; export const Transition: any; }

// Fallback for any untyped package import used by UI
// note: avoid a global wildcard module declaration here — it can mask real types
