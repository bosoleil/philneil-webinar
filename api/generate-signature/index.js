const crypto = require('crypto');

module.exports = async function (context, req) {
    const ZOOM_SDK_KEY = '08_aLcFuTqaz1BPhRoPfPQ';
    const ZOOM_SDK_SECRET = '13Ywl27OagPohsKm1wvUuF090P64ame7';

    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
        return {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    var meetingNumber = null;
    var role = 0;

    if (req.body && req.body.meetingNumber) {
        meetingNumber = req.body.meetingNumber;
        role = req.body.role || 0;
    } else if (req.query && req.query.meetingNumber) {
        meetingNumber = req.query.meetingNumber;
        role = req.query.role || 0;
    }

    if (!meetingNumber) {
        return {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Meeting number is required' })
        };
    }

    var iat = Math.round(Date.now() / 1000) - 30;
    var exp = iat + 60 * 60 * 2;

    var oHeader = { alg: 'HS256', typ: 'JWT' };
    var oPayload = {
        sdkKey: ZOOM_SDK_KEY,
        appKey: ZOOM_SDK_KEY,
        mn: String(meetingNumber),
        role: parseInt(role),
        iat: iat,
        exp: exp,
        tokenExp: exp
    };

    var sHeader = JSON.stringify(oHeader);
    var sPayload = JSON.stringify(oPayload);

    var header64 = Buffer.from(sHeader).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    var payload64 = Buffer.from(sPayload).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    var signInput = header64 + '.' + payload64;
    var sig = crypto.createHmac('sha256', ZOOM_SDK_SECRET).update(signInput).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    var token = signInput + '.' + sig;

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ signature: token, sdkKey: ZOOM_SDK_KEY })
    };
};
