
import 'dotenv/config';

const url = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('--- DATABASE_URL Check ---');
if (!url) {
    console.log('DATABASE_URL is missing or empty.');
} else {
    console.log(`Length: ${url.length}`);
    const protocol = url.split('://')[0];
    console.log(`Protocol: ${protocol}://`);
    console.log(`Starts with postgresql:// or postgres://: ${url.startsWith('postgresql://') || url.startsWith('postgres://')}`);

    if (url.includes('?')) {
        console.log('Params:', url.split('?')[1]);
    }
}

console.log('\n--- DIRECT_URL Check ---');
if (!directUrl) {
    console.log('DIRECT_URL is missing or empty.');
} else {
    console.log(`Length: ${directUrl.length}`);
    const protocol = directUrl.split('://')[0];
    console.log(`Protocol: ${protocol}://`);
}
