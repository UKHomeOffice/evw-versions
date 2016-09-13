# evw-versions
A way of generating a dashboard of all deployed evw software

### install

`npm i`

### collect

`node index.js`

### run

use something like [supervisor](https://github.com/petruisfan/node-supervisor)

```
supervisor -e js,hbs app.js
```

### aspirations

* [x] collect versions from application published endpoints
* [x] enqueue all http requests using e.g. [async parallel](http://caolan.github.io/async/docs.html#.parallel)
* [ ] loudly highlight when versions mismatch between machines
* [ ] less loudly highlight differences between environments
