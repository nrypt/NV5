class Table extends Widget {

  /*  instead of init call constructor and call super
      then create the function init which calls WS and initializes the data calling draw()
      this way it's possible to pass data to the widget without using a WS (withou calling init())
   */
  constructor(container, endpointObject, options) {
    super(container, endpointObject, options);

    this._containerElemIdTable = this._containerElemId + "-table";
    this._containerElemIdTableHolder = this._containerElemId + "-table-holder";
    this._containerElemIdTableAll = this._containerElemIdTable + "-all";
    this._containerElemIdTableAllIn = this._containerElemIdTableAll + "-in";
    this._containerElemIdTableAllTable =  this._containerElemIdTableAll + "-table";
    this._transposed = (this._options.table !== undefined && this._options.table.transpose !== undefined && this._options.table.transpose);
    this._hideColumns = (this._options.table !== undefined &&
      this._options.table.hideColumns !== undefined &&
      Array.isArray(this._options.table.hideColumns)) ? this._options.table.hideColumns : [];

    this._limit = (this._options.table !== undefined && this._options.table.limit !== undefined) ?
      this._options.table.limit : undefined;

    let elem = document.createElement('div');
    let elemIn = document.createElement('div');
    let elemHolder = document.createElement('div');
    elem.setAttribute("id", this._containerElemIdTableAll);
    elem.classList.add("nv5-table-over-main");
    elem.classList.add("nv5-table-over-main-closed");
    elemIn.setAttribute("id", this._containerElemIdTableAllIn);
    //elemIn.classList.add("nv5-valign-middle");
    elemIn.classList.add("nv5-table-over-in");
    elemHolder.setAttribute("id", this._containerElemIdTableHolder);
    //elemHolder.classList.add("nv5-valign-middle");
    // document.body.appendChild(elem);
    document.getElementById(this._containerElemId).appendChild(elem);
    document.getElementById(this._containerElemIdTableAll).appendChild(elemIn);
    document.getElementById(this._containerElemId).appendChild(elemHolder);

    return this;
  }

  init() {
    BCommon.makeRequest(this._endpointObject).then(result => {
      this.draw(result.data[0]);
      if (result.details !== undefined && result.details.message !== undefined) {
        this.appendInformation(result.details.message);
      }
      this.endDataRender();
    }).catch(result => this.failure(result));
  }

  draw(data) {
    let table = "<table id=\"" + this._containerElemIdTable + "\" class=\"nv5-table \" cellspacing=\"0\" role=\"grid\" aria-describedby=\"" + this._containerId + "\" >";

    let cols = (this._transposed) ? data.index : data.columns;
    let idx = (this._transposed) ? data.columns : data.index;
    let dt = (this._transposed) ? data.data[0].map((col, i) => data.data.map(row => row[i])) : data.data;
    //let dt = data.data
    let limit = (this._limit !== undefined) ? this._limit : idx.length;

    if(this._keyMapping !== undefined) {
      try {
        let colsAux = [];
        let label = "";
        cols.forEach((key) => {
          label = (this._keyMapping[key] !== undefined) ? this._keyMapping[key].label : key;
          colsAux.push(label);
        });

        cols = colsAux;
      }
      catch(err) {
        this.errorMappingKeys(this._containerId, err.message);
      }
    }

    let header = this._createHeader(cols);
    let body = this._createBody(idx, dt, limit);
    table += header['limited'];
    table += body['limited'];
    table += "</table>";

    document.getElementById(this._containerElemIdTableHolder).innerHTML = table +
      ((this._limit !== undefined) ? "<div class=\"nv5-tooltip-holder\"><a href=\"#\" data-nv5-event-type=\"open-overlay\" data-nv5-parent=\"" + this._containerElemIdTableAll + "\">Ver todos</a></div>" : "");
    this._chart = table;

    if (this._hideColumns.length > 0) {
      this.hideColumns(this._hideColumns);
    }

    if (this._limit !== undefined) {
      let tableAll = "<table id=\"" + this._containerElemIdTableAllTable + "\" class=\"nv5-table nv5-valign-middle-table  \" cellspacing=\"0\" role=\"grid\" aria-describedby=\"" + this._containerId + "\" >";
      tableAll += header['complete'];
      tableAll += body['complete'];
      tableAll += "</table>";
      document.getElementById(this._containerElemIdTableAllIn).innerHTML = "<div class=\"nv5-overlay-close\" data-nv5-event-type=\"close-overlay\" data-nv5-parent=\"" + this._containerElemIdTableAll + "\"></div>" + tableAll;

      // hack table cell width
      this._sheet.insertRule("" +
        "table#" + this._containerElemIdTableAllTable + " thead th > div, \n" +
        "table#" + this._containerElemIdTableAllTable + " tbody td > div {\n" +
        "   width: " + ((document.getElementById(this._containerElemIdTableAllIn).offsetWidth / cols.length)-20) + "px;\n" +
        "}",
        this._sheet.cssRules.length);

      this._sheet.insertRule("" +
        "table#" + this._containerElemIdTableAllTable + " nv5-widget-info {\n" +
        "  padding-top: 5px;" +
        "}",
        this._sheet.cssRules.length);

      this._actions.push({
        'fn': function(id) { document.getElementById(id).style.width = document.getElementById(id).getElementsByTagName('table')[0].offsetWidth + "px"; return; },
        'params': [this._containerElemIdTableAllIn]
      })
    }

    let fn = (extra) => { return function(id, elem) {
      var elm = document.getElementById(id).parentElement;
      var wasNone = false;
      if (elm.style.display === "") {
        wasNone = true;
        elm.style.display = "block";
      }
      document.getElementById(id).style.height = document.getElementById(elem).offsetHeight + extra+ "px";
      if(wasNone) {
        elm.style.display = "";
      }

      return;
    }
    };
    let extra = (this._limit !== undefined) ? 40 : 0;
    extra += (this._withInfo !== undefined && this._withInfo) ? 60 : 0;

    /*
    this._actions.push({
        'fn': fn(extra),
        'params': [this._containerElemId, this._containerElemIdTable]
    });
    this._actions.push({
        'fn': fn(extra),
        'params': [this._containerId, this._containerElemIdTable]
    });
    this._actions.push({
        'fn': fn(extra),
        'params': [this._containerLoadingId, this._containerElemIdTable]
    });
    this._actions.push({
        'fn': fn(extra),
        'params': [this._containerCustomMessageId, this._containerElemIdTable]
    });
    */

  }

  transposeTable(transpose) {
    if(typeof(transpose) === "boolean"){
      this._transposed = transpose;
    }
  }

  updateData (data) {
    super.updateData(data.data[0]);
    this.draw(data.data[0]);
    this.endDataRender();
  }

  hideColumns(columns) {
    let ruletd = "";
    let ruleth = "";

    columns.forEach((c) => {
      ruletd += "#" + this._containerElemIdTable + ` td:nth-child(${c}),`;
      ruleth += "#" + this._containerElemIdTable + ` th:nth-child(${c}),`;
      /*
      if (this._limit !== undefined) {
          ruleth += "#" + this._containerElemIdTableAllTable + ` th:nth-child(${c}),`;
          ruletd += "#" + this._containerElemIdTableAllTable + ` td:nth-child(${c}),`;
      }
      */
      if (this._limit !== undefined) {
        ruletd += "#" + this._containerElemIdTableAllTable + ` th:nth-child(1),`;
        ruletd += "#" + this._containerElemIdTableAllTable + ` td:nth-child(1),`;
      }
    });

    this._sheet.insertRule(ruleth.substring(0, ruleth.length - 1) + " { display: none; }", this._sheet.cssRules.length);
    this._sheet.insertRule(ruletd.substring(0, ruletd.length - 1) + " { display: none; }", this._sheet.cssRules.length);
  }

  _createHeader(header) {
    let htmlTableHeader = "<thead>";
    let htmlTableHeaderAll = "";
    htmlTableHeader += "<tr><th><div>&nbsp;</div></th>";

    Array.from(header).forEach(function(h){
      h = "<th><div>" + h + "</div></th>";
      htmlTableHeader += h;
    });

    htmlTableHeaderAll = htmlTableHeader;
    // htmlTableHeaderAll += "<th></th>";
    htmlTableHeader += "</tr>";
    htmlTableHeader += "</thead>";
    htmlTableHeaderAll += "</tr>";
    htmlTableHeaderAll += "</thead>";

    return  {'limited': htmlTableHeader, 'complete': htmlTableHeaderAll};
  }

  _createBody(index, data, limit) {
    let htmlTableBody = "";
    let htmlTableBodyShowAll = "";
    let currData = "";
    let cols = -1;

    htmlTableBody += "<tbody>";
    htmlTableBodyShowAll += "<tbody>";

    for (let i = 0; i < index.length; i++) {
      if (i < limit) {
        htmlTableBody += "<tr>"
        htmlTableBody += "<td><div>" + index[i] + "</div></td>";
      }

      htmlTableBodyShowAll += "<tr>"
      htmlTableBodyShowAll += "<td><div>" + index[i] + "</div></td>";

      currData = data[i];
      if (cols === -1) {
        cols = currData.length;
      }
      for (let j = 0; j < currData.length; j++) {
        if (i < limit) {
          htmlTableBody += "<td><div>" + currData[j] + "</div></td>";
        }
        htmlTableBodyShowAll += "<td><div>" + currData[j] + "</div></td>";
      }

      // htmlTableBodyShowAll += "<td></td>";

      htmlTableBody += "</tr>";
      htmlTableBodyShowAll += "</tr>";
    }

    htmlTableBody += "</tbody>";
    htmlTableBodyShowAll += "</tbody>";

    return {'limited': htmlTableBody, 'complete': htmlTableBodyShowAll};
  }
}
