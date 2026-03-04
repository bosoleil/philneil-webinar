const crypto = require('crypto');

module.exports = async function (context, req) {
    const ZOOM_SDK_KEY = '08_aLcFuTqaz1BPhRoPfPQ';
    const ZOOM_SDK_SECRET = '13Ywl27OagPohsKm1wvUuF090P64ame7';

    const meetingNumber = req.body?.meetingNumber || req.query?.meetingNumber;
    const role = req.body?.role || req.query?.role || 0;

    if (!meetingNumber) {
        context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Meeting number is required' })
        };
        return;
    }

    const iat = Math.round(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

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

    function base64url(source) {
        let encodedSource = Buffer.from(source).toString('base64');
        encodedSource = encodedSource.replace(/=+$/, '');
        encodedSource = encodedSource.replace(/\+/g, '-');
        encodedSource = encodedSource.replace(/\//g, '_');
        return encodedSource;
    }

    const stringToSign = base64url(JSON.stringify(oHeader)) + '.' + base64url(JSON.stringify(oPayload));
    const signature = crypto.createHmac('sha256', ZOOM_SDK_SECRET)
        .update(stringToSign)
        .digest('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const token = stringToSign + '.' + signature;

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ signature: token, sdkKey: ZOOM_SDK_KEY })
    };
};
