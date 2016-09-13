'use strict';

const path = require('path');
const serve = require('koa-static-server');
const Koa = require('koa');
const hbs = require('koa-handlebars');
const app = new Koa();
const data = require('./envs-saved.json');
const map = require('./envmap');
const Socket = require('koa-socket');
const io = new Socket();
const getter = require('./index');

const content = map(data);

const helpers = {
  box: (obj, key, prop, num, app) => {
    let lookup = `${key}${prop}${num}`;
    // console.log('and app from lookup', lookup, obj[lookup] && obj[lookup][app]);
    return obj[lookup] && obj[lookup][app] && obj[lookup][app].version;
  }
};

const getEnvs = (current) => {
  getter.chain(
    getter.apps,
    getter.calls,
    getter.make
  ).then((data) => {
    if( JSON.stringify(current) !== JSON.stringify(data) ) {
      io.broadcast( 'envs', 'release the bats' );
      // todo transmit new environment dataset hbs.render
    }
  }).catch(function(e) {
    console.log('error getting envs', e);
  });
}

let assetPath = path.resolve(__dirname) + '/static';

app.use(serve({
  rootDir: assetPath
}));

app.use(hbs({
  defaultLayout: 'main',
  partialsDir: 'views/partials',
  helpers: helpers
}));

app.use(function *() {
  yield this.render('table-by-app-type', {
    title: 'what is deployed on what (WIDOW)',
    envs: content,
    assetPath: process.env.VERSIONS_APP_ASSET_PATH || ''
  });
});

io.attach(app);

io.on('connection', ctx => {
  console.log( 'Join event', ctx.socket.id );
  io.broadcast( 'connections', {
    numConnections: io.connections.size
  });
});

io.on('disconnect', ctx => {
  console.log('leave event', ctx.socket.id );
  io.broadcast('connections', {
    numConnections: io.connections.size
  });
});

app.listen(app.listen(process.env.VERSIONS_APP_PORT || 3000), () => {
  setInterval(function () {
    getEnvs(data);
  }, 60000); // check every minute
  getEnvs(data);
  console.log('app running on 3000');
});
