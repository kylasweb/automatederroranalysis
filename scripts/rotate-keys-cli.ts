#!/usr/bin/env node
import readline from 'readline';
import fs from 'fs';
import { rotateKeys } from './rotate-keys';

function ask(question: string) {
    const rl = readline.createInterface({ input: (process as any).stdin, output: (process as any).stdout });
    return new Promise<string>(resolve => {
        const q = (rl.question as any);
        q.call(rl, question, (ans: string) => { rl.close(); resolve(ans); });
    });
}

async function main() {
    const newSecret = process.env.NEW_SECRET;
    if (!newSecret) {
        console.error('Set NEW_SECRET before running this CLI');
        (process as any).exit?.(1);
    }

    const ans = await ask('This will rotate stored API keys and create a DB backup. Proceed? (yes/no) ');
    if (ans.toLowerCase() !== 'yes') {
        console.log('Aborted');
        (process as any).exit?.(0);
    }

    try {
        const res = await rotateKeys({ apply: true, newSecret });
        console.log('Rotation completed. Backup:', res.backupPath);
        const rb = await ask('Keep backup? (yes/no) ');
        if (rb.toLowerCase() !== 'yes') {
            if (res.backupPath && fs.existsSync(res.backupPath)) fs.unlinkSync(res.backupPath);
            console.log('Backup removed');
        }
    } catch (err) {
        console.error('Rotation failed:', err);
        (process as any).exit?.(1);
    }
}

if (require.main === module) main();
