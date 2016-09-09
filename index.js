'use strict';

const http = require('http');
const shttp = require('socks5-http-client');
const async = require('async');
const local = process.env.VERSIONS_APP_LOCAL;

// const cheerio = require('cheerio');
// const authstr = process.env.NAGIOS_AUTH;
// const base = (host) => `monitoring.registered-traveller.homeoffice.gov.uk/nagios/cgi-bin/extinfo.cgi?type=2&host=${host}&service=Version+-+`;

let boxes = {};

let calls = [];
const apps = {
  customer: {
    box: 'cus',
    port: 3018,
    endpoint: '/shared/healthcheck/version'
  },
  flights: {
    box: 'cus',
    port: 9350,
    endpoint: '/version'
  },
  selfserve: {
    box: 'cus',
    port: 3016,
    endpoint: '/version'
  },
  processor: {
    box: 'cus',
    port: 8897,
    endpoint: '/version'
  },
  caseworker: {
    box: 'cas',
    port: 9000,
    endpoint: '/caseworker/version'
  },
  integration: {
    box: 'cas',
    port: 9300,
    endpoint: '/version'
  }
  // ,
  // ocr: {
  //   box: 'ocr',
  //   port: 9360,
  //   endpoint: '/healthcheck'
  // }
};

// const donecb = (err, res, host) => {
//   if(err) {
//     console.log('BAILED', err);
//   }

//   console.log('GOT', res);
//   (boxes[host] = boxes[host] || []).push(res);
//   console.log(boxes);
// };

const query = (host, port, path, cb) => {

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

  console.log(`trying ${host}:${port}${path}`);

  curler.get(location, (res) => {

    let body = '';
    res.on('data', (d) => {
      body += d;
    }).on('end', (err) => {
      if (err) {
        console.log('err', err);
      }
      console.log('got', body, res.statusCode);
      cb(err, body, host);
    }).on('error', (e) => {
      console.log(`Got error querying: ${e.message}`);
    });
  });
};

const chainCalls = (apps, calls, next) => {
  Object.keys(apps).forEach((key) => {
    let app = apps[key];
    console.log(`adding... ${key}:`, apps[key], `dv${app.box}01`);
    // lol, do this better
    calls.push((cb) => {
      query(`dv${app.box}01`, app.port, app.endpoint, cb);
    });
    calls.push((cb) => {
      query(`dv${app.box}02`, app.port, app.endpoint, cb);
    });
    calls.push((cb) => {
      query(`ut${app.box}01`, app.port, app.endpoint, cb);
    });
    calls.push((cb) => {
      query(`pp${app.box}01`, app.port, app.endpoint, cb);
    });
    // calls.push((cb) => {
    //   query(`pp${app.box}02`, app.port, app.endpoint, cb);
    // });
    // calls.push((cb) => {
    //   query(`pd${app.box}01`, app.port, app.endpoint, cb);
    // });
    // calls.push((cb) => {
    //   query(`pd${app.box}02`, app.port, app.endpoint, cb);
    // });
  });
  next(calls);
};

const makeCalls = (calls) => {
  async.parallel(async.reflectAll(calls), function(err, results) {
    console.log('🙈 noooo err 💀', err);
    console.log('final results:', results);
    boxes = results.reduce((previous, current) => {
      // console.log('previous', previous, 'current', current);
      if(typeof current.value[0] !== 'undefined') {

        let app = current.value[0];
        let key = current.value[1];

        console.log('assigning', app, 'to', current.value[1]);
        (previous[key] = previous[key] || []).push(app);
        // console.log('now looks like', previous);
      }
      return previous;
    }, {});
    console.log('boxes', boxes);
  });
};

chainCalls(apps, calls, makeCalls);


// let cus = [
//   'evw-application-processor',
//   'evw-customer',
//   'evw-self-serve',
//   'flight-forecast-service',
//   'mock-integration-service'
// ];

// let cas = [
//   'evw-caseworker',
//   'evw-integration-service',
// ];

// let ocr = [
//   'Passport+OCR+Service'
// ];

// let wps = [
//   'rtp-worldpay-stub'
// ];

// let envs = {
//   cus: cus,
//   cas: cas,
//   ocr: ocr,
//   wps: wps
// }

// let hosts = {};

// let levels = [
//   'dv',
//   'ut',
//   'pd',
//   'pp'
// ];

// http://monitoring.registered-traveller.homeoffice.gov.uk/nagios/cgi-bin/extinfo.cgi?type=2&host=dvcas02&service=Version+-+evw-caseworker

// const envCheck = (env, list) => {
//   let tasks = [];
//   list.forEach((item) => {
//     let it = {};
//     it[item] = function() {
//       this[`dv${env}01`] = check(`dv${env}01`, item, pick);
//       // check(`dv${env}02`, item, pick),

//       // check(`ut${env}01`, item, pick),
//       // check(`ut${env}02`, item, pick),

//       // check(`pp${env}01`, item, pick),
//       // check(`pp${env}01`, item, pick),

//       // check(`pd${env}02`, item, pick),
//       // check(`pd${env}02`, item, pick)
//     };
//     tasks.push(it);
//   });
//   console.log(tasks);
//   // async.parallel(tasks, (err, results) => {
//   //   console.log(err, results);
//   //   return doLog();
//   // });
// };

// const check = (host, app, cb) => {
//   let ping = `http://${authstr}@${base(host)}${app}`;
//   // console.log(`querying ${ping}`);
//   http.get(ping, (res) => {
//     let body;
//     res.on('data', (d) => {
//       body += d;
//     }).on('end', () => {
//       cb(body, host, app);
//     }).on('error', (e) => {
//       console.log(`Got error querying ${base(host)}${app}: ${e.message}`);
//     });
//   });
// }

// const pick = (data, host, app) => {
//   let $ = cheerio.load(data);
//   let version = $('.stateInfoTable1').find('td:contains("Status Information:")').next().text();

//   if(!version){
//     return;
//   }

//   let entry = {};
//   entry[app] = version;

//   if (hosts.hasOwnProperty(host)) {
//     // console.log(host, 'exists, pushing', entry);
//     hosts[host][app] = version;
//   } else {
//     hosts[host] = {};
//     hosts[host][app] = version;
//     // console.log('created', host, 'pushing', entry);
//   }
//   // console.log('pushing', entry, 'into', hosts[host]);
// }


// const begin = () => {
//   Object.keys(envs).forEach((item, i, arr) => {
//     let list = envs[item];
//     envCheck(arr[i], list);
//   });
// }

// const doLog = () => console.log(hosts);

// begin();
//


// setTimeout(function(){
//   console.log(hosts);
// },10000);









