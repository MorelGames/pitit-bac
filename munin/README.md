# `munin-http`

A NodeJS module to expose data to Munin.

## Usage

### In NodeJS

In your application, `munin-http` hooks into a `http.Server` instance, listening to requests and answering those under its base path. If you have a http server:

```js
import { Munin } from "munin-http";
// or const Munin = require("munin-http").Munin;

let munin = new Munin(http_server, "/munin");
```

Then to add a data source, call the `add_source` method:

```js
munin.add_source("data_source_name", {
  "config": {
    "graph_title": "My Data Source",
    "graph_info": "A small description of my data source",
    "graph_vlabel": "The Unit",
    "graph_category": "data_source_category"
  },
  "data": {
    "some_data": {
      "label": "Some Data",
      "warning": 400,
      "critical": 1000,
      "value": () => compute_some_data()
    },
    "some_other_data": {
      "label": "Some Other Data",
      "warning": 100,
      "critical": "104:108",
      "value": () => compute_some_data()
    }
  }
});
```

That's it! Your server now exposes the metrics to `/munin/data_source_name`, with config in `/munin/data_source_name?config`. If you add multiple sources, they would have their own URL too.

The values in `config` are [documented in the “Global attributes” section of this page of the Munin's documentation](http://guide.munin-monitoring.org/en/latest/reference/plugin.html#global-attributes). These in `data.xxx` are [documented on the same page, but under “Data source attributes”](http://guide.munin-monitoring.org/en/latest/reference/plugin.html#data-source-attributes). For these, you should not include the `{fieldname}.` part—as above.

If you don't want any configuration, you can also directly set a function returning the data. The function's name will be used as label.

```js
munin.add_source("other_data_source_name", {
  "config": {
    "graph_title": "My Other Data Source",
    "graph_info": "A small description of my other data source",
    "graph_category": "data_source_category"
  },
  "data": {
    "some_data": () => compute_some_data()
    "some_other_data": () => compute_some_data()
  }
});
```

### In Munin

A Munin plugin is provided to handle this data, in the `plugin` folder. Python 3.6 or later must be installed on the server and accessible under `/usr/bin/python3` (PR welcome if you want a pure-Node version; the plugin code is really simple). To install it, copy the plugin to Munin's plugins directory:

```console
# cp plugin/node_http.py /usr/share/munin/plugins/
```

(You may want to check the folder is the same on your Munin installation.)

Then, for each metric you want to monitor, symlink it to `/etc/munin/plugins` with an appropriate name. As example, with the two metrics above:

```console
# ln -s /usr/share/munin/plugins/node_http.py /etc/munin/plugins/yourapp_data_source_name
# ln -s /usr/share/munin/plugins/node_http.py /etc/munin/plugins/yourapp_other_data_source_name
```

Then, you need to configure each of these metrics in `/etc/munin/plugin-conf.d/munin-node` (create the file if it does not exist). For each of them, configure the URL where the metric is exposed like so. You can also configure the category, but that's useless if you configured it in NodeJS (your choice!).

```ini
[yourapp_data_source_name]
env.url http://example.com/munin/data_source_name
env.graph_category yourapp

[yourapp_other_data_source_name]
env.url http://example.com/munin/other_data_source_name
env.graph_category yourapp
```

If your HTTP server requires Basic Authentication, you can add the login and password as parameter:

```ini
[yourapp_data_source_name]
env.url http://example.com/munin/data_source_name
env.graph_category yourapp
env.login your_login
env.password your_password
```

Now, restart your Munin node; it should start collecting and graphing these metrics!


## Thanks

Special thanks to the authors and contributors to [django-munin](https://github.com/ccnmtl/django-munin), for inspiration and base for the Munin plugin.
