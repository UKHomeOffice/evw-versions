'use strict';

const http = require('http');
const cheerio = require('cheerio');
const authstr = process.env.NAGIOS_AUTH;
const base = (host) => `monitoring.registered-traveller.homeoffice.gov.uk/nagios/cgi-bin/extinfo.cgi?type=2&host=${host}&service=Version+-+`;

let cus = [
  'evw-application-processor',
  'evw-customer',
  'evw-self-serve',
  'flight-forecast-service',
  'mock-integration-service'
];

let cas = [
  'evw-caseworker',
  'evw-integration-service',
];

let ocr = [
  'Passport+OCR+Service'
];

let wps = [
  'rtp-worldpay-stub'
];

let envs = {
  cus: cus,
  cas: cas,
  ocr: ocr,
  wps: wps
}

let hosts = {};

// let levels = [
//   'dv',
//   'ut',
//   'pd',
//   'pp'
// ];

// http://monitoring.registered-traveller.homeoffice.gov.uk/nagios/cgi-bin/extinfo.cgi?type=2&host=dvcas02&service=Version+-+evw-caseworker

const envCheck = (env, list) => {
  // console.log('checking', env, list);
  list.forEach((item) => {
    check(`dv${env}01`, item, pick);
    check(`dv${env}02`, item, pick);

    check(`ut${env}01`, item, pick);
    check(`ut${env}02`, item, pick);

    check(`pp${env}01`, item, pick);
    check(`pp${env}01`, item, pick);

    check(`pd${env}02`, item, pick);
    check(`pd${env}02`, item, pick);

  });
};

const check = (host, app, cb) => {
  let ping = `http://${authstr}@${base(host)}${app}`;
  // console.log(`querying ${ping}`);
  http.get(ping, (res) => {
    let body;
    res.on('data', (d) => {
      body += d;
    }).on('end', () => {
      cb(body, host, app);
    }).on('error', (e) => {
      console.log(`Got error querying ${base(host)}${app}: ${e.message}`);
    });
  });
}

const pick = (data, host, app) => {
  let $ = cheerio.load(data);
  let version = $('.stateInfoTable1').find('td:contains("Status Information:")').next().text();
  // console.log(`${host} > ${app} version:
  // ${version}`);

  let entry = {};
  entry[app] = version;

  if (hosts.hasOwnProperty(host)) {
    console.log(host, 'exists, pushing', entry);
    hosts[host][app] = version;
  } else {
    hosts[host] = {};
    hosts[host][app] = version;
    console.log('created', host, 'pushing', entry);
  }
  // console.log('pushing', entry, 'into', hosts[host]);
}

Object.keys(envs).forEach((item, i, arr) => {
  let list = envs[item];
  envCheck(arr[i], list);
});


setTimeout(function(){
  console.log(hosts);
},10000);










