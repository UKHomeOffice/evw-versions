'use strict'

const koa = require('koa');
const hbs = require('koa-handlebars');
const app = koa();
const data = require('./envs');
const map = require('./envmap');

let content = map(data);
console.log('rendering with', content);

app.use(hbs({
  defaultLayout: 'main',
  partialsDir: 'views/partials'
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

