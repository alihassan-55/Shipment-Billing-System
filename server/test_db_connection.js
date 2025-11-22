
import net from 'net';
import dns from 'dns';
import { URL } from 'url';
import 'dotenv/config';

console.log('--- Database Connectivity Diagnostic ---');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL is missing!');
    process.exit(1);
}

try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const port = parsed.port || 5432;

    console.log(`Target: ${host}:${port}`);

    // 1. DNS Lookup
    console.log(`\n1. Performing DNS lookup for ${host}...`);
    dns.lookup(host, (err, address, family) => {
        if (err) {
            console.error('❌ DNS Lookup failed:', err.message);
        } else {
            console.log(`✅ DNS Lookup successful: ${address} (IPv${family})`);

            // 2. TCP Connection Test
            console.log(`\n2. Testing TCP connection to ${address}:${port}...`);
            const socket = new net.Socket();
            socket.setTimeout(5000); // 5s timeout

            socket.on('connect', () => {
                console.log('✅ TCP Connection successful!');
                socket.destroy();
            });

            socket.on('timeout', () => {
                console.error('❌ TCP Connection timed out (Firewall/Network issue?)');
                socket.destroy();
            });

            socket.on('error', (err) => {
                console.error(`❌ TCP Connection error: ${err.message}`);
            });

            socket.connect(port, address);
        }
    });

} catch (e) {
    console.error('Error parsing DATABASE_URL:', e.message);
}
