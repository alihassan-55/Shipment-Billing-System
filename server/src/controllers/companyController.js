import { prisma } from '../db/client.js';
import { s3Client, supabase } from '../config/supabase.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function getCompanyProfile(req, res) {
    try {
        let profile = await prisma.companyProfile.findFirst();
        if (!profile) {
            profile = await prisma.companyProfile.create({
                data: { name: 'Courier Billing System' }
            });
        }
        return res.json(profile);
    } catch (error) {
        console.error('Error fetching company profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

export async function updateCompanyProfile(req, res) {
    try {
        const { name, address, email, phone, website } = req.body;
        const existing = await prisma.companyProfile.findFirst();

        let profile;
        if (existing) {
            profile = await prisma.companyProfile.update({
                where: { id: existing.id },
                data: { name, address, email, phone, website }
            });
        } else {
            profile = await prisma.companyProfile.create({
                data: { name, address, email, phone, website }
            });
        }
        return res.json(profile);
    } catch (error) {
        console.error('Error updating company profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
}

export async function uploadLogo(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        console.log(`[DEBUG] Uploading file: ${fileName} to bucket: company-assets`);

        // Upload to Supabase Storage (S3)
        const command = new PutObjectCommand({
            Bucket: 'company-assets',
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await s3Client.send(command);
        console.log('[DEBUG] S3 Upload successful');

        // ---------------------------------------------------------
        // Robust Public URL Generation
        // ---------------------------------------------------------
        // We need: https://[PROJECT_REF].supabase.co/storage/v1/object/public/company-assets/[FILENAME]
        // The environment variables might only have S3_ENDPOINT which includes 'storage' subdomain or extra paths.

        let projectRef = '';
        const candidates = [
            process.env.SUPABASE_URL,
            process.env.supabaseUrl,
            process.env.S3_ENDPOINT,
            process.env.s3Endpoint
        ];

        for (const url of candidates) {
            if (!url) continue;
            try {
                const urlObj = new URL(url);
                // Example hostname: wgfzdbcmfrhyjggulrjm.storage.supabase.co
                const parts = urlObj.hostname.split('.');
                if (parts.length > 0 && parts[0] !== 'localhost') {
                    projectRef = parts[0];
                    break;
                }
            } catch (e) {
                // ignore invalid urls
            }
        }

        let publicUrl;
        if (projectRef) {
            publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/company-assets/${fileName}`;
        } else {
            // Fallback to SDK (might generate the storage.supabase.co URL which has been problematic, but it's a backup)
            console.warn('[WARN] Could not find Project Ref from env. Using default SDK url generation.');
            const { data } = supabase.storage.from('company-assets').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
        }

        console.log('[DEBUG] Final Public URL:', publicUrl);

        // Update Profile in DB
        const existing = await prisma.companyProfile.findFirst();
        let profile;
        if (existing) {
            profile = await prisma.companyProfile.update({
                where: { id: existing.id },
                data: { logoUrl: publicUrl }
            });
        } else {
            profile = await prisma.companyProfile.create({
                data: {
                    name: 'Courier Billing System',
                    logoUrl: publicUrl
                }
            });
        }

        return res.json({ profile, publicUrl });
    } catch (error) {
        console.error('Error uploading logo:', error);
        return res.status(500).json({ error: 'Failed to upload logo' });
    }
}
