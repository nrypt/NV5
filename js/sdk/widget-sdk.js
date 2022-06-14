(function(window, undefined) {
  let NV5 = {};
  let WidgetFactory = () => {}; // defined after loading scripts
  let widgetTypes = new Map(); // defined after loading scripts
  let typesLoaded = {};
  let typeElements = {};
  window.NV5SDKURL = window.location.protocol + '//' + window.location.host;

  function typeExists(type) {
    return (widgetTypes.has(type.toLowerCase()));
  }

  let load = (function() {

    function _load(tag) {
      return function(url, async) {

        return new Promise(function(resolve, reject) {
          let element = document.createElement(tag);
          let parent = 'body';
          let attr = 'src';

          element.onload = function() {
            resolve(url);
          };
          element.onerror = function() {
            reject(url);
          };

          switch(tag) {
            case 'script':
              element.async = async;
              break;
            case 'scriptmodule':
              element.async = async;
              element.type = 'module';
              break;
            case 'link':
              element.type = 'text/css';
              element.rel = 'stylesheet';
              attr = 'href';
              parent = 'head';
          }

          element[attr] = url;
          document[parent].appendChild(element);
        });
      };
    }

    return {
      css: _load('link'),
      js: _load('script'),
      jsModule: _load('scriptmodule'),
      img: _load('img')
    }
  })();

  let baseConditions = function() {
    return new Promise(function (resolve, reject) {
      if (window.NV5SDKURL === 'undefined' || window.NV5SDKURL === null || typeof window.NV5SDKURL != 'string') {
        reject("Missing 'window.NV5SDKURL' variable");
      }
      resolve();
    });
  };

  NV5.Add = function(type, container, endpointObject, options/*, keyMapping*/) {

    if (!typeExists(type)) {
      throw "Unknown graph type '" + type + "' for container '" + container + "'";
    }

    if (!typeElements[type].hasOwnProperty(container)) {
      typeElements[type][container] = {};

      let c = WidgetFactory(type, container, endpointObject, options/*, keyMapping*/);
      c.init();

      typeElements[type][container] = c;

      return c;
    }
    else {
      throw type.charAt(0).toUpperCase() + type.slice(1).toLocaleLowerCase() + " '" + container + "' already present.";
    }

  };

  // NV5.CreateToolbar = function(title, id, endpointObject) {
  //   return new Promise(function(resolve, reject) {
  //     let containerId = id;
  //     let containerElemId = BCommon.generateInternalElementId(containerId);
  //     let eventId = containerElemId + '-event';
  //     let toolbar = new Toolbar(title, containerId, containerElemId, eventId, endpointObject);
  //     toolbar.startMenuAndEventListener();
  //     return resolve(toolbar);
  //   });
  // };
  //
  // NV5.StartToolbar = function(toolbar) {
  //   toolbar.startMenuAndEventListener();
  // };

  /*
  NV5.WidgetSwitcher = function(container, id) {
      return function(...groups) {
          groups.forEach((group) => {
              NV5WidgetSwitcher.registerSwitch(container, id, group);
          });
          NV5WidgetSwitcher.render(container)
      }
  };
  */
  // NV5.WidgetSwitcher = function(container, id) {
  //   NV5WidgetSwitcher.render(container, id);
  // };

  Promise.all([
    baseConditions(),
    load.js('https://d3js.org/d3.v7.min.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/common.js', false),
    load.css(window.NV5SDKURL + '/css/sdk/widget.css', false),
    // load.css(window.NV5SDKURL + '/css/sdk/toolbar.css', false),
    // load.css(window.NV5SDKURL + '/css/sdk/table.css', false),
    load.js(window.NV5SDKURL + '/js/sdk/widget.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/widget-switcher.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/line.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/charts/line.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/histogram.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/charts/histogram.js', false),
    load.js(window.NV5SDKURL + '/js/sdk/table.js', false),
  ]).then(function() {

    widgetTypes = new Map([['histogram', Histogram], ['line', Line],]);

    Array.from(widgetTypes.keys()).forEach(function(type) {
      typeElements[type] = {};
      typesLoaded[type] = false;
    });

    WidgetFactory = (type, ...options) => {
      let Widget = widgetTypes.get(type);
      let instance = new Widget(...options);
      return instance;
    }

    window.NV5 = NV5;
    if (typeof window.NV5_ready == 'function') {
      window.NV5_ready();
    }

  }).catch((e) => {
    console.log('[NV5][Widget] An error occurred. ' + e);
  });

})(this);
