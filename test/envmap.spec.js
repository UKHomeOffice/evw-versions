'use strict';

const data = require('../envs-saved.json');
const map = require('../envmap');
const mapped = map(data);

describe('envmap', function () {
  describe('#level', function () {
    it('returns map reference', function () {
      map.level('dvcus01').should.deep.equal('dev');
      map.level('ppcas02').should.deep.equal('preprod');
      map.level('utcus01').should.deep.equal('user');
      map.level('pdocr9999').should.deep.equal('prod');
    });
  });
  describe('map', function () {
    // console.log(mapped);
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
        'dvocr02'
        // ,
        // 'dvwps01'
      ]);
    });
    it('a dev box should contain apps objects', function () {
      mapped.dev.dvcus01.should.contain.all.keys([
        'evw-customer',
        'flights-forecast-service',
        'evw-self-serve',
        'evw-application-processor'
      ]);
    });
    describe('apps are objects', function () {
      let dvcus = mapped.dev.dvcus01;
      Object.keys(dvcus).forEach((name) => {
        let app = dvcus[name];
        describe(`${name}`, () => {
          it(`is an object`, function () {
            app.should.be.an('object');
          });
          it(`has application property`, function () {
            app.should.have.property('application')
              .that.is.a('string');
          });
          it(`has version property`, function () {
            app.should.have.property('version')
              .that.is.a('string')
          });
        });
      });
    });
  });
});
