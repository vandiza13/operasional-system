import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'fallback_secret_for_development_only_please_change';
const key = new TextEncoder().encode(secretKey);

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN';

export type SessionPayload = {
    userId: string;
    userName: string;
    userRole: UserRole;
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
