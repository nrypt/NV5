class Line extends Widget {
  fnx;
  fny;
  _yLabel = ''
  draw(data) {
    this._chart = LineChart.getChart(data, {
      x: this._fnx,
      y: this._fny,
      width: this._width,
      height: this._height,
      yLabel: this._yLabel,
      color: NV5Common.getColor(0)
    });
    super.draw(data);
  }

  init() {
    // get data from WS
    NV5Common.makeRequest(this._endpointObject).then(result => {
      let dt = result.data;
      this._applyOptions();
      this.draw(dt);
      if (result.details?.message !== undefined) {
        this.appendInformation(result.details.message);
      }
      this.endDataRender();
    }).catch(result => this.failure(result));
  }

  _applyOptions () {
    let xKey = this._options?.xAxis?.key ?? 'date';
    let yKey = this._options?.yAxis?.key ?? 'value';
    let isDate = this._options?.xAxis?.date ?? false

    this._yLabel = this._options?.yAxis?.label ?? '';
    this._fnx = d => (typeof isDate === 'boolean' && isDate) ? new Date(d[xKey]) : d[xKey]
    this._fny = d => d[yKey]
  }

  updateData (data) {
    // TODO
  }

  transformDataToTable(data) {
    // TODO
  }

}
