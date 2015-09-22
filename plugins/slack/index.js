/**
 * Created by sven on 07-09-15.
 */
var Slack = require('slack-node');
var _ = require('underscore');
var CheckEvent = require('../../models/checkEvent');

exports.initWebApp = function(options) {
  var config = options.config.slack;
  var slack = new Slack(config.apiToken);
  var params = JSON.parse(JSON.stringify(config.options)); //deepCopy

  CheckEvent.on('afterInsert', function(checkEvent) {
    if(config.needsTag === false || checkEvent.tags.indexOf("slack") > -1) {
      checkEvent.findCheck(function (err, check) {
        if (err) return console.error(err);

        var messageColor;
        var message = check.name + ' ';
        switch (checkEvent.message) {
          case 'down':
            message += 'went down ' + checkEvent.details;
            messageColor = 'danger';
            break;
          case 'up':
            if (checkEvent.downtime) {
              message += 'went back up after ' + Math.floor(checkEvent.downtime / 1000) + 's of downtime';
            } else {
              message += 'is now up';
            }
            messageColor = 'good';
            break;
        }

        var post = _.extend(params, {
          text: message,
          attachments: JSON.stringify([{text: message, color: messageColor}])
        });
        if (post.channel.indexOf("#") != 0) {
          post.channel = "#" + post.channel;
        }

        slack.api('chat.postMessage', post, function (err, response) {
          console.log("Slack: ", response);
        });
      });
    }
  });
  console.log('Enabled Slack notifications');
};