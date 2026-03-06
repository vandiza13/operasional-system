import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';

const secretKey = process.env.SESSION_SECRET || 'fallback_secret_for_development_only_please_change';
const key = new TextEncoder().encode(secretKey);

export type SessionPayload = {
    userId: string;
    userName: string;
    userRole: Role;
};

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Set session expiry, e.g., 24 hours
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function createSession(userId: string, userName: string, userRole: Role) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ userId, userName, userRole });

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expires,
        sameSite: 'lax',
        path: '/',
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
