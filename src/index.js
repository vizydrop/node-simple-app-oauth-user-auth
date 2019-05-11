const express = require('express');
const oauth = require('./oauth');
const bodyParser = require('body-parser');
const api = require('./api');

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    const app = {
        id: 'demoapp-oauth',
        name: 'Custom app oauth user auth ',
        version: '1.0',
        type: 'none',
        description: 'Custom app with oauth user auth',
        authentication: [
            {
                id: 'oauth2',
                name: 'OAuth v2 Authentication',
                description: 'OAuth v2-based authentication and authorization for access to Google Drive',
                fields: [
                    {
                        title: 'callback_uri',
                        description: 'OAuth post-auth redirect URI',
                        type: 'oauth',
                        id: 'callback_uri',
                    },
                ],
            },
        ],
        sources: [],
        responsibleFor: {
            userAuthentication: true
        }
    };

    res.json(app);
});

app.get('/oauth2', (req, res) => {
    try {
        const {
            callback_uri: callbackUri,
            query
        } = req.query;

        const redirectUri = oauth.getAuthorizeUrl(callbackUri, query);
        res.json({
            redirect_uri: redirectUri
        })
    } catch (err) {
        res
            .status(401)
            .json({message: `Unauthorized`});
    }
});

app.post('/oauth2', async (req, res) => {
    try {
        const tokens = await oauth.getAccessToken(req.body.code, req.body.fields.callback_uri);
        res.json(tokens);
    } catch (err) {
        res
            .status(401)
            .json({message: 'Unauthorized'});
    }
});

app.post('/authenticate', async (req, res) => {
    try {
        const userInfo = await api.getUserInfo(req.body.fields.access_token);
        res.json({
            name: userInfo.name,
            id: userInfo.id,
            email: userInfo.email,
            companies: [
                {
                    host: userInfo.id,
                    groups: ['collaborators'],
                    title: userInfo.name
                }
            ]
        });
    } catch (err) {
        res
            .status(401)
            .json({message: 'Unauthorized'});
    }
});


app.post('/validate', async (req, res) => {
    try {
        const {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiration: tokenExpiration
        } = req.body;

        const refreshedTokenInfo = (await oauth.refreshTokenIfNeeded(
            refreshToken,
            parseInt(tokenExpiration),
        )) || {};

        const userInfo = await api.getUserInfo(accessToken);

        res.json({
            ...refreshedTokenInfo,
            name: userInfo.name,
        });
    } catch (err) {
        res
            .status(401)
            .json({message: 'Unauthorized'});
    }
});

const port = process.env.PORT || 8083;

app.listen(port, () => {
    console.log(`server is up and running on port ${port}`);
});
