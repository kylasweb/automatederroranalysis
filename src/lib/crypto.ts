import crypto from 'crypto';

// Uses AES-256-GCM for authenticated encryption
const KEY_ENV = process.env.SECRET_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.SECRET || '';

function getKeyFromEnv(env?: string): Buffer {
    const keySeed = env || KEY_ENV || 'default_fallback_secret';
    return crypto.createHash('sha256').update(keySeed).digest();
}

export type EncryptedRecord = {
    encryptionVersion: number;
    payload: string; // iv:tag:enc (base64 parts)
};

function encryptPayload(plain: string, envKey?: string): string {
    const iv = crypto.randomBytes(12);
    const key = getKeyFromEnv(envKey);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptPayload(payload: string, envKey?: string): string {
    const [ivB, tagB, encB] = payload.split(':');
    if (!ivB || !tagB || !encB) return payload;
    const iv = Buffer.from(ivB, 'base64');
    const tag = Buffer.from(tagB, 'base64');
    const encrypted = Buffer.from(encB, 'base64');
    const key = getKeyFromEnv(envKey);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

/**
 * Create an encrypted record object. This allows tracking encryptionVersion for future rotation.
 */
export function encryptSecret(plain: string, envKey?: string): EncryptedRecord {
    const payload = encryptPayload(plain, envKey);
    return { encryptionVersion: 1, payload };
}

/**
 * Decrypt an encrypted payload. Accepts either a raw legacy string (iv:tag:enc) or
 * a JSON-like EncryptedRecord (object or stringified) and returns plaintext. If decryption fails, returns original input.
 */
export function decryptSecret(raw: any, envKey?: string): string {
    try {
        // If raw is a string that looks like JSON, try to parse
        let parsed = raw;
        if (typeof raw === 'string') {
            try {
                parsed = JSON.parse(raw);
            } catch {
                // not JSON, leave as-is
            }
        }

        if (parsed && typeof parsed === 'object' && 'payload' in parsed) {
            // EncryptedRecord
            const rec = parsed as EncryptedRecord;
            return decryptPayload(rec.payload, envKey);
        }

        if (typeof parsed === 'string') {
            // legacy raw payload
            return decryptPayload(parsed, envKey);
        }

        return String(raw);
    } catch (error) {
        console.error('Failed to decrypt secret, returning original payload:', error);
        return typeof raw === 'string' ? raw : JSON.stringify(raw);
    }
}

/**
 * Helper to wrap an encrypted payload into an EncryptedRecord and return a JSON string for storage.
 */
export function wrapEncryptedForStorage(encryptedRecord: EncryptedRecord) {
    return JSON.stringify(encryptedRecord);
}

