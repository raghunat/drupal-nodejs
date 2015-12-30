/**
 * Submodule for router callbacks.
 */
'use strict';

/**
 * Constructor.
 */
function Routes() {
  // Dependencies are injected by a middleware into the request object in each route callback.
  // Available objects:
  //   - request.clientManager
  //   - request.clientManager.backend
  //   - request.clientManager.settings
}

/**
 * Callback that wraps all requests and checks for a valid service key.
 */
Routes.prototype.checkServiceKey = function (request, response, next) {
  if (request.clientManager.backend.checkServiceKey(request.header('NodejsServiceKey', ''))) {
    next();
  }
  else {
    response.send({'error': 'Invalid service key.'});
  }
};

/**
 * Http callback - read in a JSON message and publish it to interested clients.
 */
Routes.prototype.publishMessage = function (request, response) {
  if (request.clientManager.settings.debug) {
    console.log('publishMessage: request body follows');
    console.log(request.body);
  }

  if (!request.body.channel && !request.body.broadcast) {
    response.send({error: 'Required parameters are missing.'});
    return;
  }

  var sentCount = 0;

  if (request.body.broadcast) {
    if (request.clientManager.settings.debug) {
      console.log('Broadcasting message');
    }
    request.clientManager.broadcastMessage(request.body);
    sentCount = request.clientManager.getSocketCount();
  }
  else {
    sentCount = request.clientManager.publishMessageToChannel(request.body);
  }

  process.emit('message-published', request.body, sentCount);
  response.send({status: 'success', sent: sentCount});
};


/**
 * Kicks the given logged in user from the server.
 */
Routes.prototype.kickUser = function (request, response) {
  if (request.params.uid) {
    request.clientManager.kickUser(request.params.uid);
    response.send({'status': 'success'});
    return;
  }
  console.log('Failed to kick user, no uid supplied');
  response.send({'status': 'failed', 'error': 'missing uid'});
};

/**
 * Logout the given user from the server.
 */
Routes.prototype.logoutUser = function (request, response) {
  var authToken = request.params.authtoken || '';
  if (authToken) {
    console.log('Logging out http session', authToken);
    request.clientManager.kickUser(authToken);
    response.send({'status': 'success'});
    return;
  }
  console.log('Failed to logout user, no authToken supplied');
  response.send({'status': 'failed', 'error': 'missing authToken'});
};

/**
 * Add a user to a channel.
 */
Routes.prototype.addUserToChannel = function (request, response) {
  var uid = request.params.uid || '';
  var channel = request.params.channel || '';

  if (uid && channel) {
    if (!/^\d+$/.test(uid)) {
      console.log("Invalid uid: " + uid);
      response.send({'status': 'failed', 'error': 'Invalid uid.'});
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log("Invalid channel: " + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.addUserToChannel(channel, uid);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': 'No active sessions for uid.'});
    }
  }
  else {
    console.log("Missing uid or channel");
    response.send({'status': 'failed', 'error': 'Missing uid or channel'});
  }
};

/**
 * Remove a user from a channel.
 */
Routes.prototype.removeUserFromChannel = function (request, response) {
  var uid = request.params.uid || '';
  var channel = request.params.channel || '';
  if (uid && channel) {
    if (!/^\d+$/.test(uid)) {
      console.log('Invalid uid: ' + uid);
      response.send({'status': 'failed', 'error': 'Invalid uid.'});
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log('Invalid channel: ' + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.removeUserFromChannel(channel, uid);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': 'Non-existent channel name.'});
    }
  }
  else {
    console.log("Missing uid or channel");
    response.send({'status': 'failed', 'error': 'Invalid data'});
  }
};

/**
 * Add a channel.
 */
Routes.prototype.addChannel = function (request, response) {
  var channel = request.params.channel || '';
  if (channel) {
    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log('Invalid channel: ' + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.addChannel(channel);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': "Channel name '" + channel + "' already exists."});
    }
  }
  else {
    console.log("Missing channel");
    response.send({'status': 'failed', 'error': 'Invalid data: missing channel'});
  }
};

/**
 * Http callback - read in a JSON message and publish it to interested clients.
 */
Routes.prototype.healthCheck = function (request, response) {
  var data = request.clientManager.getStats();
  data.status = 'success';
  response.send(data);
};

/**
 * Checks whether a channel exists.
 */
Routes.prototype.checkChannel = function (request, response) {
  var channel = request.params.channel || '';
  if (channel) {
    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log('Invalid channel: ' + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.checkChannel(channel);

    if (result) {
      response.send({'status': 'success', 'result': true});
    }
    else {
      response.send({'status': 'success', 'result': false});
    }
  }
  else {
    console.log("Missing channel");
    response.send({'status': 'failed', 'error': 'Invalid data: missing channel'});
  }
};

/**
 * Remove a channel.
 */
Routes.prototype.removeChannel = function (request, response) {
  var channel = request.params.channel || '';
  if (channel) {
    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log('Invalid channel: ' + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.removeChannel(channel);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': 'Non-existent channel name.'});
    }
  }
  else {
    console.log("Missing channel");
    response.send({'status': 'failed', 'error': 'Invalid data: missing channel'});
  }
};

/**
 * Set the list of users a uid can see presence info about.
 */
Routes.prototype.setUserPresenceList = function (request, response) {
  var uid = request.params.uid || '';
  var uidlist = request.params.uidlist.split(',') || [];
  if (uid && uidlist) {
    if (!/^\d+$/.test(uid)) {
      console.log("Invalid uid: " + uid);
      response.send({'status': 'failed', 'error': 'Invalid uid.'});
      return;
    }
    if (uidlist.length == 0) {
      console.log("Empty uidlist");
      response.send({'status': 'failed', 'error': 'Empty uid list.'});
      return;
    }

    var result = request.clientManager.setUserPresenceList(uid, uidlist);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': 'Invalid uid.'});
    }
  }
  else {
    response.send({'status': 'failed', 'error': 'Invalid parameters.'});
  }
};

/**
 * Http callback - return the list of content channel users.
 */
Routes.prototype.getContentTokenUsers = function (request, response) {
  if (request.clientManager.settings.debug) {
    console.log('getContentTokenUsers: request body follows');
    console.log(request.body);
  }

  if (!request.body.channel) {
    response.send({error: 'Required parameters are missing.'});
    return;
  }

  var users = request.clientManager.getContentTokenChannelUsers(request.body.channel);
  if (request.clientManager.settings.debug) {
    console.log('getContentTokensUsers: Users:');
    console.log(users);
  }

  response.send({users: users});
};

/**
 * Set a content token.
 */
Routes.prototype.setContentToken = function (request, response) {
  if (request.clientManager.settings.debug) {
    console.log('setContentToken: request body follows');
    console.log(request.body);
  }

  if (!request.body.channel || !request.body.token) {
    response.send({error: 'Required parameters are missing.'});
    return;
  }

  request.clientManager.setContentToken(request.body.channel, request.body.token, request.body);

  response.send({status: 'success'});
};

/**
 * Publish a message to clients subscribed to a channel.
 */
Routes.prototype.publishMessageToContentChannel = function (request, response) {
  if (request.clientManager.settings.debug) {
    console.log('publishMessageToContentChannel: request body follows');
    console.log(request.body);
  }

  if (!request.body.channel) {
    console.log('publishMessageToContentChannel: An invalid message object was provided.');
    response.send({error: 'Invalid message'});
    return;
  }

  var result = request.clientManager.publishMessageToContentChannel(request.body.channel, request.body);
  if (result) {
    response.send({status: 'success'});
  }
  else {
    response.send({error: 'Invalid message'});
  }
};

/**
 * Add an authToken to a channel.
 * @TODO Unused, needs testing.
 */
Routes.prototype.addAuthTokenToChannel = function (request, response) {
  var authToken = request.params.authToken || '';
  var channel = request.params.channel || '';
  if (!authToken || !channel) {
    console.log("Missing authToken or channel");
    response.send({'status': 'failed', 'error': 'Missing authToken or channel'});
    return;
  }

  if (!/^[a-z0-9_]+$/i.test(channel)) {
    console.log("Invalid channel: " + channel);
    response.send({'status': 'failed', 'error': 'Invalid channel name.'});
    return;
  }

  var result = request.clientManager.addAuthTokenToChannel(channel, authToken);
  if (result) {
    response.send({'status': 'success'});
  }
  else {
    response.send({'status': 'failed', 'error': 'Invalid parameters.'});
  }
};

/**
 * Remove an authToken from a channel.
 * @TODO Unused, needs testing.
 */
Routes.prototype.removeAuthTokenFromChannel = function (request, response) {
  var authToken = request.params.authToken || '';
  var channel = request.params.channel || '';
  if (authToken && channel) {


    if (!/^[a-z0-9_]+$/i.test(channel)) {
      console.log('Invalid channel: ' + channel);
      response.send({'status': 'failed', 'error': 'Invalid channel name.'});
      return;
    }

    var result = request.clientManager.removeAuthTokenFromChannel(channel, authToken);
    if (result) {
      response.send({'status': 'success'});
    }
    else {
      response.send({'status': 'failed', 'error': 'Invalid parameters.'});
    }
  }
  else {
    console.log("Missing authToken or channel");
    response.send({'status': 'failed', 'error': 'Invalid data'});
  }
};

/**
 * Http callback - set the debug flag.
 */
Routes.prototype.toggleDebug = function (request, response) {
  if (!request.body.debug) {
    response.send({error: 'Required parameters are missing.'});
    return;
  }

  request.clientManager.settings.debug = request.body.debug;
  response.send({status: 'success', debug: request.body.debug});
};

/**
 * Sends a 404 message.
 */
Routes.prototype.send404 = function (request, response) {
  response.send('Not Found.', 404);
};

module.exports = Routes;