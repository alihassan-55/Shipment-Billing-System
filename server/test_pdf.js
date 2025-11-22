
import 'dotenv/config';
import { s3Client } from './src/config/supabase.js';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

async function testUpload() {
    console.log('Testing Supabase Storage Upload via S3 Protocol...');

    if (!s3Client) {
        console.error('S3 client invalid or not initialized. Check .env');
        return;
    }

    const testBuffer = Buffer.from('S3 Protocol Test Content');
    const fileName = `s3-test-file-${Date.now()}.txt`;

    try {
        // 1. Upload
        console.log(`Uploading ${fileName}...`);
        const uploadCommand = new PutObjectCommand({
            Bucket: 'invoices',
            Key: fileName,
            Body: testBuffer,
            ContentType: 'text/plain'
        });

        const uploadRes = await s3Client.send(uploadCommand);
        console.log('Upload Successful!', uploadRes);

        // 2. Download
        console.log(`Downloading ${fileName}...`);
        const downloadCommand = new GetObjectCommand({
            Bucket: 'invoices',
            Key: fileName
        });

        const dlRes = await s3Client.send(downloadCommand);
        const chunks = [];
        for (const chunk of await dlRes.Body.transformToByteArray()) {
            chunks.push(chunk);
        }
        const downloadedBuffer = Buffer.from(chunks);

        if (downloadedBuffer.toString() === testBuffer.toString()) {
            console.log('Download Successful! Content matches.');
        } else {
            console.error('Download Failed! Content mismatch.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testUpload();
