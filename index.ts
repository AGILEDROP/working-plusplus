/**
 * Working PlusPlus++
 * Like plusplus.chat, but one that actually works, because you can host it yourself! 😉
 *
 * @see https://github.com/tdmalone/working-plusplus
 * @see https://expressjs.com/en/4x/api.html
 * @author Tim Malone <tdmalone@gmail.com>
 */

const app = require('./src/app');

const slack = require('./src/slack');

require('dotenv').config();

const fs = require('fs');
const mime = require('mime');
const express = require('express');
const bodyParser = require('body-parser');
const slackClient = require('@slack/client');

/* eslint-disable no-process-env, no-magic-numbers */
const PORT = process.env.SCOREBOT_PORT || 80; // Let Heroku set the port.
const SLACK_OAUTH_ACCESS_TOKEN = process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN;
const protocol = process.env.SCOREBOT_USE_SSL !== '1' ? 'http://' : 'https://';
const frontendUrl = process.env.SCOREBOT_LEADERBOARD_URL;
const FRONTEND_URL = protocol + frontendUrl;
/* eslint-enable no-process-env, no-magic-numbers */

/**
 * Starts the server and bootstraps the app.
 *
 * @param {object} options Optional. Allows passing in replacements for the default Express server
 *                         module (`express` property) and Slack Web API client module (`slack`
 *                         property).
 * @returns {http.Server} A Node.js http.Server object as returned by Express' listen method. See
 *                        https://expressjs.com/en/4x/api.html#app.listen and
 *                        https://nodejs.org/api/http.html#http_class_http_server for details.
 */
const bootstrap = (options = { express, slack }) => {
  // Allow alternative implementations of both Express and Slack to be passed in.
  const server = options.express || express();
  slack.setSlackClient(
    options.slack || new slackClient.WebClient(SLACK_OAUTH_ACCESS_TOKEN),
  );

  server.use((req: Express.Request, res: Express.Request, next: () => void) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
  });

  server.use(bodyParser.json());
  server.enable('trust proxy');
  server.get('/', app.handleGet);
  server.post('/', app.handlePost);

  // Static assets.
  server.get('/assets/*', (request: { _parsedUrl: { path: string } }, response: { setHeader: any, send: any }) => {
    const path = `src/${request._parsedUrl.path}`;
    const type = mime.getType(path);

    response.setHeader('Content-Type', type);
    response.send(fs.readFileSync(path));
  });

  // Additional routes.
  server.get('/leaderboard', app.handleGet);
  server.get('/channels', app.handleGet);
  server.get('/fromusers', app.handleGet);
  server.get('/karmafeed', app.handleGet);
  server.get('/userprofile', app.handleGet);

  return server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
  });
}; // Bootstrap.

// If module was called directly, bootstrap now.
if (require.main === module) {
  bootstrap();
}

export { };

module.exports = bootstrap;