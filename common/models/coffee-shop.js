'use strict';
// const loopback = require('loopback');
const log4js = require('log4js');
log4js.configure(require('../../config/log4js'))
const log = log4js.getLogger('CoffeeShop');
const app = require('../../server/server');
const axios = require('axios')
const qs = require('querystring')
const {
  postData
} = require('../../server/service/service.js')

module.exports = function(CoffeeShop) {
  CoffeeShop.status = function(data, cb) {
    const appId = 'wxfc1ae62fd810717d'
    const secret = '1b1243520de31530b78946b23d8ba3cd'
    const data2 = {
      'grant_type': 'client_credential',
      'appid': appId,
      'secret': secret
    }
    axios({
      method: 'get',
      url: `https://api.weixin.qq.com/cgi-bin/token?${qs.stringify(data2)}`
    }).then((response) => {
      const token = response.data.access_token
      // 获取二维码
      const data3 = {
        'scene': '1',
        'page': 'pages/home/home'
      }
      axios({
        method: 'post',
        url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`,
        data: data3
      }).then((response2) => {
        console.log('获取二维码成功', response2.data)
      }).catch((error) => {
        console.log('获取二维码失败', error)
      })
    }).catch((error) => {
      console.log('获取失败', error)
    })
    // cb(null, result);
  };
  CoffeeShop.remoteMethod(
    'status', {
      http: {
        path: '/status',
        verb: 'post'
      },
      accepts: {
        arg: 'data',
        type: 'object',
        required: true,
        http: {
          source: 'body'
        }
      },
      returns: {
        arg: 'status',
        type: 'string'
      }
    }
  );

  CoffeeShop.addNewCoffee = function(data, cb) {
    async function addNewCoffee() {
      const {userId} = await postData('AccessToken', 'resolve', data.token)
      const result = await postData('CoffeeShop', 'create',{
        userId,
        name: data.name,
        city: data.city,
        createTime: new Date()
      })
      cb(null, result)
    }
    addNewCoffee()
  };
  CoffeeShop.remoteMethod(
    'addNewCoffee', {
      http: {
        path: '/addNewCoffee',
        verb: 'post'
      },
      accepts: {
        arg: 'data',
        type: 'object',
        required: true,
        http: {
          source: 'body'
        }
      },
      returns: {
        arg: 'result',
        type: 'object'
      }
    });
};
