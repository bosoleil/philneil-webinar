const { app } = require('@azure/functions');
const crypto = require('crypto');

app.http('generate-signature', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const ZOOM_SDK_KEY = '08_aLcFuTqaz1BPhRoPfPQ';
        const ZOOM_SDK_SECRET = '13Ywl27OagPohsKm1wvUuF090P64ame7';

        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return { status: 204, headers };
        }

        let meetingNumber = null;
        let role = 0;

        // Try to get from body
        try {
            const body = await request.json();
            meetingNumber = body.meetingNumber;
            role = body.role || 0;
        } catch (e) {
            // Not JSON body, try query params
        }

        // Try query params
        if (!meetingNumber) {
            meetingNumber = request.query.get('meetingNumber');
            role = request.query.get('role') || 0;
        }

        if (!meetingNumber) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Meeting number is required' })
            };
        }

        const iat = Math.round(Date.now() / 1000) - 30;
        const exp = iat + 60 * 60 * 2; // 2 hours

        const oHeader = { alg: 'HS256', typ: 'JWT' };
        const oPayload = {
            sdkKey: ZOOM_SDK_KEY,
            appKey: ZOOM_SDK_KEY,
            mn: String(meetingNumber),
            role: parseInt(role),
            iat: iat,
            exp: exp,
            tokenExp: exp
        };

        const header64 = Buffer.from(JSON.stringify(oHeader)).toString('base64')
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const payload64 = Buffer.from(JSON.stringify(oPayload)).toString('base64')
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

        const signInput = header64 + '.' + payload64;
        const sig = crypto.createHmac('sha256', ZOOM_SDK_SECRET)
            .update(signInput)
            .digest('base64')
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

        const token = signInput + '.' + sig;

        return {
            status: 200,
            headers,
            body: JSON.stringify({ signature: token, sdkKey: ZOOM_SDK_KEY })
        };
    }
});
