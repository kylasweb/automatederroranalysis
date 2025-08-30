declare var process: {
    env: { [key: string]: string | undefined };
    argv: string[];
    cwd(): string;
    stdin?: any;
    stdout?: any;
    stderr?: any;
    exit?(code?: number): void;
};

declare var Buffer: any;
