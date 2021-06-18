# P'tit bac

This software is a VueJS + websockets implementation of a multiplayer “Petit Bac” game (also “Jeu du Baccalauréat”), sometimes translated as _Tutti Frutti_ or _Stadt Land Fluss_, and close to Hasbro's _Scattergories™_.

It uses VueJS and Buefy for the (static) front-end, and a Node websocket server for the backend. The software is currently only available in French and for Latin alphabets, but this may evolve.

No account required: go to [the homepage, **bac.carrade.eu**](https://bac.carrade.eu), enter your pseudonym, and play!


## Project folders

### `commons`

Contains shared and tested code for the backend and the frontend, things like answers check and votes calculations.

### `back`

Contains the backend websocket server, handling games logic and synchronization.

### `front`

Contains the JS frontend the users use to play the game.


## Development installation

First, install all dependencies:

```bash
$ make install
```

Then on one terminal, start the backend server:

```bash
$ make start-back
```

And on another, start the front build development watchdog:

```bash
$ make watch-front
```

You can also start both at the same time, but you'll have to restart both if you work on the server:

```bash
$ make start
```

…or the Vue GUI:

```bash
$ make ui
```

If something fail somewhere, first, ensure you're running the correct version of NodeJS:

```bash
$ nvm use
```

You may have to install Node 16:

```bash
$ nvm install 16
```

To lint the front-end code, use:

```bash
$ make lint-front
```


## Production deployment

Same as for the development, install all dependencies:

```bash
$ make install
```

Same as above, you may have to install Node 10 before:

```bash
$ nvm install 10
```

Then build the front-end for production:

```bash
$ make build-front
```

This will put all the files onto the `dist` folder. This folder should be served by nginx or another.

Use `systemd` or another dæmon system to run the backend server—see the service file for systemd in the `production` folder. You can customize the internal port used by the WS server using the `PITIT_BAC_WS_PORT` environment variable.

A nginx configuration file is provided to serve the front and proxy the websocket requests to the backend, also in the `production` folder.

To update, re-build the front and restart the systemd service.

### Munin

Some metrics are exposed under `/munin/running_games` and `/munin/all_games`. Check out the README of the [munin-http](munin/README.md) module for documentation on how to install these into a Munin node.


## References

To generate [filtered alphabets](front/data/alphabets.json) with frequent letters only, we used [a dataset containing words from the English Wiktionary and their languages](https://zenodo.org/record/1286991) built by Tiago Tresoldi.

> Tiago Tresoldi, "Extracting translation data from the Wiktionary project," in _Computer-Assisted Language Comparison in Practice_, 11/06/2018, https://calc.hypotheses.org/?p=32.
