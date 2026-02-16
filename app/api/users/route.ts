import { getAllUsers, resetAndReseedUsers } from '@/app/actions/user';

/**
 * GET /api/users - See all users in database
 * POST /api/users - Reset and reseed database with fresh test users
 */

export async function GET() {
  const result = await getAllUsers();
  return Response.json(result);
}

export async function POST(request: Request) {
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
