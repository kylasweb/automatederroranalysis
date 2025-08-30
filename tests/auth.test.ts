import { describe, it, expect, vi } from 'vitest';
import { parseSessionToken, getUserFromRequest } from '@/lib/auth';

describe('auth helper', () => {
    it('parses demo session tokens', () => {
        const token = Buffer.from('user-123:1234567890').toString('base64');
        const parsed = parseSessionToken(token);
        expect(parsed).toBe('user-123');
    });

    it('returns null for invalid token', () => {
        expect(parseSessionToken('not-base64')).toBeNull();
    });

    it('getUserFromRequest falls back to demo token and returns user', async () => {
        // Build a fake NextRequest-like object
        const fakeReq: any = { headers: { get(k: string) { if (k.toLowerCase() === 'authorization') return 'Bearer ' + Buffer.from('user-123:1').toString('base64'); return null; } } };

        // Mock prisma user lookup
        const db = await import('@/lib/db');
        const spy = vi.spyOn(db, 'db' as any, 'get');
        // Instead of spying the getter we directly mock db.user.findUnique
        const mockUser = { id: 'user-123', email: 'a@b.com', role: 'ADMIN' } as any;
        const realDb = db.db as any;
        vi.spyOn(realDb.user, 'findUnique').mockResolvedValue(mockUser);

        const user = await getUserFromRequest(fakeReq as any);
        expect(user).toBeTruthy();
        expect(user?.id).toBe('user-123');

        // restore
        (realDb.user.findUnique as any).mockRestore();
        spy.mockRestore();
    });
});
