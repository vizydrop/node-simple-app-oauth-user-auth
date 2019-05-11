const requestPromise = require(`request-promise-native`);

module.exports = {
    getUserInfo: async (accessToken) => requestPromise({
        url: `https://www.googleapis.com/oauth2/v1/userinfo?alt=json`,
        method: `GET`,
        json: true,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }),
};
