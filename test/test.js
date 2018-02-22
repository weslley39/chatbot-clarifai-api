var should = require('chai').should()
var app = require('../dist/index.js');

describe('app', () => {
  describe('triggers', () => {

    it('"bom dia" should be a trigger', () => {
      app.isTriggerMessage('bom dia').should.eq(true);
    });

    it('"estou otimo should be a trigger', () => {
      app.isTriggerMessage('estou otimo').should.eq(true);
    });

    it('"estou ótimo should be a trigger', () => {
      app.isTriggerMessage('estou ótimo').should.eq(true);
    });

    it('"estamos otimos should be a trigger', () => {
      app.isTriggerMessage('estou ótimo').should.eq(true);
    });

    it('"estamos ótimos should be a trigger', () => {
      app.isTriggerMessage('estou ótimo').should.eq(true);
    });

    it('trigger should ignore case', () => {
        app.isTriggerMessage('BOM DIA').should.eq(true);
    })
  });
});