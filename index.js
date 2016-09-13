'use strict';

const fs = require('fs');
const http = require('http');
const shttp = require('socks5-http-client');
const async = require('async');
const local = process.env.VERSIONS_APP_LOCAL;
const apps = {
  'evw-customer': {
    box: 'cus',
    port: 3018,
    endpoint: '/shared/healthcheck/version',
    instances: 2
  },
  'flights-forecast-service': {
    box: 'cus',
    port: 9350,
    endpoint: '/version',
    instances: 2
  },
  'evw-self-serve': {
    box: 'cus',
    port: 3016,
    endpoint: '/version',
    instances: 2
  },
  'evw-application-processor': {
    box: 'cus',
    port: 8897,
    endpoint: '/version',
    instances: 2
  },
  'evw-caseworker': {
    box: 'cas',
    port: 9000,
    endpoint: '/caseworker/version',
    instances: 2
  },
  'evw-integration-service': {
    box: 'cas',
    port: 9300,
    endpoint: '/version',
    instances: 2
  },
  'passport-ocr-service': {
    box: 'ocr',
    port: 9360,
    endpoint: '/version',
    instances: 3
  }
};

let envs = {};
let calls = [];

const build = ((item) => {
  // console.log('building', item);
  let appValue;
  let app = {};

  try {
    appValue = JSON.parse(item.result);
  } catch (e) {
    appValue = '';
  }

  app[item.application] = appValue;
  envs[item.host] = Object.assign({},
    envs[item.host],
    app
  );
});

const query = (host, port, path, app, cb) => {

  let curler = !!local ? shttp : http;
  let location = {
    hostname: host,
    port: port,
    path: path
  };

  if(!!local) {
    location = Object.assign(location, {
      socksPort: 9999,
      socksHost: 'localhost'
    });
  }

  // console.log(`trying ${host}:${port}${path}`);
  // console.log('getting', location);
  curler.get(location, (res) => {

    let body = '';
    res.on('data', (d) => {
      body += d;
    }).on('end', (err) => {
      if (err) {
        console.log('err', err);
      }

      // console.log('got', body, res.statusCode);
      build({
        result: body,
        application: app,
        host: host,
        query: `${host}:${port}${path}`,
        code: res.statusCode
      });

      try {
        cb(err, body, host);
      } catch (e) {
        console.log('could not apply callback');
      }
    }).on('error', (err) => {
      console.log(`Got error querying: ${err.message}`);
      cb(err);
    });
  }).setTimeout(400, () => {
    console.log('timed out querying ' + host);
    try {
      cb('timed out querying', host);
    } catch (e) {
      console.log('timeout callback error', e);
    }
  });
};

// const chainCalls = (apps, calls, next) => {
//   // such looping
//   Object.keys(apps).forEach((key) => {
//     let app = apps[key];
//     for (var n = app.instances -1; n >= 0; n--) {
//       ['dv', 'ut', 'pp', 'pd'].forEach((env) => {
//         // console.log(key, env, `${env}${app.box}0${n+1}`);
//         let machine = n+1;
//         calls.push((cb) => {
//           query(`${env}${app.box}0${machine}`, app.port, app.endpoint, key, cb);
//         });
//       })
//     }
//   });
//   return next(calls);
// };

const chainCalls = (apps, calls, next) => {
  Object.keys(apps).forEach((key) => {
    let app = apps[key];
    // console.log(`adding... ${key}:`, apps[key], `dv${app.box}01`);
    // lol, do this better
    calls.push((cb) => {
      query(`dv${app.box}01`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`dv${app.box}02`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`ut${app.box}01`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`ut${app.box}02`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`pp${app.box}01`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`pp${app.box}02`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`pd${app.box}01`, app.port, app.endpoint, key, cb);
    });
    calls.push((cb) => {
      query(`pd${app.box}02`, app.port, app.endpoint, key, cb);
    });
  });
  return next(calls);
};

const saveEnvs = (envs) => {

  try {
    envs = JSON.parse(JSON.stringify(envs));
    fs.writeFile('envs-saved.json', JSON.stringify(envs), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log('new environment information saved');
      return envs;
    });
  } catch (e) {
    console.log('not saving envs, invalid json', envs);
  }

};

const makeCalls = (calls) => {
  return new Promise((resolve, reject) => {
    async.parallel(async.reflectAll(calls), function(err, results) {
      if(err) {
        console.log('🙈 errors 💀', err);
        reject(err);
      }
      // console.log(results);
      saveEnvs(envs);
      return resolve(envs);
    });
  })
};

module.exports = {
  chain: chainCalls,
  apps: apps,
  calls: calls,
  make: makeCalls
}









