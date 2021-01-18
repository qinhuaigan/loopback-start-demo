const app = require('../server.js');
const log4js = require('log4js');
const FormData = require('form-data');
log4js.configure(require('../../config/log4js'));
const log = log4js.getLogger('service.js');
const fs = require('fs');
const path = require('path');
// 数据库操作函数
function postData(model, fun, parm1, parm2) {
  return new Promise((resolve) => {
    if (parm1 && parm2) {
      try {
        app.models[model][fun](parm1, parm2, (err, response) => {
          try {
            if (err) {
              console.log(err);
              log.error(err);
              resolve(false);
            } else {
              resolve(response);
            }
          } catch (e) {
            console.log(e);
            log.error(e);
            // TODO handle the exception
          }
        });
      } catch (e) {
        console.log(e);
        log.error(e);
        resolve(false);
        // TODO handle the exception
      }
    } else {
      try {
        app.models[model][fun](parm1, (err, response) => {
          try {
            if (err) {
              console.log(err);
              log.error(err);
              resolve(false);
            } else {
              resolve(response);
            }
          } catch (e) {
            console.log(e);
            log.error(e);
            // TODO handle the exception
          }
        });
      } catch (e) {
        log.error(e);
        // TODO handle the exception
        resolve(false);
      }
    }
  });
}

// 获取文件
function getFileByContainer(container) {
  return new Promise((resolve) => {
    app.models.Container.getFiles(`${container}`, (err, response) => {
      try {
        if (err) {
          log.error(err);
          log.error('log error in line:59');
          return resolve(false);
        }
        const result = [];
        for (let i = 0; i < response.length; i++) {
          result.push({
            filename: response[i].filename,
            path: `/Containers/${container}/download/${response[i].filename}`,
            container: `${container}`,
          });
        }
        resolve(result);
      } catch (e) {
        log.error(e);
        log.error('log catch in line:65');
        // TODO handle the exception
        resolve(false);
      }
    });
  });
}

// 日期格式化
function formatDate(value, type) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  let fmt = type || 'yyyy-MM-dd';
  var obj = {
    'y': date.getFullYear(), // 年份，注意必须用getFullYear
    'M': date.getMonth() + 1, // 月份，注意是从0-11
    'd': date.getDate(), // 日期
    'q': Math.floor((date.getMonth() + 3) / 3), // 季度
    'w': date.getDay(), // 星期，注意是0-6
    'H': date.getHours(), // 24小时制
    'h': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 12小时制
    'm': date.getMinutes(), // 分钟
    's': date.getSeconds(), // 秒
    'S': date.getMilliseconds(), // 毫秒
  };
  var week = ['天', '一', '二', '三', '四', '五', '六'];
  for (var i in obj) {
    fmt = fmt.replace(new RegExp(i + '+', 'g'), function(m) {
      var val = obj[i] + '';
      if (i === 'w') return (m.length > 2 ? '星期' : '周') + week[val];
      for (var j = 0, len = val.length; j < m.length - len; j++) {
        val = '0' + val;
      }
      return m.length === 1 ? val : val.substring(val.length - m.length);
    });
  }
  return fmt;
}

// 创建文件流
function createFileStream(file) {
  return new Promise((resolve) => {
    const oldPath = file.path; // 这里的路径是图片的本地路径
    const newPath = path.join(path.dirname(oldPath), file.name); // 这里的路径是图片的新的本地路径
    // 重命名文件
    fs.rename(oldPath, newPath, (err) => {
      resolve(fs.createReadStream(newPath)); // 'file'是服务器接受的key，创建文件流
    });
  });
}

// 将 json 转化为 formdata
function formatFormData(data) {
  const form = new FormData();
  const promises = [];
  const keys = [];
  return new Promise((resolve) => {
    if (data) {
      for (let key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          console.log('key ===', key);
          keys.push(key);
          if (key === 'file') {
            promises.push(createFileStream(data[key]));
          } else {
            promises.push(new Promise((resolve2) => {
              resolve2(data[key]);
            }));
          }
        }
      }
      Promise.all(promises).then((result) => {
        console.log('keys ===', keys);
        console.log('转换后', result);
        for (let i = 0; i < keys.length; i++) {
          form.append(keys[i], result[i]);
        }
        console.log('form ====', form);
        resolve(form);
      });
    }
  });
}
module.exports = {
  postData,
  getFileByContainer,
  formatDate,
  formatFormData,
};
