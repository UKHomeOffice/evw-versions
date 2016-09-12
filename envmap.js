'use strict';

const keyMap = {
  'dv': 'dev',
  'ut': 'user',
  'pp': 'preprod',
  'pd': 'prod'
};

const level = (env) => {
  let key = Object.keys(keyMap).filter((k) => env.includes(k));
  return keyMap[key];
};

const map = (data) => {
  Object.keys(data).map((env) => {
    let key = level(env);
    let item = {}
    item[env] = Object.assign({},
      item[env],
      data[env]
    );
    // console.log(key, '=>', env, 'item:', item);
    data[key] = Object.assign({}, data[key], item);
  });
  return data;
};


module.exports = map;
module.exports.level = level;
module.exports.keyMap = keyMap;
