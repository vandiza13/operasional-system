import { cookies } from 'next/headers';
import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { encrypt, decrypt, type SessionPayload } from './session-crypto';

export async function createSession(userId: string, userName: string, userRole: Role) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Cast userRole to session-crypto UserRole type which matches the prisma Role enum values
    const session = await encrypt({ userId, userName, userRole: userRole as any });

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

export async function getVerifiedSession() {
    const session = await getSession();
    if (!session || !session.userId) return null;

    return {
        userId: session.userId,
        userName: session.userName,
        userRole: session.userRole as Role
    };
}

