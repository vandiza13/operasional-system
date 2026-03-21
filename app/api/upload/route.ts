// File: app/api/upload/route.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // [SOP: KEAMANAN] Pastikan hanya user yang login yang bisa upload
        const session = await getSession();
        if (!session?.userId) {
          throw new Error('Unauthorized: Anda harus login untuk mengunggah file');
        }
        
        return {
          // Batasi hanya menerima format gambar
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Opsional: Log saat file berhasil masuk ke Vercel Blob
        console.log(`✅ Upload sukses: ${blob.url} oleh User ID:`, JSON.parse(tokenPayload || '{}').userId);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}