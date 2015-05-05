'use strict';

var rewire = require('rewire');
var chai = require('chai');
var sinon = require('sinon');

chai.config.includeStack = true;
chai.use(require('sinon-chai'));

var expect = chai.expect;

describe('nyanCat.js test suite', function() {
  var sut;
  var module;
  var configFake;
  var drawUtilInstanceFake;
  var drawUtilFake;
  var rainbowifierInstanceFake;
  var rainbowifierFake;
  var dataStoreInstanceFake;
  var dataStoreFake;
  var printersFake;
  var shellUtilFake;
  var defaultProps;
  var defaultPropertyKeys;

  beforeEach(function(done) {
    configFake = {};

    drawUtilInstanceFake = {
      'appendRainbow' : sinon.spy(),
      'drawScoreboard' : sinon.spy(),
      'drawRainbow' : sinon.spy(),
      'drawNyanCat' : sinon.spy(),
      'tick' : true
    };

    drawUtilFake = {
      'getInstance' : sinon.stub()
    };

    drawUtilFake
      .getInstance
        .returns(drawUtilInstanceFake);

    rainbowifierInstanceFake = {
      'rainbowify' : sinon.spy()
    };

    rainbowifierFake = {
      'getInstance' : sinon.stub()
    };

    rainbowifierFake
      .getInstance
        .returns(rainbowifierInstanceFake);

    dataStoreInstanceFake = {
      'save' : sinon.spy(),
      'getData' : sinon.spy()
    };

    dataStoreFake = {
      'getInstance' : sinon.stub()
    };

    dataStoreFake
      .getInstance
        .returns(dataStoreInstanceFake);

    printersFake = {
      'write' : sinon.spy(),
      'printBrowserErrors' : sinon.spy(),
      'printTestFailures' : sinon.spy(),
      'printBrowserLogs' : sinon.spy()
    };

    shellUtilFake = {
      'window' : {
        'width' : 100
      },
      'cursor' : {
        'show' : sinon.spy(),
        'hide' : sinon.spy()
      }
    };

    defaultPropertyKeys = [
      'options', 'adapterMessages', 'adapters'
    ];

    module = rewire('../lib/nyanCat');
    module.__set__('drawUtil', drawUtilFake);
    module.__set__('rainbowifier', rainbowifierFake);
    module.__set__('dataStore', dataStoreFake);
    module.__set__('printers', printersFake);
    module.__set__('shellUtil', shellUtilFake);
    done();
  });

  afterEach(function(done) {
    sut = null;
    module = null;
    configFake = null;
    drawUtilInstanceFake = null;
    drawUtilFake = null;
    dataStoreInstanceFake = null;
    dataStoreFake = null;
    printersFake = null;
    rainbowifierInstanceFake = null;
    rainbowifierFake = null;
    shellUtilFake = null;
    defaultPropertyKeys = null;
    done();
  });

  /**
   * Constructor Tests
   */

  describe('test constructor', function() {

    it('should have expected default properties', function() {
      var msg = 'my message';

      sut = new module.NyanCat(null, null, configFake);

      expect(sut).to.contain.keys(defaultPropertyKeys);
      expect(sut.options).to.not.be.an.object;
      expect(sut.options.suppressErrorReport).to.be.false;
      expect(sut.adapterMessages).to.be.an.array;
      expect(sut.adapterMessages).to.be.empty;
      expect(sut.adapters).to.be.an.array;
      expect(sut.adapters).to.have.length(1);
      expect(sut.adapters[0]).to.be.a.function;

      sut.adapters[0](msg);

      expect(sut.adapterMessages).to.have.length(1);
      expect(sut.adapterMessages[0]).to.equal(msg);
    });

    it('should set options when passed in via config', function() {
      configFake.nyanReporter = {
        'suppressErrorReport' : true,
        'someOtherOption' : 1234
      };

      sut = new module.NyanCat(null, null, configFake);

      expect(sut.options.suppressErrorReport).to.be.true;
      expect(sut.options.someOtherOption).to.be.undefined;
    });

  });

  /**
   * reset() tests
   */

  describe('test reset method', function() {
    var props;

    beforeEach(function(done) {
      sut = new module.NyanCat(null, null, configFake);

      props = {
        '_browsers' : [],
        'allResults' : {},
        'browser_logs' : {},
        'browserErrors' : [],
        'colorIndex' : 0,
        'dataStore' : dataStoreInstanceFake,
        'drawUtil' : drawUtilInstanceFake,
        'rainbowifier' : rainbowifierInstanceFake,
        'stats' : {},

        'totalTime' : 0,
        'numberOfSlowTests' : 0
      };

      done();
    });

    afterEach(function(done) {
      props = null;
      done();
    });

    it('should not have these properties before reset is called', function() {
      expect(sut).to.not.have.keys(Object.keys(props));
    });

    it('should have the expected properties/values afterEach reset is called', function() {
      sut.reset();

      expect(sut).to.have.keys(Object.keys(props).concat(defaultPropertyKeys));

      for (var key in props) {
        expect(sut[key]).to.eql(props[key]);
      }
    });

    it('should call dataStoreFake.getInstance()', function() {
      sut.reset();
      expect(dataStoreFake.getInstance.calledOnce).to.be.true;
    });

  });

  /**
   * onRunStart() tests
   */

  describe('onRunStart method tests', function() {
    var resetSpy;

    beforeEach(function(done) {
      resetSpy = sinon.spy(module.NyanCat.prototype, 'reset');

      sut = new module.NyanCat(null, null, configFake);

      done();
    });

    afterEach(function(done) {
      resetSpy = null;
      done();
    });

    it('should call the expected methods', function() {
      sut.onRunStart();

      expect(shellUtilFake.cursor.hide.calledOnce).to.be.true;
      expect(resetSpy.calledOnce).to.be.true;
      expect(printersFake.write.calledOnce).to.be.true;
      expect(printersFake.write.calledWithExactly('\n')).to.be.true;
    });

    it('should set numberOfBrowsers to 0', function() {
      sut.onRunStart();

      expect(sut.numberOfBrowsers).to.eq(0);
    });

    it('should set numberOfBrowsers to length of browsers arg', function() {
      sut.onRunStart(['1', '2', '3']);

      expect(sut.numberOfBrowsers).to.eq(3);
    });

  });

  /**
   * onBrowserLog() tests
   */

  describe('onBrowserLog method tests', function() {
    var browser1;
    var browser2;
    var log1;
    var log2;

    beforeEach(function(done) {
      browser1 = {
        'id' : 'fakeBrowserId1',
        'name' : 'fakeBrowserName1'
      };

      browser2 = {
        'id' : 'fakeBrowserId2',
        'name' : 'fakeBrowserName2'
      };

      log1 = 'log message 1';
      log2 = 'log message 2';

      sut = new module.NyanCat(null, null, configFake);
      sut.browser_logs = {};

      done();
    });

    afterEach(function(done) {
      browser1 = null;
      browser2 = null;
      log1 = null;
      log2 = null;
      done();
    });

    it('should add an entry to the browser_logs property', function() {
      sut.onBrowserLog(browser1, log1, null);

      expect(sut.browser_logs[browser1.id]).to.be.an.object;
      expect(sut.browser_logs[browser1.id].name).to.eq(browser1.name);
      expect(sut.browser_logs[browser1.log_messages]).to.be.an.array;
      expect(sut.browser_logs[browser1.id].log_messages.length).to.eq(1);
      expect(sut.browser_logs[browser1.id].log_messages[0]).to.eq(log1);
    });

    it('should add a new entry to log_messages if the browser.id exists', function() {
      sut.onBrowserLog(browser1, log1, null);
      sut.onBrowserLog(browser1, log2, null);

      var logs = sut.browser_logs[browser1.id].log_messages;

      expect(logs.length).to.eq(2);
      expect(logs[0]).to.eq(log1);
      expect(logs[1]).to.eq(log2);
    });

    it('should add a separate browser_log entry for each browser id', function() {
      sut.onBrowserLog(browser1, log1, null);
      sut.onBrowserLog(browser2, log2, null);

      var logs1 = sut.browser_logs[browser1.id].log_messages;
      var logs2 = sut.browser_logs[browser2.id].log_messages;

      expect(logs1.length).to.eq(1);
      expect(logs2.length).to.eq(1);
      expect(logs1[0]).to.eq(log1);
      expect(logs2[0]).to.eq(log2);
    });
  });

  /**
   * onSpecComplete() tests
   */

  describe('onSpecComplete method tests', function() {
    var browser;
    var result;

    beforeEach(function(done) {
      browser = {
        'lastResult' : 'last result'
      };

      result = {};

      sut = new module.NyanCat(null, null, configFake);
      sut.dataStore = dataStoreInstanceFake;
      sut.draw = sinon.spy();
      done();
    });

    afterEach(function(done) {
      browser = null;
      result = null;
      done();
    });

    it('should set sut.stats to the value of browser.lastResult', function() {
      sut.onSpecComplete(browser, result);
      expect(sut.stats).to.eq(browser.lastResult);
    });

    it('should only call save on dataStore when suppressErrorReport is false', function() {
      sut.options.suppressErrorReport = true;
      sut.onSpecComplete(browser, result);

      expect(dataStoreInstanceFake.save.called).to.be.false;

      sut.options.suppressErrorReport = false;
      sut.onSpecComplete(browser, result);

      expect(dataStoreInstanceFake.save.calledOnce).to.be.true;
      expect(dataStoreInstanceFake.save.calledWithExactly(browser, result)).to.be.true;
    });

    it('should call the draw method', function() {
      sut.onSpecComplete(browser, result);
      expect(sut.draw.calledOnce).to.be.true;
    });

  });

  /**
   * onRunComplete() tests
   */

  describe('onRunComplete method tests', function() {
    beforeEach(function(done) {
      sut = new module.NyanCat(null, null, configFake);
      sut.browserErrors = [];
      sut.dataStore = dataStoreInstanceFake;
      sut.stats = 'stats';
      sut.browser_logs = 'browser_logs';
      done();
    });

    it('should always call shellUtilFake.cursor.show()', function() {
      sut.onRunComplete();
      expect(shellUtilFake.cursor.show.calledOnce).to.be.true;
    });

    it('should call the expected methods when browserErrors is empty', function() {
      sut.onRunComplete();
      expect(printersFake.printTestFailures.calledOnce).to.be.true;
      expect(printersFake.printBrowserLogs.calledOnce).to.be.true;
      expect(printersFake.printTestFailures.calledWithExactly(sut.dataStore.getData(), sut.stats, sut.options.suppressErrorReport)).to.be.true;
      expect(printersFake.printBrowserLogs.calledWithExactly(sut.browser_logs)).to.be.true;
    });

    it('should call the expected methods when borwserErrors is not empty', function() {
      sut.browserErrors.push()
    });
  });

  /**
   * onBrowserStart() tests
   */

  describe('onBrowserStart method tests', function() {
    it('should add to the _browsers array and set numberOfBrowsers to _browsers.length', function() {
      var browser1 = 'browser1';
      var browser2 = 'browser2';

      sut = new module.NyanCat(null, null, configFake);
      sut._browsers = [];
      sut.numberOfBrowsers = 0;

      sut.onBrowserStart(browser1);
      expect(sut._browsers.length).to.eq(1);
      expect(sut._browsers[0]).to.eq(browser1);
      expect(sut.numberOfBrowsers).to.eq(sut._browsers.length);

      sut.onBrowserStart(browser2);
      expect(sut._browsers.length).to.eq(2);
      expect(sut._browsers[1]).to.eq(browser2);
      expect(sut.numberOfBrowsers).to.eq(sut._browsers.length);
    });
  });

  /**
   * onBrowserError() tests
   */

  describe('onBrowserError method tests', function() {
    it('should add to the browserErrors property', function() {
      var browser = 'browser';
      var error = 'error';

      sut = new module.NyanCat(null, null, configFake);
      sut.browserErrors = [];

      sut.onBrowserError(browser, error);
      expect(sut.browserErrors.length).to.eq(1);
      expect(sut.browserErrors[0]).to.eql({"browser": browser, "error": error});
    });
  });

  /**
   * draw() tests
   */

  describe('draw method tests', function() {
    it('should call the correct methods and negate the tick property', function() {
      sut = new module.NyanCat(null, null, configFake);
      var util = sut.drawUtil = drawUtilInstanceFake;

      sut.draw();
      expect(util.appendRainbow.calledOnce).to.be.true;
      expect(util.drawScoreboard.calledOnce).to.be.true;
      expect(util.drawRainbow.calledOnce).to.be.true;
      expect(util.drawNyanCat.calledOnce).to.be.true;
      expect(util.tick).to.be.false;

      sut.draw();
      expect(util.appendRainbow.calledTwice).to.be.true;
      expect(util.drawScoreboard.calledTwice).to.be.true;
      expect(util.drawRainbow.calledTwice).to.be.true;
      expect(util.drawNyanCat.calledTwice).to.be.true;
      expect(util.tick).to.be.true;
    });
  });


});