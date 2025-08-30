import { describe, it, expect, vi } from 'vitest';

describe('rotate-keys script', () => {
    it('dry-run does not update DB', async () => {
        const prisma = await import('@/lib/db');
        const realDb = prisma.db as any;

        // Mock findMany to return a single legacy payload
        const legacyPayload = 'iv:tag:encrypted';
        vi.spyOn(realDb.systemSetting, 'findMany').mockResolvedValue([{ id: 's1', key: 'groq_api_key', value: JSON.stringify(legacyPayload) }]);
        const updateSpy = vi.spyOn(realDb.systemSetting, 'update').mockResolvedValue({} as any);

        // Import the script module (it exports nothing; we just exercise it)
        const script = await import('../scripts/rotate-keys');
        expect(script).toBeTruthy();

        // Ensure update was not called during import (dry-run default)
        expect(updateSpy).not.toHaveBeenCalled();

        // restore
        updateSpy.mockRestore();
        (realDb.systemSetting.findMany as any).mockRestore();
    });
});
