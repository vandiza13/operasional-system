import { completeDeleteAllData, checkDatabaseStatus } from '@/app/actions/database';

/**
 * GET /api/reset - Check database status
 * POST /api/reset - Wipe all database data
 * 
 * WARNING: This endpoint DELETES all data permanently!
 */

export async function GET() {
  const result = await checkDatabaseStatus();
  return Response.json(result);
}

export async function POST(request: Request) {
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
