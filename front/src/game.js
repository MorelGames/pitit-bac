import { w3cwebsocket as WebSocketClient } from "websocket";

export default class GameClient {
  constructor(ws_url) {
    this.ws_url = ws_url;

    this.client = null;
    this.client_uuid = null;
    this.secret = null;
  }

  set_store(store) {
    this.store = store;
  }

  connect(slug) {
    return new Promise((resolve, reject) => {
      this.client = new WebSocketClient(
        this.ws_url + "/" + (slug || ""),
        "pb-protocol"
      );

      this.client.onerror = error => {
        console.log("WS initial connection error.", error);
        reject(error);
      };

      this.client.onopen = () => {
        console.info("WS connection ready.");
        resolve();
      };

      this.client.onclose = () => {
        console.info("WS connection closed.");
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

  handle_message(action, message) {
    switch (action) {
      case "set-uuid":
        this.client_uuid = message.uuid;
        this.secret = message.secret;
        this.store.commit("set_uuid", message.uuid);
        break;

      case "set-slug":
        this.store.dispatch("set_game_slug", message.slug);
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

      case "config-updated":
        this.store.commit("update_game_configuration", message.configuration);
        break;

      case "player-ready":
        this.store.commit("set_player_readyness", {uuid: message.player.uuid, ready: true});
        break;

      case "round-started":
        this.store.dispatch("next_round", {round: message.round, letter: message.letter});
        break;

      case "round-ended":
        this.store.dispatch("end_round_and_send_answers");
        break;

      case "vote-started":
        this.store.dispatch("start_vote", {answers: message.answers, interrupted_by: message.interrupted});
        break;

      case "vote-changed":
        this.store.dispatch("update_vote", {voter: message.voter, vote: message.vote});
        break;

      case "game-ended":
        this.store.dispatch("end_game", {scores: message.scores});
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

  ask_start_game() {
    return this.send_message("start-game", {});
  }

  send_answers() {
    return this.send_message("send-answers", {
      "answers": this.store.state.game.current_round.answers
    })
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
