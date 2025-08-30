import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { decryptSecret, encryptSecret, wrapEncryptedForStorage, EncryptedRecord } from '@/lib/crypto';

/**
 * Usage:
 *   NEW_SECRET="..." node ./scripts/rotate-keys.js --dry-run
 *
 * This script will re-encrypt all SystemSetting entries whose key includes 'api_key'.
 * It supports dry-run mode and will not persist changes unless --apply is passed.
 * It will also create a backup copy of the sqlite DB file before applying.
 */

async function backupSqlite(dbUrl: string) {
    if (!dbUrl || !dbUrl.startsWith('file:')) return null;
    const filePath = dbUrl.replace('file:', '');
    if (!fs.existsSync(filePath)) return null;
    const dest = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, dest);
    return dest;
}

export async function rotateKeys(opts?: { apply?: boolean, newSecret?: string }) {
    const apply = opts?.apply ?? false;
    const newSecret = opts?.newSecret ?? process.env.NEW_SECRET;

    if (!newSecret) {
        console.error('NEW_SECRET environment variable is required to rotate keys');
        throw new Error('NEW_SECRET required');
    }

    const prisma = new PrismaClient();
    const dryRun = !apply;
    // Attempt a DB backup if using sqlite
    const dbUrl = process.env.DATABASE_URL || '';
    const backupPath = await backupSqlite(dbUrl);
    if (backupPath) {
        console.log('Database backup created at', backupPath);
    } else {
        console.log('No sqlite DB backup made (DATABASE_URL not sqlite or file missing)');
    }

    console.log('Fetching system settings with api_key...');
    const settings = await prisma.systemSetting.findMany({ where: { key: { contains: 'api_key' } } });

    for (const s of settings) {
        try {
            // Parse stored value: may be stringified JSON of EncryptedRecord or legacy string
            let parsed: any = s.value;
            try { parsed = JSON.parse(s.value); } catch { }

            let plain: string | null = null;

            // If stored as object with encryptionVersion/payload use decryptSecret directly
            if (parsed && typeof parsed === 'object' && parsed.payload) {
                plain = decryptSecret(parsed);
            } else if (typeof parsed === 'string') {
                // legacy raw payload
                plain = decryptSecret(parsed);
            }

            if (!plain) {
                console.warn(`Failed to decrypt setting ${s.key}, skipping`);
                continue;
            }

            // Re-encrypt using NEW_SECRET
            const reencryptedRecord: EncryptedRecord = encryptSecret(plain, newSecret);
            const storageValue = wrapEncryptedForStorage(reencryptedRecord);

            console.log(`${dryRun ? '[DRY-RUN]' : '[APPLY]'} Setting ${s.key}: will re-encrypt (id=${s.id})`);
            if (apply) {
                await prisma.systemSetting.update({ where: { id: s.id }, data: { value: storageValue, encryptionVersion: 1 } });
                console.log(`Updated ${s.key}`);
            }
        } catch (err) {
            console.error('Error processing setting', s.key, err);
        }
    }
    await prisma.$disconnect();
    console.log('Done');
    return { backupPath };
}

// If script is run directly (node ./scripts/rotate-keys.js), execute with CLI args
try {
    if (typeof require !== 'undefined' && require.main === module) {
        const args = process.argv.slice(2);
        const apply = args.includes('--apply');
        (async () => {
            try {
                await rotateKeys({ apply });
            } catch (err) {
                console.error(err);
                (process as any).exit(1);
            }
        })();
    }
} catch (e) {
    // ignore in environments without require
}
