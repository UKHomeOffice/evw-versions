'use strict';

// const desc = {
//   dev: {},
//   user: {},
//   preprod: {},
//   prod: {}
// };

const keyMap = {
  'dv': 'dev',
  'ut': 'user',
  'pp': 'preprod',
  'pd': 'prod'
};

const inMap = (env) => {
  return Object.keys(keyMap).filter((k) => env.includes(k))
};

// let inMap = (env, envs) => {
//   Object.keys(keyMap).filter((k) => {
//     if(env.includes(k)) {
//       desc.dev[env] = envs[env];
//     }
//   });
// };

const map = (envs) => {
  let desc = {};
  return Object.keys(envs).map((env) => {
    // console.log(env);
    let key = keyMap[inMap(env)];
    (desc[key] = desc[key] || []).push(env)
    // console.log('human readable key mapping', desc);
    // console.log(key, '==>', env, envs[key]);
    return desc;
  }).reduce((prev, current, index, context) => {
    // console.log('current item', current);
    Object.keys(current).map((level) => {
      // console.log('level', level, '==>', current[level]);
      current[level].map((box) => {
        // console.log('current level...', current[level]);
        // console.log('mapping box...', box, 'with', envs[box]);
        // if (current[level] instanceof Array) {
        //   current[level] = {};
        // }
        current[level][box] = envs[box];
        console.log('current after mapping', current[level]);
      })
    });
    return current;
  }, desc);

  // .reduce((envs) => {
  //   console.log('envsnow', envs);
  //   return envs
  //   // desc.dev[env] = envs[env];
  // }, {});
}

module.exports = map;
module.exports.inMap = inMap;