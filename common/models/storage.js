'use strict';
const log4js = require('log4js');
log4js.configure(require('../../config/log4js'))
const log = log4js.getLogger('storage');
const app = require('../../server/server');
const fs = require("fs");
const formidable = require("formidable");
const FormData = require('form-data');
const axios = require('axios')
const path = require("path")

axios.defaults.baseURL = 'http://localhost:3000/api'
module.exports = function(Storage) {
  Storage.uploadFile = function(ctx, container, cb) {
    const form = new formidable.IncomingForm(); //既处理表单，又处理文件上传
    app.models.Container.upload(container, ctx.req, ctx.res, cb, (err, response) => {
      try {
        if (err) {
          log.error('log error in line 13')
          log.error(err)
          cb(null, false)
        } else {
          cb(null, response)
        }
      } catch (e) {
        log.error('log catch in line 20')
        //TODO handle the exception
        log.error(e)
      }
    })
  }

  Storage.remoteMethod(
    'uploadFile', {
      description: 'Upload a file or more files',
      http: {
        path: '/uploadFile',
        verb: 'post'
      },
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      }, {
        arg: 'container',
        type: 'string',
        http: {
          source: 'query'
        }
      }],
      returns: {
        arg: 'fileObject',
        type: 'object',
        root: true,
      }
    });
  Storage.wxUploadFile = function(ctx, container, cb) {
    const form = new formidable.IncomingForm(); // 既处理表单，又处理文件上传
    form.parse(ctx.req, (err, fields, files) => {
      // 提取 formData 的数据
      try {
        try {
          const oldPath = files.file.path; // 这里的路径是图片的本地路径
          const newName = `wx_${new Date().getTime()}.${files.file.name.split('.')[files.file.name.split('.').length - 1]}`
          const newPath = path.join(path.dirname(oldPath), newName); // 这里的路径是图片的新的本地路径
          fs.rename(oldPath, newPath, (err) => {
            // 文件重命名
            try {
              const form2 = new FormData()
              form2.append('file', fs.createReadStream(newPath)); // 'file'是服务器接受的key，创建文件流
              const headers = form2.getHeaders(); //这个不能少
              // 调用 pc 端的 "上传接口"，实现 "文件上传"
              axios({
                method: 'post',
                url: `/storages/uploadFile?container=${container}`,
                headers,
                data: form2
              }).then((response) => {
                if (response.data) {
                  cb(null, response)
                } else {
                  cb(null, false)
                }
              }).catch((error) => {
                log.error('log catch in line 85')
                log.error(error)
              })
            } catch (e) {
              log.error('log catch in line 90')
              log.error(e)
            }
          })
        } catch (e) {
          log.error('log error in line 80')
          log.error(e)
        }
      } catch (e) {
        log.error('log catch in line 83')
        log.error(e)
      }
    })
  }

  Storage.remoteMethod(
    'wxUploadFile', {
      description: '微信小程序上传文件',
      http: {
        path: '/wxUploadFile',
        verb: 'post'
      },
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      }, {
        arg: 'container',
        type: 'string',
        http: {
          source: 'query'
        }
      }],
      returns: {
        arg: 'fileObject',
        type: 'object',
        root: true,
      }
    });
};
