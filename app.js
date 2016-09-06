'use strict'

const koa = require('koa');
const hbs = require('koa-handlebars');
const app = koa();
const data = require('./envs');
const map = require('./envmap');

let content = map(data);
console.log('rendering with', content);

let helpers = {
  box: (obj, key, prop, num, app) => {
    let lookup = `${key}${prop}${num}`;
    return obj[lookup] && obj[lookup][app];
  }
}

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

app.listen(3000, () => {
  console.log('app running on 3000');
});

