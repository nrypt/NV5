class Widget {
  constructor(container, endpointObject, options, keyMapping){

    this._endpointObject = (endpointObject === undefined) ? {} : endpointObject;

    this._options = (options === undefined) ? {} : options;
    this._toolbar = (this._options.toolbar === undefined) ? undefined : this._options.toolbar;
    let eventId = (this._toolbar === undefined) ? undefined : this._toolbar.getEventId();
    this._withInfo = {
      'show': (this._options.info !== undefined && this._options.info),
      'loaded': false,
      'url': '',
      'message': '',
    };
    this._withTableWidget = (this._options.auxTable !== undefined && this._options.auxTable && !(this instanceof Table));
    this._actions = (this._options.actions !== undefined) ? this._options.actions : [];
    this._infoTableButtonsSpaceHeight = 60;
    let infoTableButtonsSpace = (this._withTableWidget) ? this._infoTableButtonsSpaceHeight : 0;


    this._keyMapping = this._endpointObject.keyMapping;

    this._switcher = undefined;
    let visible = true;
    if (this._options.switcher !== undefined && this._options.switcher.id !== undefined && this._options.switcher.group !== undefined) {
      this._options.switcher.visible = (this._options.switcher.visible !== undefined && this._options.switcher.visible);
      this._switcher = this._options.switcher;
      visible = this._switcher.visible
    }
    this._visible = visible;

    let fs = (document.getElementById(container).offsetWidth === undefined ||
      document.getElementById(container).offsetWidth === 0) ? 400 : document.getElementById(container).offsetWidth;

    // aux table with the same as parent
    let isAuxTable = false;
    if (this instanceof Table && endpointObject === undefined && options === undefined) {
      isAuxTable = true;
    }

    this._containerId = container;
    this._containerElemId = NV5Common.generateInternalElementId(this._containerId);
    this._containerInfoId = this._containerElemId + "-info";
    this._containerTableId = this._containerElemId + "-table";
    this._containerTableButtonsId = this._containerTableId + "-buttons";
    this._containerLoadingId = this._containerElemId + "-loading";
    this._containerCustomMessageId = this._containerElemId + "-custom-message";
    this._chart = undefined;
    this._fs = fs;
    this._width = this._fs;

    if (!(this instanceof Table)) {
      // this._height = (this instanceof HorizontalGauge) ? 120 : this._width;
      /*
      let h = parseInt(window.getComputedStyle(document.getElementById(container), null).getPropertyValue("height"));
      this._height = (h === undefined || h === 0) ? this._height : h;
      */
      this._height = (document.getElementById(container).offsetHeight === undefined ||
        document.getElementById(container).offsetHeight === 0) ? this._height : document.getElementById(container).offsetHeight;
    }

    this._eventId = eventId;

    if (this._eventId !== undefined) {
      document.addEventListener(this._eventId, (e) => this.listener(e), false);
    }

    if (this._switcher !== undefined) {
      NV5WidgetSwitcher.registerSwitch(
        this._switcher.id,
        this._switcher.group,
        this._containerId,
        ((this._switcher.visible) ? "nv5-btn-active" : undefined));
    }

    let elem = document.createElement('div');
    elem.setAttribute("id", this._containerElemId);
    elem.classList.add("nv5-container-default");
    /*
    if (!visible) {
        document.getElementById(this._containerId).classList.add("nv5-widget-switcher-hide");
    }
    */

    let elemLoading = document.createElement('div');
    elemLoading.setAttribute("id", this._containerLoadingId);
    elemLoading.classList.add("nv5-widget-loading");
    document.getElementById(this._containerId).appendChild(elemLoading);

    let elemMsg = document.createElement('div');
    elemMsg.setAttribute("id", this._containerCustomMessageId);
    elemMsg.classList.add("nv5-widget-message");
    elemMsg.style.width = this._width*0.75;
    elemMsg.style.maxHeight = this._height*0.75;
    document.getElementById(this._containerId).appendChild(elemMsg);
    let msg = document.createElement('div');
    msg.classList.add("nv5-valign-middle");
    document.getElementById(this._containerCustomMessageId).appendChild(msg);


    if (this._withTableWidget) {
      let elemTableButtons = document.createElement('div');
      elemTableButtons.setAttribute("id", this._containerTableButtonsId);
      elemTableButtons.classList.add("nv5-widget-table-buttons");
      document.getElementById(this._containerId).appendChild(elemTableButtons);
      this.createTableSwitchButtons();

      let elemTable = document.createElement('div');
      elemTable.classList.add("nv5-widget-table-holder");
      let elemTableInner = document.createElement('div');
      elemTableInner.setAttribute("id", this._containerTableId);
      elemTableInner.classList.add("nv5-widget-table-holder-inner");
      elemTableInner.classList.add("nv5-widget-table-display-transition");
      elemTableInner.style.width = this._width + "px";
      //elemTableInner.style.height = this._height + "px";
      document.getElementById(this._containerId).style.height = null;
      elemTable.appendChild(elemTableInner);
      document.getElementById(this._containerId).appendChild(elemTable);
      //document.getElementById(this._containerId).appendChild(elemTableInner);

      this._table = new Table(this._containerTableId);
      if (this._options.table !== undefined && this._options.table.transpose !== undefined && this._options.table.transpose) {
        this._table.transposeTable(true);
      }
      this._table.hideLoading();
    }

    document.getElementById(this._containerId).appendChild(elem);
    document.getElementById(this._containerId).classList.add("nv5-container-widget-" + this.constructor.name.toLowerCase());
    document.getElementById(this._containerId).style.width = (!isAuxTable) ? this._width + "px" : "100%";
    document.getElementById(this._containerElemId).style.width = (!isAuxTable) ? this._width + "px" : "100%";
    document.getElementById(this._containerElemId).classList.add("nv5-widget-table-display-transition");
    document.getElementById(this._containerLoadingId).style.width = (!isAuxTable) ? this._width + "px" : "100%";
    document.getElementById(this._containerCustomMessageId).style.width = (!isAuxTable) ? this._width + "px" : "100%";
    document.getElementById(this._containerElemId).innerHTML = "";
    document.getElementById(this._containerLoadingId).innerHTML = "<div class=\"nv5-spinner\"><div class=\"nv5-double-bounce1\"></div><div class=\"nv5-double-bounce2\"></div></div>";

    if (!this._withTableWidget) {
      this.customHeight(this._containerId, this._height + infoTableButtonsSpace);
    }
    this.customHeight(this._containerElemId, this._height);
    this.customHeight(this._containerLoadingId, this._height + infoTableButtonsSpace);
    this.customHeight(this._containerCustomMessageId, this._height + infoTableButtonsSpace);

    if (this._endpointObject.parametersToUpdate === undefined) {
      this._endpointObject.parametersToUpdate = [];
    }

    this._sheet = (function() {
      var style = document.createElement("style");
      // WebKit hack :(
      style.appendChild(document.createTextNode(""));
      document.head.appendChild(style);
      return style.sheet;
    })();

    this.showLoading();
  }

  draw(data) {
    document.getElementById( this._containerElemId).innerHTML = this._chart.outerHTML;
    this.renderTable(data);
  }

  updateData(data) {
    this.renderTable(data);
  }

  endDataRender() {
    this.executeCustomActions();
    this.hideLoading();
    if (!this._visible) {
      document.getElementById(this._containerId).classList.add("nv5-widget-switcher-hide");
    }
  }

  renderTable(data) {
    if (this._withTableWidget) {
      let dt = this.transformDataToTable(data);
      this._table.draw(dt);
      let table = document.getElementById(this._containerTableId).getElementsByTagName("table")[0];
      // table.classList.add("nv5-valign-middle");
      table.classList.add("table");
      table.classList.add("table-striped");
      table.classList.add("table-bordered");
      table.classList.add("dataTable");
      table.classList.add("no-footer");
    }
  }

  createTableSwitchButtons() {

    function generateButtonElement(container, reference, content, customClass) {
      let elemBtn = document.createElement('button');
      elemBtn.classList.add("btn");
      elemBtn.classList.add("nv5-btn-primary");
      if (customClass !== undefined) {
        elemBtn.classList.add(customClass);
      }
      elemBtn.setAttribute("content", content);
      elemBtn.setAttribute("data-nv5-event-type", "switch-container");
      elemBtn.setAttribute("data-nv5-widget-container-family", container);
      elemBtn.setAttribute("data-nv5-widget-container-self", reference + "-switch-button");
      elemBtn.setAttribute("data-nv5-widget-container-id", reference);
      elemBtn.innerHTML = content;
      return elemBtn;
    }

    let elem = document.createElement('div');
    let id = this._containerTableId+"-in";
    elem.setAttribute("id", id);
    elem.classList.add("nv5-widget-table-buttons-in");
    document.getElementById(this._containerTableButtonsId).appendChild(elem);

    let elemBtn = generateButtonElement(id, this._containerElemId, "Grafico", "nv5-btn-active");
    let elemBtn2 = generateButtonElement(id, this._containerTableId, "Tabela");

    document.getElementById(id).appendChild(elemBtn2);
    document.getElementById(id).appendChild(elemBtn);
  }

  appendInformation(message) {
    if (this._withInfo.show) {
      let elemInfo = document.createElement('div');
      elemInfo.setAttribute("id", this._containerInfoId);
      document.getElementById(this._containerId).appendChild(elemInfo);
      document.getElementById(this._containerInfoId).className = "nv5-widget-info";
      let tooltip = this._containerInfoId + "tooltip";
      document.getElementById(this._containerInfoId).innerHTML = "" +
        "<div class=\"nv5-tooltip-elem\" id="+tooltip+">A carregar...</div>" +
        "<div class=\"nv5-tooltip-holder\"><div class=\"nv5-tooltip\" data-nv5-event-type=\"show-element\" data-nv5-element="+tooltip+"><i class=\"fa fa-info-circle\"></i></div></div>";
      this._withInfo.info = message;
      document.getElementById(this._containerInfoId).onmouseover = () => {
        if (!this._withInfo.loaded) {
          this._withInfo.loaded = true;
          this._withInfo.url = message;
          NV5Common.makeRequest({
            url: this._withInfo.url,
            method: 'GET',
          }).then(result => {
            this._withInfo.message = result.data.message;
            document.getElementById(this._containerInfoId).getElementsByClassName("nv5-tooltip-elem")[0].innerHTML = this._withInfo.message;
          }).catch(result => {
            document.getElementById(this._containerInfoId).getElementsByClassName("nv5-tooltip-elem")[0].innerHTML = NV5Common.getMessages('keyError');
            this.dumpError(result);
          });
        }

      };
    }
  }

  listener(e) {
    // TODO: get data from endpoint and pass it to updateData
    let endpointObject = Object.assign({}, this._endpointObject);
    this.hideMessage();
    this.showLoading();
    for (let tupl in endpointObject.parametersToUpdate) {
      try {
        endpointObject.parameters[endpointObject.parametersToUpdate[tupl][0]] = e.detail[endpointObject.parametersToUpdate[tupl][1]];
      }
      catch(err) {
        console.log(NV5Common.getFormatedLogString(err));
      }
    }
    NV5Common.makeRequest(endpointObject).then(result => {
      this.updateData(result);
      this.hideLoading();
    }).catch(result => this.failure(result));
  }

  customHeight(container, height) {
    document.getElementById(container).style.height = height + "px";
  }

  hideLoading() {
    if (this._toolbar !== undefined) {
      this._toolbar.enableToolbar();
    }
    document.getElementById(this._containerLoadingId).style.visibility = "hidden";
  }

  showLoading() {
    if (this._toolbar !== undefined) {
      this._toolbar.disableToolbar();
    }
    document.getElementById(this._containerLoadingId).style.visibility = "visible";
  }

  failure(result) {
    this.hideLoading();
    let message = (result.error !== undefined) ? result.error : result;

    if (result instanceof TypeError || result instanceof ReferenceError) {
      console.log(
        NV5Common.getFormatedLogString(
          "An error occurred in a widget " + this._containerId +". " + result
        )
      );
      message = NV5Common.getMessages('errorWidget')
    }

    this.showMessage(message);
  }

  showMessage(message) {
    document.getElementById(this._containerCustomMessageId).getElementsByTagName('div')[0].innerHTML = message;
    document.getElementById(this._containerCustomMessageId).style.display = "block";
  }

  hideMessage() {
    document.getElementById(this._containerCustomMessageId).style.display = "none";
  }

  executeCustomActions() {
    if(this._actions.length > 0) {
      this._actions.forEach((action) => {
        action.fn.apply(this, action.params);
      });
    }
  }

  errorMappingKeys(container, message) {
    console.log(
      NV5Common.getFormatedLogString(
        "An error occured at " + container +" endpoint element. " + message
      )
    );
  }

  dumpError(message) {
    console.log(
      NV5Common.getFormatedLogString(
        "An error occurred in a event. " + message
      )
    );
  }
}
