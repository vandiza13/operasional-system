import { completeDeleteAllData, checkDatabaseStatus } from '@/app/actions/database';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

/**
 * GET /api/reset - Check database status
 * POST /api/reset - Wipe all database data
 * 
 * WARNING: This endpoint DELETES all data permanently!
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

  const result = await checkDatabaseStatus();
  return Response.json(result);
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { confirm } = await request.json().catch(() => ({}));

    // Safety: require confirmation
    if (confirm !== 'WIPE_ALL_DATA') {
      return Response.json(
        {
          success: false,
          message: '⚠️ Confirmation required!',
          instruction: 'Send POST with { "confirm": "WIPE_ALL_DATA" } to delete all data'
        },
        { status: 400 }
      );
    }

    const result = await completeDeleteAllData();
    return Response.json(result);

  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Error processing request',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
