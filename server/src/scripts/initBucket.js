import { s3Client } from '../config/supabase.js';
import { CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

async function initBucket() {
    const bucketName = 'company-assets';

    try {
        console.log(`Checking if bucket '${bucketName}' exists...`);
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket '${bucketName}' already exists.`);
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            console.log(`Bucket '${bucketName}' not found. Creating...`);
            try {
                await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
                console.log(`Bucket '${bucketName}' created successfully.`);

                // Note: Supabase S3 API might not support PutBucketPolicy for public access directly via standard S3 commands
                // usually you need to set this in Supabase Dashboard.
                // But we can try setting CORS.

                console.log('Setting CORS policy...');
                await s3Client.send(new PutBucketCorsCommand({
                    Bucket: bucketName,
                    CORSConfiguration: {
                        CORSRules: [
                            {
                                AllowedHeaders: ['*'],
                                AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
                                AllowedOrigins: ['*'], // Adjust for production
                                ExposeHeaders: []
                            }
                        ]
                    }
                }));
                console.log('CORS policy set.');

            } catch (createError) {
                console.error('Failed to create bucket:', createError);
                process.exit(1);
            }
        } else {
            console.error('Error checking bucket:', error);
            process.exit(1);
        }
    }
}

initBucket();
