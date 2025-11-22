import { createClient } from '@supabase/supabase-js';
import { S3Client } from '@aws-sdk/client-s3';
import { configDotenv } from 'dotenv';

configDotenv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.supabaseUrl;
const supabaseKey = process.env.SUPABASE_KEY || process.env.supabaseKey || process.env.SUPABASE_ANON_KEY;

let supabase;
let s3Client;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);


    // Explicit S3 Configuration
    const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const s3Region = process.env.S3_REGION;
    const s3Endpoint = process.env.S3_ENDPOINT;

    // 1. Try Explicit S3 Config
    if (s3AccessKeyId && s3SecretAccessKey && s3Region && s3Endpoint) {
        console.log('Initializing S3 Client with explicit configuration...');
        s3Client = new S3Client({
            forcePathStyle: true,
            region: s3Region,
            endpoint: s3Endpoint,
            credentials: {
                accessKeyId: s3AccessKeyId,
                secretAccessKey: s3SecretAccessKey,
            },
        });
    }
    // 2. Fallback to Supabase URL derivation (if explicit config missing)
    else {
        console.log('Initializing S3 Client derived from Supabase URL (Fallback)...');
        // Parse Project Ref and Region from URL
        // Example: https://[project_ref].supabase.co
        let projectRef;
        try {
            const url = new URL(supabaseUrl);
            projectRef = url.hostname.split('.')[0];
        } catch (e) {
            console.error('Failed to parse Supabase URL for S3 config:', e);
        }

        if (projectRef) {
            s3Client = new S3Client({
                forcePathStyle: true,
                region: 'ap-south-1', // Default region, usually doesn't matter for Supabase Storage but required by SDK
                endpoint: `${supabaseUrl}/storage/v1/s3`,
                credentials: {
                    accessKeyId: projectRef,
                    secretAccessKey: supabaseKey, // Service Role Key bypasses RLS
                },
            });
        }
    }

} else {
    console.warn('--------------------------------------------------------------------------------');
    console.warn('WARNING: Supabase credentials not found in environment variables.');
    console.warn('Please add SUPABASE_URL and SUPABASE_KEY to your .env file.');
    console.warn('File uploads and downloads WILL FAIL until this is fixed.');
    console.warn('--------------------------------------------------------------------------------');

    // Mock client to prevent server crash on startup
    supabase = {
        storage: {
            from: () => ({
                upload: async () => ({ error: new Error('Supabase not configured. Check server logs.') }),
                download: async () => ({ error: new Error('Supabase not configured. Check server logs.') }),
            })
        }
    };

    // Mock S3 client
    s3Client = {
        send: async () => { throw new Error('Supabase not configured. Check server logs.') }
    };
}

export { supabase, s3Client };
