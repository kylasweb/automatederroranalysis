import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { NextAuthOptions } from 'next-auth';
import { db } from './db';

export const authOptions: NextAuthOptions = {
    providers: [
        // Credentials provider for demo (replace with secure in prod)
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials) return null;
                const user = await db.user.findUnique({ where: { email: credentials.email } });
                if (!user) return null;
                // In production verify password properly
                if (credentials.password === 'admin123' && user.role === 'ADMIN') {
                    return { id: user.id, email: user.email, name: user.name } as any;
                }
                return null;
            }
        }),
        // Optional GitHub provider placeholder
        GitHubProvider({ clientId: process.env.GITHUB_ID || '', clientSecret: process.env.GITHUB_SECRET || '' }),
    ],
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,
};
