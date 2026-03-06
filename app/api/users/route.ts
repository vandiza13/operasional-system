import { getAllUsers, resetAndReseedUsers } from '@/app/actions/user';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

/**
 * GET /api/users - See all users in database
 * POST /api/users - Reset and reseed database with fresh test users
 * PROTECTED: Only SUPER_ADMIN can access.
 */

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !session.userId) return null;
  const userId = session.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== 'SUPER_ADMIN') return null;
  return user;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const result = await getAllUsers();
  return Response.json(result);
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json().catch(() => ({}));

  if (action === 'reset') {
    const result = await resetAndReseedUsers();
    return Response.json(result);
  }

  return Response.json({
    success: false,
    message: 'Invalid action. Use action: "reset" to reset database'
  });
}
