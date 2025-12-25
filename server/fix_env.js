
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

function fixEnv() {
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found!');
        return;
    }

    let content = fs.readFileSync(envPath, 'utf8');
    let lines = content.split('\n');
    let dbUrl = '';
    let directUrl = '';
    let newLines = [];

    console.log(`Processing ${lines.length} lines in .env...`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('#')) {
            newLines.push(line);
            continue;
        }

        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            let value = line.substring(idx + 1).trim();

            if (key === 'DATABASE_URL') {
                console.log(`Found DATABASE_URL on line ${i + 1}. Raw value: ${value}`);

                // Aggressive: remove all quotes
                value = value.replace(/['"]/g, '');

                // Ensure pgbouncer=true
                if (value.includes(':6543') && !value.includes('pgbouncer=true')) {
                    value += (value.includes('?') ? '&' : '?') + 'pgbouncer=true';
                }

                dbUrl = value;
                newLines.push(`DATABASE_URL="${dbUrl}"`);
            } else if (key === 'DIRECT_URL') {
                // Strip quotes
                value = value.replace(/['"]/g, '');
                directUrl = value;
            } else {
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    }

    if (dbUrl) {
        if (!directUrl || directUrl === '') {
            // Derive
            directUrl = dbUrl.replace(':6543', ':5432')
                .replace('?pgbouncer=true', '')
                .replace('&pgbouncer=true', '');
            if (directUrl.endsWith('?')) directUrl = directUrl.slice(0, -1);
        }

        newLines.push(`DIRECT_URL="${directUrl}"`);
    }

    const newContent = newLines.join('\n');

    fs.writeFileSync(envPath, newContent);

    console.log('Fixed .env file:');
    console.log(`- DATABASE_URL: ${dbUrl}`);
    console.log(`- DIRECT_URL: ${directUrl}`);
}

fixEnv();
