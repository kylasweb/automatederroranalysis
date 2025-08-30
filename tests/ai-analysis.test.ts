import { describe, it, expect } from 'vitest';
import { parsePythonTraceback, buildStructuredAnalysis } from '../src/lib/ai-analysis';

const sampleTraceback = `Traceback (most recent call last):\n  File \"/app/main.py\", line 10, in <module>\n    result = do_work(data)\n  File \"/app/worker.py\", line 47, in do_work\n    value = int(payload['count'])\nValueError: invalid literal for int() with base 10: 'abc'`;

describe('parsePythonTraceback', () => {
    it('parses frames and exception correctly', () => {
        const tb = parsePythonTraceback(sampleTraceback as string);
        expect(tb).not.toBeNull();
        expect(tb!.frames.length).toBeGreaterThan(0);
        expect(tb!.exception).toBe('ValueError');
        expect(tb!.message).toContain("invalid literal");
    });
});

describe('buildStructuredAnalysis', () => {
    it('builds markdown with expected sections', () => {
        const analysis = buildStructuredAnalysis(sampleTraceback as string, 'ValueError: invalid literal', { isIntermittent: false, needsFix: true }, { techStack: 'Python', environment: 'local', entities: { timestamps: [], serviceNames: [], errorCodes: [], ipAddresses: [] } });
        expect(analysis).toContain('### 1. Analysis');
        expect(analysis).toContain('**Error Type:**');
        expect(analysis).toContain('### 2. Proposed Solution');
        expect(analysis).toContain('```python');
        expect(analysis).toContain('### 3. Verification');
    });
});
