let NV5Common = (function() {

  let cache = {};
  let widgetColors = ["#5465FF", "#00BECC", "#E64C54", "#BFD7FF", "#E4A5AA", "#666666", "#000000"];
  let messages = {
    'keyError': "An error occurred.",
    'keyErrorTooltip': "An error occurred at tooltip",
    'errorWidget': "An error occurred showing visualization.",
    'errorAjax': "An error occurred fetching data.",
  };

  function _in_cache(key) {
    return cache[key] !== undefined
  }

  function _load_from_cache(key) {
    return cache[key];
  }

  function _save_cache(key, data) {
    cache[key] = data
  }

  function _getMessage(xhr) {

    try {
      prs = JSON.parse(xhr.responseText);
    }
    catch(Exception) {
      prs = "";
    }
    if (prs.data !== undefined && prs.data.error != undefined) {
      return prs.data.error
    }
    if (prs.message !== undefined) {
      return prs.message
    }
    return getFormatedLogString(getMessages('errorAjax'));

  }

  function getMessages(key){
    return (key in messages) ? messages[key] : messages['keyError'];
  }

  String.prototype.formatUrl = function() {
    var args = arguments;
    return this.replace(/\$\{\w+\}/g, function(match) {
      return args[0][match.substring(2, match.length-1)];
    });
  };

  function makeRequest(endpointObject) {
    return new Promise(function (resolve, reject) {

      let method = endpointObject.method;
      let url = endpointObject.url;
      let params = (
        endpointObject.parameters === undefined ||
        (Object.keys(endpointObject.parameters).length === 0 && endpointObject.parameters.constructor === Object)
      ) ? undefined : endpointObject.parameters;
      let headers = (
        endpointObject.headers === undefined ||
        (Object.keys(endpointObject.headers).length === 0 && endpointObject.headers.constructor === Object)
      ) ? undefined : endpointObject.headers;

      let useCache = (endpointObject.cache === undefined || endpointObject.cache);

      let xhr = new XMLHttpRequest();
      let data = "";

      if (headers !== undefined) {
        for (let key of headers.keys()) {
          xhr.setRequestHeader(key, headers.get(key));
        }
      }

      if ((method === 'POST' || method === 'PUT') && params !== undefined) {
        data = new FormData();
        for (let key of params.keys())  {
          data.append(key, params.get(key));
        }
      }
      else {
        if (method === 'GET' && params !== undefined) {
          url = url.formatUrl(params);
        }
      }

      if (useCache && method === 'GET' && _in_cache(url)) {
        data = resolve(_load_from_cache(url))
      } else {
        xhr.open(method, url);

        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            let rsp = JSON.parse(xhr.response);

            if (useCache) {
              _save_cache(url, rsp);
            }

            resolve(rsp);
          } else {
            reject({
              status: this.status,
              statusText: xhr.statusText,
              //error: JSON.parse(xhr.responseText).data.error
              error: _getMessage(xhr)
            });
          }
        };

        xhr.onerror = function () {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        };

        xhr.send(data);
      }

    });
  }

  function generateInternalElementId(container){
    let hash = 0, i, chr;
    if (container.length !== 0) {
      for (i = 0; i < container.length; i++) {
        chr   = container.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
    }
    return container+"-"+hash;
  }

  function overlayAction(type) {
    return function(container){
      document.getElementById(container).style.visibility = (type === "hide") ? "hidden" : "visible";
      document.getElementById(container).style.opacity = (type === "hide") ? "0" : "1"; // for animation purposes
      document.body.style.overflow = (type === "hide") ? "auto" : "hidden"; // disable body scroll
    }
  }

  function showHideContainer(type) {
    return function(container){
      document.getElementById(container).style.display = (type === "hide") ? "none" : "block";
    }
  }

  function getFormatedLogString(input) {
    return "[NV5] " + input + "\n";
  }

  return {
    makeRequest: makeRequest,
    generateInternalElementId: generateInternalElementId,
    getFormatedLogString: getFormatedLogString,
    hideOverlay: overlayAction("hide"),
    showOverlay: overlayAction("show"),
    removeContainer: showHideContainer("hide"),
    blockContainer: showHideContainer("show"),
    getMessages: getMessages,
    getColor: (i) => {
      if (i > widgetColors.length) i=widgetColors.length-1;
      return widgetColors[i];
    }
  }
})();

document.addEventListener('click', function(e) {
  if (e.target.dataset["nv5EventType"] !== undefined) {
    let btns, ids;
    switch(e.target.dataset["nv5EventType"]) {
      case "close-overlay":
        NV5Common.hideOverlay(e.target.dataset["nv5Parent"]);
        break;

      case "open-overlay":
        NV5Common.showOverlay(e.target.dataset["nv5Parent"]);
        break;

      case "switch-container":
        btns = document.querySelectorAll("[data-nv5-widget-container-family='" + e.target.dataset["nv5WidgetContainerFamily"] + "']");

        Array.from(btns).forEach((btn) => {
          if(btn.dataset["nv5WidgetContainerSelf"] === e.target.dataset["nv5WidgetContainerSelf"]) {
            btn.classList.add("nv5-btn-active");
            NV5Common.blockContainer(e.target.dataset["nv5WidgetContainerId"]);
          }
          else if (btn.classList.contains("nv5-btn-active")) {
            btn.classList.remove("nv5-btn-active");
            NV5Common.removeContainer(btn.dataset["nv5WidgetContainerId"]);
          }
        });
        break;

      case "widget-switcher-module":
        btns = document.querySelectorAll("[data-nv5-widget-container-family='" + e.target.dataset["nv5WidgetContainerFamily"] + "']");

        Array.from(btns).forEach((btn) => {
          if(btn.dataset["nv5WidgetContainerSelf"] === e.target.dataset["nv5WidgetContainerSelf"]) {
            btn.classList.add("nv5-btn-active");
            ids = NV5WidgetSwitcher.getContainersForIdAndGroup(
              btn.dataset["nv5WidgetContainerFamily"],
              btn.dataset["nv5WidgetContainerGroup"]
            );
            ids.forEach((id)=>{
              NV5Common.blockContainer(id);
            })
          }
          else if (btn.classList.contains("nv5-btn-active")) {
            btn.classList.remove("nv5-btn-active");
            ids = NV5WidgetSwitcher.getContainersForIdAndGroup(
              btn.dataset["nv5WidgetContainerFamily"],
              btn.dataset["nv5WidgetContainerGroup"]
            );
            ids.forEach((id)=>{
              NV5Common.removeContainer(id);
            })
          }
        });
        break;
    }
  }
});

document.addEventListener('mouseover', function(e) {
  if (e.target.dataset["nv5EventType"] !== undefined) {
    switch (e.target.dataset["nv5EventType"]) {
      case "show-element":
        NV5Common.blockContainer(e.target.dataset["nv5Element"]);
        break;
    }
  }
});

document.addEventListener('mouseout', function(e) {
  if (e.target.dataset["nv5EventType"] !== undefined) {
    switch (e.target.dataset["nv5EventType"]) {
      case "show-element":
        NV5Common.removeContainer(e.target.dataset["nv5Element"]);
        break;
    }
  }
});
