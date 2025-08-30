import { NextRequest } from 'next/server';
import { db } from '@/lib/db'

// Try to import next-auth server helpers if available. We'll lazy import to avoid hard dependency at runtime.
async function tryGetServerSession(request: NextRequest): Promise<any> {
    try {
        // Prefer importing the app's authOptions and next-auth's getServerSession (app router compatible)
        const { authOptions } = await import('./authOptions');
        const getServerSession = (await import('next-auth/next')).getServerSession;
        if (!getServerSession || !authOptions) return null;

        // getServerSession in app router can accept (req, res, authOptions) shapes; here we provide a minimal request-like object
        const session = await getServerSession({ req: { headers: request.headers } } as any, {} as any, authOptions as any);
        return session;
    } catch (err) {
        return null;
    }
}

/**
 * Parse session token created by /api/auth/login (demo fallback)
 * Format (demo): base64("<userId>:<timestamp>")
 */
export function parseSessionToken(token: string | null | undefined) {
    if (!token) return null;

    try {
        if (token.startsWith('Bearer ')) token = token.slice(7).trim();
        // Basic validation: ensure token is valid base64; invalid strings may decode to garbled output
        // Use a conservative regex to check base64 characters and padding
        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (!base64Regex.test(token)) return null;
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        if (parts.length < 1) return null;
        const userId = parts[0];
        if (!userId) return null;
        return userId;
    } catch (err) {
        return null;
    }
}

/**
 * Returns the user object if the request is authenticated, otherwise null.
 * Primary path: NextAuth getServerSession (if configured). Fallback: demo token parsing.
 */
export async function getUserFromRequest(request: NextRequest) {
    // Try NextAuth session first
    const session = await tryGetServerSession(request);
    if (session && session.user && session.user.id) {
        const user = await db.user.findUnique({ where: { id: String(session.user.id) } });
        if (user) return user;
    }

    // Fallback: demo token in Authorization or x-session-token
    const authHeader = request.headers.get('authorization');
    const sessionHeader = request.headers.get('x-session-token');
    const token = authHeader?.startsWith('Bearer') ? authHeader : sessionHeader || authHeader;
    const userId = parseSessionToken(token || undefined);
    if (!userId) return null;

    const user = await db.user.findUnique({ where: { id: userId } });
    return user || null;
}
