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
const co = require('co');
const getter = require('./index');
let Handlebars = require('handlebars');
let content = map(data);
let helpers = {
  box: (obj, key, prop, num, app) => {
    // console.log('list of rendering args', obj, key, prop, num, app);
    let lookup = `${key}${prop}${num}`;
    // console.log('and app from lookup', lookup, obj[lookup] && obj[lookup][app]);
    return obj[lookup] && obj[lookup][app] && obj[lookup][app].version;
  }
};

app.use(serve({
  rootDir: path.resolve(__dirname) + '/static'
}));

app.use(hbs({
  defaultLayout: 'main',
  partialsDir: 'views/partials',
  helpers: helpers
}));

app.use(function *() {
  yield this.render('table-by-app-type', {
    title: 'what is deployed on what (WIDOW)',
    envs: content
  });
});

io.attach(app)

/**
 * Socket middlewares
 */

io.use( co.wrap( function *( ctx, next ) {
  console.log( 'Socket middleware' )
  const start = new Date
  yield next()
  const ms = new Date - start
  console.log( `socket process took ${ ms }ms` )
}))
io.use( co.wrap( function *( ctx, next ) {
  ctx.teststring = 'test'
  yield next()
}))

/**
 * Socket handlers
 */
io.on( 'connection', ctx => {
  console.log( 'Join event', ctx.socket.id )
  io.broadcast( 'connections', {
    numConnections: io.connections.size
  })
})

io.on( 'disconnect', ctx => {
  console.log( 'leave event', ctx.socket.id )
  io.broadcast( 'connections', {
    numConnections: io.connections.size
  })
})
io.on( 'data', ( ctx, data ) => {
  console.log( 'data event', data )
  console.log( 'ctx:', ctx.event, ctx.data, ctx.socket.id )
  console.log( 'ctx.teststring:', ctx.teststring )
  ctx.socket.emit( 'response', {
    message: 'response from server'
  })
})
io.on( 'ack', ( ctx, data ) => {
  console.log( 'data event with acknowledgement', data )
  ctx.acknowledge( 'received' )
})
io.on( 'numConnections', packet => {
  console.log( `Number of connections: ${ io.connections.size }, ${ packet }` )
})

const getEnvs = (current) => {
  getter.chain(
    getter.apps,
    getter.calls,
    getter.make
  ).then((data) => {
    if( JSON.stringify(current) !== JSON.stringify(data) ) {
      console.log('fresh envs', data);
      io.broadcast( 'envs', 'release the bats' );
      // todo transmit new environment dataset hbs.render
    }
  }).catch(function(e) {
    console.log('error getting envs', e);
  });;
}

app.listen(app.listen(process.env.PORT || 3000), () => {
  setInterval(function () {
    getEnvs(data);
  }, 60000); // check every minute
  console.log('app running on 3000');
});
