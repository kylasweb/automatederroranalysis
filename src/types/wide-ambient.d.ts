// Broad ambient declarations to reduce TypeScript noise in the editor environment.
// These are intentionally permissive placeholders — replace with proper typings
// or install @types/* packages for long-term correctness.

// Note: real React types are provided by @types/react — do not override them here to avoid
// masking proper library types. This file intentionally avoids declaring the `react` module
// so the project's installed @types/react can be used.

declare module 'next/server' {
    export type NextRequest = any;
    export const NextResponse: any;
}

declare module 'next' {
    export type NextConfig = any;
    export type Metadata = any;
}

declare module '@prisma/client' {
    export const PrismaClient: any;
    export type PrismaClient = any;
    // Provide both type and runtime placeholders for enums used as values in the code
    export type AlertType = any;
    export const AlertType: any;
    export type AlertStatus = any;
    export const AlertStatus: any;
    export type User = any;
    export const User: any;
    export type SystemSetting = any;
    export const SystemSetting: any;
}

declare module 'socket.io' {
    export class Server {
        constructor(...args: any[]);
        on(event: string, cb: (...args: any[]) => void): any;
        to(room: string): { emit(event: string, payload?: any): any };
        emit(event: string, payload?: any): any;
        sockets: any;
        engine?: any;
    }
}

declare module 'lucide-react' {
    const _default: any;
    export default _default;
    export const Icon: any;
    // Common icons used across the repo — declare as any
    export const Plus: any;
    export const Edit: any;
    export const Trash2: any;
    export const Bot: any;
    export const Settings: any;
    export const Play: any;
    export const Pause: any;
    export const Copy: any;
    export const Eye: any;
    export const MoreHorizontal: any;
    export const FileText: any;
    export const Upload: any;
    export const Brain: any;
    export const Github: any;
    export const ExternalLink: any;
    export const MessageSquare: any;
    export const Loader2: any;
    export const Key: any;
    export const Shield: any;
    export const ChevronDown: any;
    export const ChevronLeft: any;
    export const ChevronRight: any;
    // Icon-suffixed aliases used across the codebase
    export const ChevronDownIcon: any;
    export const ChevronLeftIcon: any;
    export const ChevronRightIcon: any;
    export const CheckIcon: any;
    export const CircleIcon: any;
    export const XIcon: any;
    export const MinusIcon: any;
    export const SearchIcon: any;
    export const InfoIcon: any;
    export const PanelLeftIcon: any;
    export const MoreHorizontalIcon: any;
    export const TrendingUpIcon: any;
    export const FileTextIcon: any;
    export const UploadIcon: any;
    export const ArrowLeft: any;
    export const ArrowRight: any;
    export const PanelLeft: any;
    export const Minus: any;
    export const Check: any;
    export const Square: any;
    export const Circle: any;
    export const Triangle: any;
    export const TrendingUp: any;
    export const Info: any;
    export const GripVertical: any;
    export const GripVerticalIcon: any;
    export const ChevronUp: any;
    export const ChevronUpIcon: any;
    export const SquareIcon: any;
    export const TriangleIcon: any;
    export const TrendingUpIcon: any;
    export const InfoIcon: any;
    // Additional icons referenced across the app
    export const Download: any;
    export const Filter: any;
    export const Calendar: any;
    export const User: any;
    export const Zap: any;
    export const CheckCircle: any;
    export const Clock: any;
    export const XCircle: any;
    export const AlertTriangle: any;
    export const Activity: any;
    export const Database: any;
    export const GitBranch: any;
    export const Users: any;
    export const Plug: any;
    export const TestTube: any;
    export const Mail: any;
    export const Globe: any;
    export const Save: any;
    export const RefreshCw: any;
    export const Bell: any;
    export const LayoutDashboard: any;
    export const X: any;
    export const Workflow: any;
}

declare module 'class-variance-authority' {
    export function cva(...args: any[]): any;
    export type VariantProps<T = any> = any;
}

declare module '@radix-ui/react-dialog' { export const Root: any; export const Trigger: any; export const Content: any; export const Portal: any; export const Overlay: any; export const Close: any; export const Title: any; export const Description: any; }
declare module '@radix-ui/react-popover' { export const Root: any; export const Trigger: any; export const Content: any; export const Portal: any; export const Anchor: any; }
declare module '@radix-ui/react-select' { export const Root: any; export const Trigger: any; export const Content: any; export const Item: any; export const Group: any; export const Value: any; export const Icon: any; export const Portal: any; export const Viewport: any; export const Label: any; export const ItemIndicator: any; export const ItemText: any; export const Separator: any; export const ScrollUpButton: any; export const ScrollDownButton: any; }
declare module '@radix-ui/react-slot' { export const Slot: any; }
declare module '@radix-ui/react-label' { export const Root: any; }

declare module 'react-day-picker' { export const DayPicker: any; export const DayButton: any; export function getDefaultClassNames(): any; }
declare module 'embla-carousel-react' { export type UseEmblaCarouselType = any; export default any; }
declare module 'cmdk' { export const Command: any; export default any; }
declare module 'vaul' { export const Drawer: any; }

declare module 'react-hook-form' { export const Controller: any; export const FormProvider: any; export function useFormContext(): any; export function useFormState(opts?: any): any; export type ControllerProps<TFieldValues = any, TName = any> = any; export type FieldPath<T> = any; export type FieldValues = any; }

declare module 'sonner' { export const toast: any; export const Toaster: any; export type ToasterProps = any; }

declare module 'clsx' { const cx: any; export default cx; }

declare module 'react-day-picker' { export const DayPicker: any; }

declare module 'input-otp' { export const OTPInput: any; export const OTPInputContext: any; }

// Generic fallback to silence any other untyped imports
// avoid broad wildcard declarations which can hide real package typings

// Node globals (extend existing node-globals if present)
declare var require: any;
declare var module: any;
declare var __dirname: string;
declare var __filename: string;
declare var process: {
    env: { [key: string]: string | undefined };
    argv: string[];
    cwd(): string;
    stdin?: any;
    stdout?: any;
    stderr?: any;
    exit(code?: number): void;
    on?(ev: string, cb: (...args: any[]) => void): any;
};
