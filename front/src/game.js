export default class GameClient {
  constructor(ws_url) {
    this.ws_url = ws_url;

    this.runtime_server_identifier = null;

    this.client = null;
    this.client_uuid = null;
    this.secret = null;
  }

  set_store(store) {
    this.store = store;
  }

  set_uuid_and_secret(uuid, secret) {
    this.client_uuid = uuid;
    this.secret = secret;
    this.store.commit("set_uuid", uuid);

    this.persist_credentials();
  }

  persist_credentials() {
    // We must use sessionStorage, else the same UUID/secret may be
    // used between two tabs, and the server does not like this at
    // all (the first client kinda no longer exist for the server).
    // Also, this ensure we cannot track the player with its UUID,
    // as the browser will delete this as soon as the tab or the
    // browser is closed.
    sessionStorage.setItem(
      "pb_credentials",
      JSON.stringify({
        uuid: this.client_uuid,
        secret: this.secret
      })
    );
  }

  delete_persisted_credentials() {
    sessionStorage.removeItem("pb_credentials");
  }

  load_persisted_credentials() {
    let credentials = sessionStorage.getItem("pb_credentials") || "";
    try {
      credentials = JSON.parse(credentials);
    } catch {
      return;
    }

    if (!credentials.uuid || !credentials.secret) {
      return;
    }

    this.set_uuid_and_secret(credentials.uuid, credentials.secret);
  }

  connect() {
    this.load_persisted_credentials();

    return new Promise((resolve, reject) => {
      this.client = new WebSocket(this.ws_url, "pb-protocol");

      this.client.onerror = error => {
        console.error("WS initial connection error.");
        reject(error);
      };

      this.client.onopen = () => {
        console.info("WS connection ready.");
        resolve();
      };

      this.client.onclose = () => {
        console.warn("WS connection closed. Trying to reconnect…");
        this.store.dispatch("disconnected_from_socket");
        this.client.close();
        setTimeout(() => this.reconnect(), 2000);
      };

      this.client.onmessage = message => {
        if (typeof message.data !== "string") {
          console.warn(
            "Ignored non-string message received through websocket.",
            message
          );
          return;
        }

        let data = null;

        try {
          data = JSON.parse(message.data);
        } catch (error) {
          console.error(
            "Ignored invalid message received through websocket.",
            message,
            error
          );
          return;
        }

        if (!data.action) {
          console.warn(
            "Ignored malformed message received through websocket (missing action).",
            message
          );
          return;
        }

        this.handle_message(data.action, data);
      };
    });
  }

  reconnect() {
    this.connect().then(() => {
      this.join_game().then(() => {
        this.store.dispatch("reconnect_to_socket");

        // We clear the players, as the server will re-send all login messages
        // for other players.
        this.store.commit("clear_players");
      });
    });
  }

  handle_message(action, message) {
    switch (action) {
      case "set-server-runtime-identifier":
        // If we don't have an identifier stored, we store it. Else,
        // if the identifier is different (during a reconnection), we
        // reload the page. This is used when the game server restarts
        // (and the client stays active), or when we re-use a tab after
        // a long pause and the user expired server-side.
        if (!this.runtime_server_identifier) {
          this.runtime_server_identifier = message.runtime_identifier;
        } else if (
          this.runtime_server_identifier !== message.runtime_identifier
        ) {
          this.store.dispatch("reload_required");
          this.delete_persisted_credentials();
          setTimeout(() => document.location.reload(), 10000);
        }
        break;

      case "set-uuid":
        this.set_uuid_and_secret(message.uuid, message.secret);
        break;

      case "set-slug":
        this.store.dispatch("set_game_slug", message.slug);
        break;

      case "set-master":
        this.store.dispatch("update_master", message.master.uuid);
        break;

      case "player-join": {
        let player = message.player;
        player.ourself = this.client_uuid === player.uuid;

        this.store.dispatch("player_join", player);
        break;
      }

      case "player-left":
        this.store.dispatch("player_left", message.player.uuid);
        break;

      case "set-suggested-categories":
        this.store.commit("set_suggested_categories", message.categories);
        break;

      case "config-updated":
        this.store.commit("update_game_configuration", message.configuration);
        break;

      case "catch-up-game-state":
        this.store.dispatch("catch_up", message);
        break;

      case "player-ready":
        this.store.commit("set_player_readyness", {
          uuid: message.player.uuid,
          ready: true
        });
        break;

      case "round-starts-soon":
        this.store.dispatch("next_round_soon", message.countdown);
        break;

      case "round-started":
        this.store.dispatch("next_round", {
          round: message.round,
          letter: message.letter
        });
        break;

      case "round-ended":
        this.store.dispatch("end_round_and_send_answers");
        break;

      case "vote-started":
        this.store.dispatch("start_vote", {
          answers: message.answers,
          interrupted_by: message.interrupted
        });
        break;

      case "vote-changed":
        this.store.dispatch("update_vote", {
          voter: message.voter,
          vote: message.vote
        });
        break;

      case "game-ended":
        this.store.dispatch("end_game", { scores: message.scores });
        break;

      case "game-restarted":
        this.store.dispatch("restart_game");
    }
  }

  send_message(action, message) {
    return new Promise((resolve, reject) => {
      if (this.client.readyState == this.client.OPEN) {
        message.action = action;
        message.uuid = this.client_uuid;
        message.secret = this.secret;
        message.slug = this.store.state.game.slug;

        this.client.send(JSON.stringify(message));
        resolve();
      } else {
        reject("disconnected");
      }
    });
  }

  join_game() {
    return this.send_message("join-game", {
      pseudonym: this.store.state.pseudonym
    });
  }

  send_config_update() {
    return this.send_message("update-config", {
      configuration: this.store.state.game.configuration
    });
  }

  switch_master(new_master_uuid) {
    return this.send_message("switch-master", {
      master: {
        uuid: new_master_uuid
      }
    })
  }

  ask_start_game() {
    return this.send_message("start-game", {});
  }

  send_answers() {
    return this.send_message("send-answers", {
      answers: this.store.state.game.current_round.answers
    });
  }

  send_vote(author_uuid, category, vote) {
    return this.send_message("send-vote", {
      vote: {
        uuid: author_uuid,
        category: category,
        vote: vote
      }
    });
  }

  send_vote_ready() {
    return this.send_message("vote-ready", {});
  }

  restart_game() {
    return this.send_message("restart", {});
  }
}
