var _ = require('underscore');
var CheckEvent = require('../../models/checkEvent');
var Docker = require('dockerode');

exports.initWebApp = function(options) {
  var config = options.config.docker;

  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function (err, check) {
      if (err) return console.error(err);

      // Only reboot when it's down
      if(checkEvent.message == "down") {

        _.each(checkEvent.tags, function(tag){
          var tagparts = tag.split(";");
          if(tagparts[0] == "host") {
            var docker = new Docker({host: tagparts[1], port: 2375});
            var container = docker.getContainer('askbackend');
            if(container) {
              container.restart(function (err, data) {
                if(err) console.err("Failed to restart container: ",err);
                else console.log(data);
              });
            }
          }
        });
      }
    });
  });
  console.log('Enabled Docker actions');
};
