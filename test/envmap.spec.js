'use strict';

const data = require('../envs');
const map = require('../envmap');

// describe('inMap', function () {
//   let inMap = map.inMap;
// });

describe('envmap', function () {
  let mapped = map(data);
  console.log(mapped);
  it('should split into environment levels', function () {
    mapped.should.contain.keys([
      'dev',
      'user',
      'preprod',
      'prod',
    ]);
  });

  it('should have all the dev boxes', function () {
    mapped.dev.should.contain.keys([
      'dvcas01',
      'dvcas02',
      'dvcus01',
      'dvcus02',
      'dvocr01',
      'dvocr02',
      'dvwps01'
    ]);
  });
});

// todo make this a comprehensive test
    // when we know what the list should look like
    // console.log(mapped.prod)
    //   'pdcas02',
    //   'pdcus02',
    //   'pdocr02',

    //   'ppcas01',
    //   'ppcus01',
    //   'ppocr01',

    //   'utcas01',
    //   'utcas02',
    //   'utcus01',
    //   'utcus02',
    //   'utocr01',
    //   'utocr02',
    //   'utwps01'
    // ])