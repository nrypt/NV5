/*
    Depends on NV5Common
 */
let NV5WidgetSwitcher = (function() {

  let switchers = {};

  Array.prototype.flatMap = function(lambda) {
    return Array.prototype.concat.apply([], this.map(lambda));
  };

  function generateButtonElement(container, reference, content, customClass) {
    let elemBtn = document.createElement('button');
    elemBtn.classList.add("btn");
    elemBtn.classList.add("nv5-btn-primary");
    if (customClass !== undefined) {
      elemBtn.classList.add(customClass);
    }
    elemBtn.setAttribute("content", content);
    elemBtn.setAttribute("data-nv5-event-type", "widget-switcher-module");
    elemBtn.setAttribute("data-nv5-widget-container-family", container);
    elemBtn.setAttribute("data-nv5-widget-container-group", content);
    elemBtn.setAttribute("data-nv5-widget-container-self", reference + "-switch-button");
    elemBtn.innerHTML = content;
    return elemBtn;
  }

  function registerSwitch(id, group, widgetId, customClass) {
    if (!switchers.hasOwnProperty(id)) {
      switchers[id] = {
        'groups': {}
      }
    }

    if(!switchers[id].groups.hasOwnProperty(group)) {
      switchers[id].groups[group] = {
        'button': {},
        'widgets': []
      }
      switchers[id].groups[group].button = generateButtonElement(id, group, group, customClass);
    }
    switchers[id].groups[group].widgets.push(widgetId);
  }

  function render(container, id) {
    if (switchers.hasOwnProperty(id)) {
      let elem = document.createElement('div');

      Object.keys(switchers[id].groups).forEach((group) => {
        elem.appendChild(switchers[id].groups[group].button);
      });

      document.getElementById(container).appendChild(elem);
    }
    else {
      NV5Common.getFormatedLogString("Widget Switcher ID invalid or non-existent.");
    }
  }

  function getContainersForId() {
    if (!switchers.hasOwnProperty(id)) {
      NV5Common.getFormatedLogString("Widget Switcher ID invalid or non-existent.");
      return [];
    }
    let ids = [];

    Object.keys(switchers[id].groups).forEach((group) => {
      ids.push(switchers[id].groups[group].widgets.map((x) => { return x; }));
    });

    return ids;
  }

  function getContainersForIdAndGroup(id, group) {
    if (!switchers.hasOwnProperty(id) && !switchers[id].hasOwnProperty(group)) {
      NV5Common.getFormatedLogString("Widget Switcher ID and/or GROUP is invalid or non-existent.");
      return [];
    }
    return switchers[id].groups[group].widgets;

  }

  return {
    generateButtonElement: generateButtonElement,
    getContainersForIdAndGroup: getContainersForIdAndGroup,
    registerSwitch: registerSwitch,
    render: render
  }
})();
