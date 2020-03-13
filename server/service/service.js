const app = require('../server.js');
const log4js = require('log4js');
log4js.configure(require('../../config/log4js'))
const log = log4js.getLogger('service.js');
function postData(model, fun, parm1, parm2) {
  return new Promise((resolve) => {
    if (parm1 && parm2) {
      try {
        app.models[model][fun](parm1, parm2, (err, response) => {
          try {
            if (err) {
              log.error(err)
              resolve(false)
            } else {
              resolve(response)
            }
          } catch (e) {
            log.error(e)
            //TODO handle the exception
          }
        })
      } catch (e) {
        log.error(e)
        resolve(false)
        //TODO handle the exception
      }
    } else {
      try {
        app.models[model][fun](parm1, (err, response) => {
          try {
            if(err) {
              log.error(err)
              resolve(false)
            } else {
              resolve(response)
            }
          } catch (e) {
            log.error(e)
            //TODO handle the exception
          }
        })
      } catch (e) {
        log.error(e)
        //TODO handle the exception
        resolve(false)
      }
    }
  })
}

module.exports = {
  postData
}
