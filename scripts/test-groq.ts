import { aiProviderService } from '../src/lib/ai-providers';

async function run() {
    try {
        const res = await aiProviderService.testConnection('groq');
        console.log('Groq test result:', res);
    } catch (err) {
        console.error('Groq test failed:', err);
    }
}

run();
