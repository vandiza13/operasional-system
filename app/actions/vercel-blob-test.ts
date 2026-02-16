'use server'

// File untuk testing Vercel Blob configuration
// Jalankan di terminal: npx ts-node app/actions/vercel-blob-test.ts

export async function testVercelBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  console.log('🔍 Vercel Blob Configuration Check:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1. Check token exists
  if (!token) {
    console.log('❌ BLOB_READ_WRITE_TOKEN: NOT SET');
    console.log('   Action: Set BLOB_READ_WRITE_TOKEN in .env.local');
    return { success: false, reason: 'Token not found' };
  }
  
  console.log('✅ BLOB_READ_WRITE_TOKEN: SET');
  console.log(`   Token (first 30 chars): ${token.substring(0, 30)}...`);
  
  // 2. Check token format
  if (!token.startsWith('vercel_blob_rw_')) {
    console.log('❌ Token Format: INVALID');
    console.log('   Expected: vercel_blob_rw_xxxxx_token_xxxxx');
    return { success: false, reason: 'Invalid token format' };
  }
  
  console.log('✅ Token Format: VALID (starts with vercel_blob_rw_)');
  
  // 3. Try to import @vercel/blob
  try {
    const { put } = await import('@vercel/blob');
    console.log('✅ @vercel/blob: INSTALLED');
  } catch (error) {
    console.log('❌ @vercel/blob: NOT INSTALLED');
    console.log('   Action: npm install @vercel/blob');
    return { success: false, reason: '@vercel/blob not installed' };
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Vercel Blob configuration looks good!');
  console.log('\n📝 Next steps:');
  console.log('1. Make sure BLOB_READ_WRITE_TOKEN is also set in Vercel Dashboard');
  console.log('2. Try uploading a file through the reimbursement form');
  console.log('3. Check browser console for the file URL');
  
  return { success: true, message: 'Configuration is valid' };
}

// Run test if called directly
if (require.main === module) {
  testVercelBlob().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}
