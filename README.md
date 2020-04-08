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

You can also use the Vue GUI:

```bash
$ make ui
```

If something fail somewhere, first of all, ensure you're running the correct version of NodeJS:

```bash
$ nvm use
```

You may have to install Node 10:

```bash
$ nvm install 10
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
