import dotenv from 'dotenv';
import { JWT } from 'google-auth-library';

dotenv.config();

async function checkCreds() {
    try {
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!email || !key) {
            console.log("MISSING_CREDS");
            return;
        }

        console.log(`Checking creds for: ${email}`);

        const jwt = new JWT({
            email: email,
            key: key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        await jwt.authorize();
        console.log("AUTH_SUCCESS");

    } catch (e) {
        console.log("AUTH_FAILED");
        console.error(e.message);
    }
}

checkCreds();
