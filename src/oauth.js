const requestPromise = require(`request-promise-native`);

const CLIENT_ID = process.env.ENV_CLIENT_ID;
const CLIENT_SECRET = process.env.ENV_CLIENT_SECRET;

const REFRESH_TOKEN_THRESHOLD = 2 * 60 * 1000;

function getTokenExpiration(expiresIn) {
    return new Date().getTime() + (expiresIn * 1000);
}

module.exports = {
    getAuthorizeUrl: function getAuthorizeUrl(callbackUri, query) {
        let queryParams = {};

        if (query) {
            queryParams = JSON.parse(query);
        }

        queryParams.access_type = `offline`;
        queryParams.redirect_uri = callbackUri;
        queryParams.response_type = `code`;
        queryParams.client_id = CLIENT_ID;
        queryParams.prompt = `consent`;
        queryParams.scope = `profile`;

        const queryParamsStr = Object.keys(queryParams)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
            .join(`&`);


        return `https://accounts.google.com/o/oauth2/v2/auth?${queryParamsStr}`;
    },
    getAccessToken: async function getAccessToken(code, callbackUri) {
        const tokens = await requestPromise({
            url: `https://www.googleapis.com/oauth2/v4/token`,
            method: `POST`,
            json: true,
            formData: {
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: callbackUri,
                grant_type: `authorization_code`,
            },
        });

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiration: getTokenExpiration(tokens.expires_in),
        };
    },
    refreshTokenIfNeeded: async function refreshTokenIfNeeded(refreshToken, tokenExpiration) {
        if (!refreshToken || !tokenExpiration || new Date().getTime() + REFRESH_TOKEN_THRESHOLD < tokenExpiration) {
            return null;
        }

        const tokens = await requestPromise({
            url: `https://www.googleapis.com/oauth2/v4/token`,
            method: `POST`,
            json: true,
            formData: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: `refresh_token`,
            },
        });

        return {
            access_token: tokens.access_token,
            token_expiration: getTokenExpiration(tokens.expires_in),
        };
    },
};
