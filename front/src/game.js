import { MorelClient } from "morel-games-core";

export default class GameClient extends MorelClient {
  message_in_categories_by_everyone({ enabled }) {
    this.store.dispatch("set_categories_by_everyone", {
      enabled,
      from_server: true
    });
  }

  message_in_catch_up_game_state(message) {
    this.store.dispatch("catch_up", message);
  }

  message_in_round_starts_soon({ countdown }) {
    this.store.dispatch("next_round_soon", countdown);
  }

  message_in_round_started({ round, letter }) {
    this.store.dispatch("next_round", { round, letter });
  }

  message_in_round_ended() {
    this.store.dispatch("end_round_and_send_answers");
  }

  message_in_vote_started({ answers, interrupted }) {
    this.store.dispatch("start_vote", {
      answers: answers,
      interrupted_by: interrupted
    });
  }

  message_in_vote_changed({ voter, vote }) {
    this.store.dispatch("update_vote", { voter, vote });
  }

  message_in_game_ended({ scores }) {
    this.store.dispatch("end_game", { scores });
  }

  message_in_game_restarted() {
    this.store.dispatch("restart_game");
  }

  set_categories_by_everyone(categories_by_everyone) {
    return this.send_message("change-categories-by-everyone", {
      enabled: categories_by_everyone
    });
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

  // TODO move to core
  send_vote_ready() {
    return this.send_message("vote-ready", {});
  }

  restart_game() {
    return this.send_message("restart", {});
  }
}
