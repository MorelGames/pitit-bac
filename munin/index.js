/**
 * This classes plugs into a http server and respond to Munin requests with
 * configured data.
 */
exports.Munin = class Munin {

  /**
   * Creates a new Munin source.
   *
   * @param {http.Server} http_server The HTTP server this class will plug into.
   * @param {string} base_path The base path for Munin request. E.g. if the base
   *                           path is `/munin`, a `sample_data` source will be
   *                           exposed to `/munin/sample_data`.
   */
  constructor(http_server, base_path) {
    this.http_server = http_server;
    this.base_path = "/" + (Munin._trim_slashes(base_path) || "munin");
    this.sources = {};

    this._setup_http_server();
  }

  static _trim_slashes(str) {
    return str.replace(/^\/+|\/+$/g, "");
  }

  _setup_http_server() {
    this.http_server.on('request', (request, response) => {
      if (!request.method === "GET" || !request.url.startsWith(this.base_path)) return;

      let url = new URL(request.url, `https://${request.headers.host}`);
      let source_name = Munin._trim_slashes(url.pathname.substring(this.base_path.length))
      let source = this.sources[source_name];

      if (!source_name || !source) {
        response.writeHead(404);
        response.end();
        return;
      }

      response.setHeader("Content-Type", "text/plain");
      response.writeHead(200);

      if (url.searchParams.has("autoconfig")) {
        response.end("yes");
      }

      else if (url.searchParams.has("config")) {
        if (source.config) {
          Object.keys(source.config).forEach(config_key => {
            response.write(`${config_key} ${source.config[config_key]}\n`);
          });
        }
        Object.keys(source.data).forEach(data_name => {
          Object.keys(source.data[data_name]).filter(data_meta => data_meta !== "value").forEach(data_meta => {
            response.write(`${data_name}.${data_meta} ${source.data[data_name][data_meta]}\n`);
          });

          if (!source.data[data_name].label) {
            response.write(`${data_name}.label ${data_name}\n`);
          }
        });
        response.end();
      }

      else {
        Object.keys(source.data).forEach(data_name => {
          let value_exec = typeof source.data[data_name] === "function" ? source.data[data_name] : source.data[data_name].value;

          if (!value_exec || typeof value_exec !== "function") return;

          response.write(`${data_name} ${value_exec()}\n`);
        });
        response.end();
      }
    });
  }

  /**
   * Adds a new data source for Munin.
   *
   * The source format is as follow:
   * ```
   * {
   *   "config": {
   *     "graph_title": "Your graph's title",
   *     "graph_tvlabel": "Your graph's vertical label",
   *     "graph_tinfo": "General information on what the graph shows",
   *     "graph_tcategory": "Name of the graph's category",
   *     "update_rate": 60
   *   },
   *   "data": {
   *     "name": {
   *       "label": "This piece of data's label",
   *       "warning": 600,
   *       "critical": 1000,
   *       "data": () => get_data_value()
   *     }
   *   }
   * }
   * ```
   *
   * The reference for each `config` and `data.xxx` field is here:
   * http://guide.munin-monitoring.org/en/latest/reference/plugin.html
   *
   * For the `config` object, the corresponding attributes are the
   * “Global attributes”.
   * For the `data.xxx` object, the corresponding attributes are the
   * “Data source attributes”, without their `{fieldname}.` prefix.
   *
   * `config` and `data.xxx.label` are optional. If you don't want to provide
   * a label, you can also configure this module like this—the label exposed to
   * Munin will be the key (here, resp. `name` and `other_name`).
   * ```
   * {
   *   "data": {
   *     "name": () => get_data_value(),
   *     "other_name": () => get_other_data_value()
   *   }
   * }
   * ```
   *
   * @param {string} name The name of the data source. This should be a
   *                      valid URL part, as it will be exposed to
   *                      `/base_path/{name}`.
   * @param {object} source The data source, as described above.
   */
  add_source(name, source) {
    this.sources[name] = source;
  }
};
