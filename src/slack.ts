/**
 * Handles sending of messages - i.e. outgoing messages - back to Slack, via Slack's Web API. See
 * also ./events.js, which handles incoming messages from subscribed events.
 *
 * TODO: This file should probably be renamed to 'slack.js' so it can handle all other requests to
 *       the Slack APIs rather than just sending.
 *
 * @see https://api.slack.com/web
 */

'use strict';

let slack, users;

/**
 * Injects the Slack client to be used for all outgoing messages.
 *
 * @param {WebClient} client An instance of Slack's WebClient as documented at
 *                           https://slackapi.github.io/node-slack-sdk/web_api and
 *                           implemented at
 *                           https://github.com/slackapi/node-slack-sdk/blob/master/src/WebClient.ts
 * @returns {void}
 */
const setSlackClient = (client: string) => {
  slack = client;
};

/**
 * Retrieves a list of all users in the linked Slack team. Caches it in memory.
 *
 * @returns {object} A collection of Slack user objects, indexed by the user IDs (Uxxxxxxxx).
 */
const getUserList = async () => {

  if (users) {
    return users;
  }

  console.log('Retrieving user list from Slack.');

  users = {};
  const userList = await slack.users.list();

  if (!userList.ok) {
    throw Error('Error occurred retrieving user list from Slack.');
  }

  for (const user of userList.members) {
    users[user.id] = user;
  }

  return users;

}; // GetUserList.

/**
 * Given a Slack user ID, returns the user's real name or optionally, the user's username. If the
 * user *does not* have a real name set, their username is returned regardless.
 *
 * @param {string} userId   A Slack user ID in the format Uxxxxxxxx.
 * @param {bool}   username Whether the username should always be returned instead of the real name.
 * @returns {string} The user's real name, as per their Slack profile.
 */
const getUserName = async (userId: string, username = false) => {

  const users = await getUserList();
  let user = users[userId];

  if ('undefined' === typeof user) {

    //Get new list from slack and match the id
    const userList = await slack.users.list();

    user = userList.members.find((user: { id: string; }) => user.id == userId);
  }

  //If still not found return unknown
  if ('undefined' === typeof user) {
    return '(unknown)';
  }

  return username || !user.profile.real_name ? user.name : user.profile.real_name;

};

/**
 * Sends a message to a Slack channel.
 *
 * @param {string|Object} text    Either message text to send, or a Slack message payload. See the
 *                                docs at https://api.slack.com/methods/chat.postMessage and
 *                                https://api.slack.com/docs/message-formatting.
 * @param {string}        channel The ID of the channel to send the message to. Can alternatively
 *                                be provided as part of the payload in the previous argument.
 * @return {Promise} A Promise to send the message to Slack.
 */
const sendMessage = (text: string, channel: string) => {

  let payload = {
    channel,
    text
  };

  // If 'text' was provided as an object instead, merge it into the payload.
  if ('object' === typeof text) {
    delete payload.text;
    payload = Object.assign(payload, text);
  }

  return new Promise((resolve, reject) => {
    slack.chat.postMessage(payload).then((data) => {

      if (!data.ok) {
        console.error('Error occurred posting response.');
        return reject();
      }

      resolve();

    });

  }); // Return new Promise.
}; // SendMessage.
/**
 * Sends an Ephemeral message to a Slack channel.
 *
 * @param {string|Object} text    Either message text to send, or a Slack message payload. See the
 *                                docs at https://api.slack.com/methods/chat.postMessage and
 *                                https://api.slack.com/docs/message-formatting.
 * @param {string}        channel The ID of the channel to send the message to. Can alternatively
 *                                be provided as part of the payload in the previous argument.
 * @param {string}        user    UserId to sent the message to.
 * @return {Promise} A Promise to send the message to Slack.
 */
const sendEphemeral = (text: string, channel: string, user: string) => {

  let payload = {
    channel,
    text,
    user
  };

  // If 'text' was provided as an object instead, merge it into the payload.
  if ('object' === typeof text) {
    delete payload.text;
    payload = Object.assign(payload, text);
  }

  return new Promise((resolve, reject) => {
    slack.chat.postEphemeral(payload).then((data) => {

      if (!data.ok) {
        console.error('Error occurred posting response.');
        return reject();
      }

      resolve();

    });

  }); // Return new Promise.
}; // SendMessage.

/**
 *
 * Filters the channel array.
 *
 * @param {array} channelData
 *   Single item from array.
 * @returns {boolean}
 *   Returns T|F.
 */
function channelFilter(channelData: { id: string }) {
  return this === channelData.id;
}

/**
 *
 * Gets the channel name from slack api.
 *
 * @param {string} channelId
 *   ChannelId to get name for.
 * @returns {Promise}
 *   Returned promise./
 */
const getChannelName = async (channelId: string) => {
  const channelList = await slack.conversations.list({
    // eslint-disable-next-line camelcase
    exclude_archived: true,
    types: 'public_channel,private_channel',
    limit: 1000
  });
  const channel = channelList.channels.filter(channelFilter, channelId);

  if ('undefined' === typeof channel) {
    return '(unknown)';
  }

  return channel[0].name;

};

export { };

module.exports = {
  setSlackClient,
  getUserList,
  getUserName,
  sendMessage,
  getChannelName,
  sendEphemeral
};