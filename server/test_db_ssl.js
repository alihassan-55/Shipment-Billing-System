
import tls from 'tls';
import { URL } from 'url';
import 'dotenv/config';

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
if (!dbUrl) process.exit(1);

const parsed = new URL(dbUrl);
const host = parsed.hostname;
const port = parsed.port || 5432;

console.log(`Testing TLS connection to ${host}:${port}...`);

const socket = tls.connect(port, host, {
    rejectUnauthorized: false, // Supabase certs should be valid
    servername: host // SNI is often required
}, () => {
    console.log('✅ TLS Connection established!');
    console.log('Authorized:', socket.authorized);
    if (!socket.authorized) {
        console.log('Authorization Error:', socket.authorizationError);
    }
    socket.end();
});

socket.on('error', (err) => {
    console.error('❌ TLS Connection Error:', err);
});

socket.setTimeout(5000);
socket.on('timeout', () => {
    console.error('❌ TLS Timeout');
    socket.destroy();
});
