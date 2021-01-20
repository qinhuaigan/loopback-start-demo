const log4js = require('log4js');
log4js.configure(require('../../config/log4js'))
const log = log4js.getLogger('Role');
const requireData = require('../../json/requireData')
const formidable = require("formidable");
const {
  postData,
  formatFormData
} = require('../service/service.js')

async function checkRequireData (context) { // 检验必填字段
  const checkData = requireData[context.modelName] ? requireData[context.modelName][context.method] : null
  let formData = null
  let source = checkData ? checkData.source : null
  const form = new formidable.IncomingForm(); // 处理 form 表单数据
  if (source === 'formdata') {
    formData = await new Promise((resolve) => { // formdata 中的参数
      form.parse(context.remotingContext.req, (err, fields, files) => {
        resolve({
          fields,
          files
        })
      });
    })
  }
  if (checkData) {
    // 存在需要 "必填字段" 约束，所以，需要验证
    const keys = Object.keys(checkData)
    const bodyData = context.remotingContext.req.body // body 中的参数
    const queryData = context.remotingContext.req.query // query 中的参数
    let data // 请求数据
    switch (source) {
      case 'formdata':
        data = formData.fields
        break;
      case 'query':
        data = queryData
        break;
      case 'body':
        data = bodyData
        break;
      default:
        data = bodyData
        break;
    }
    let msg = ''
    for (const key in checkData.data) {
      if (checkData.data[key].required && !data[key]) {
        msg += `${checkData.data[key].description}、`
      }
    }
    if (msg) {
      return {
        result: false,
        msg,
        data,
        source,
        file: formData && formData.files ? formData.files.file : null
      }
    } else {
      return {
        result: true,
        msg,
        data,
        source,
        file: formData && formData.files ? formData.files.file : null
      }
    }
  } else {
    return {
      result: true,
      data: formData ? formData.fields : [],
      source,
      file: formData && formData.files ? formData.files.file : null
    }
  }
}

module.exports = function(app) {
  const Role = app.models.Role;
  const AccessToken = app.models.AccessToken;
  const User = app.models.User;
  Role.registerResolver('$owner', function(role, context, cb) {
    // 系统管理员
    (async function() {
      const error = new Error()
      error.message = '需要授权'
      error.statusCode = 401
      // 验证权限之前，先验证必填字段是否完整
      const checkResult = await checkRequireData(context)
      if (checkResult.msg) {
        error.message = `${checkResult.msg.substr(0, checkResult.msg.length - 1)}不能为空`
        log.error(error)
        return cb(error, false)
      }

      // 当前账号是否属于 "$owner" 角色
      const token = context.remotingContext.req.query.access_token
      if (!token) {
        return cb(error, false)
      }
      const resolved = await postData('AccessToken', 'resolve', token)
      if (!resolved || !resolved.userId) {
        return cb(error, false)
      }

      const user = await postData('User', 'findById', resolved.userId)
      if (user && user.identity === 1) {
        // 身份符合（管理员身份）
        if (checkResult.source === 'formdata') {
          context.remotingContext.req.body = Object.assign({
            file: checkResult.file
          }, checkResult.data)
        }
        return cb(null, true);
      } else {
        return cb(error, false)
      }
    })()
  });

  Role.registerResolver('$general', function(role, context, cb) {
    // 所有用户（已注册过的用户）
    (async function() {
      const error = new Error()
      error.message = '需要授权'
      error.statusCode = 401
      // 验证权限之前，先验证必填字段是否完整
      const checkResult = await checkRequireData(context)
      if (checkResult && checkResult.msg) {
        error.message = `${checkResult.msg.substr(0, checkResult.msg.length - 1)}不能为空`
        log.error(error)
        return cb(error, false)
      }

      // 当前账号是否属于 "$general" 角色（注册过的账号）
      const token = context.remotingContext.req.query.access_token
      if (!token) {
        return cb(error, false)
      }

      const resolved = await postData('AccessToken', 'resolve', token)
      if (!resolved || !resolved.userId) {
        return cb(error, false)
      }

      const user = await postData('User', 'findById', resolved.userId)
      if (user && user.identity >= 1) {
        // 身份符合（管理员身份）
        if (checkResult && checkResult.source === 'formdata') {
          context.remotingContext.req.body = Object.assign({
            file: checkResult.file
          }, checkResult.data)
        }
        return cb(null, true);
      } else {
        return cb(error, false)
      }
    })()
  });

  Role.registerResolver('$everyone', function(role, context, cb) {
    // 所有用户（包括非游客）
    (async function() {
      const error = new Error()
      error.message = '需要授权'
      error.statusCode = 401
      // 验证权限之前，先验证必填字段是否完整
      const checkResult = await checkRequireData(context)
      if (checkResult && checkResult.msg) {
        error.message = `${checkResult.msg.substr(0, checkResult.msg.length - 1)}不能为空`
        log.error(error)
        return cb(error, false)
      }
      if (checkResult && checkResult.source === 'formdata') {
        context.remotingContext.req.body = Object.assign({
          file: checkResult.file
        }, checkResult.data)
      }
      return cb(null, true)
    })()
  });
};
