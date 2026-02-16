import { seedTestUsers } from '@/app/actions/seed';

/**
 * GET /api/seed
 * Endpoint untuk membuat test users di database
 * Jalankan SEKALI saja: http://localhost:3000/api/seed
 */
export async function GET() {
  try {
    // Call seed function
    const result = await seedTestUsers();
    
    return Response.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('API seed error:', error);
    return Response.json(
      { success: false, message: 'Error running seed' },
      { status: 500 }
    );
  }
}
