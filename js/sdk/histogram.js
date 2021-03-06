class Histogram extends Widget {
  draw(data) {
    this._chart = HistogramChart.getChart(data, {
      width: this._width,
      height: this._height,
      color: NV5Common.getColor(0)
    }); //, domain: [-10, 10]})
    super.draw(data);
  }

  init() {
    // get data from WS
    NV5Common.makeRequest(this._endpointObject).then(result => {
      let dt = this._transformLabels(result.data);
      this.draw(dt);
      if (result.details?.message !== undefined) {
        this.appendInformation(result.details.message);
      }
      this.endDataRender();
    }).catch(result => this.failure(result));
  }

  updateData (data) {
    // TODO
  }

  _transformLabels(data) {
    if(this._keyMapping !== undefined) {

      try {
        let dt = {};
        Object.keys(this._keyMapping).forEach((key) => {
          dt[this._keyMapping[key].label] = data[key]
        });

        return dt
      }
      catch(err) {
        this.errorMappingKeys(this._containerId, err.message);
        return data
      }

    }
    return data
  }

  transformDataToTable(data) {
    // TODO
  }

}

