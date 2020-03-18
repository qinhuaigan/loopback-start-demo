'use strict';
const log4js = require('log4js');
log4js.configure(require('../../config/log4js'))
const log = log4js.getLogger('storage');
const app = require('../../server/server');
module.exports = function(Storage) {
  Storage.uploadFile = function(ctx, cb) {
    console.log(ctx.req)
    app.models.Container.upload(container, ctx.req, ctx.res, cb, (err, response) => {
      if (err) {
        cb(null, false)
      } else {
        cb(null, response)
      }
    })
  }

  Storage.remoteMethod(
    'uploadFile', {
      description: 'Upload a file or more files',
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      }],
      returns: {
        arg: 'fileObject',
        type: 'object',
        root: true,
      },
      http: {
        verb: 'post'
      },
    }
  );
};
