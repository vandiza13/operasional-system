import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Pastikan kode ini tidak crash saat build jika env vars tidak ada
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Inisialisasi Redis hanya jika ada credential
export const redis = (redisUrl && redisToken) 
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

/**
 * Rate limiter untuk endpoint Login
 * Membatasi maksimal 5 percobaan (gagal/berhasil) per 5 menit untuk setiap IP.
 */
export const loginRateLimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '5 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/login',
    })
  : null;

/**
 * Rate limiter umum untuk mencegah spam form/action
 * Membatasi maksimal 10 request per menit untuk setiap IP.
 */
export const actionRateLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/action',
    })
  : null;

/**
 * Utility function to check login rate limit
 */
export async function checkLoginRateLimit(ip: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Jika redis belum disetup, kita loloskan saja agar aplikasi tidak error di local tanpa .env
  if (!loginRateLimit) {
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } = await loginRateLimit.limit(ip);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open: kalau redis down, biarkan user lewat daripada aplikasinya mati
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  }
}
