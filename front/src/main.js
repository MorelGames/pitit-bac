import Vue from "vue";
import Vuex from "vuex";

import { MorelStore, MorelVue, MorelI18n } from "morel-games-core";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCheck,
  faExclamationCircle,
  faLockOpen,
  faLock,
  faChevronRight,
  faCaretUp,
  faCaretDown,
  faTimes,
  faHourglassHalf,
  faUserAltSlash,
  faUserShield,
  faClipboard,
  faAward
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import Buefy from "buefy";
import "buefy/dist/buefy.css";

import GameClient from "./game";
import App from "./App.vue";

Vue.use(Vuex);
Vue.use(Buefy, {
  defaultIconComponent: "vue-fontawesome",
  defaultIconPack: "fas"
});
Vue.use(MorelVue);

Vue.config.productionTip = false;

library.add(
  faCheck,
  faExclamationCircle,
  faLockOpen,
  faLock,
  faChevronRight,
  faCaretUp,
  faCaretDown,
  faTimes,
  faHourglassHalf,
  faUserAltSlash,
  faUserShield,
  faClipboard,
  faAward
);

Vue.component("vue-fontawesome", FontAwesomeIcon);

const client = new GameClient(
  process.env.VUE_APP_WS_URL.replace("{hostname}", document.location.hostname),
  "pb-protocol"
);

const i18n = new MorelI18n(
  locale =>
    import(
      /* webpackChunkName: "locales-[request]" */ "./../locales/" +
        locale +
        ".json"
    ),
  {
    en: "English",
    fr: "Français"
  }
);

const t = i18n.i18n.t.bind(i18n.i18n);

const store = new Vuex.Store({
  modules: {
    morel: MorelStore(client, i18n)
  },
  state: {
    game: {
      current_round: {
        round: 0,
        letter: "",
        time_left: -1,
        ended: false,
        answers: {},
        votes: {},
        interrupted_by: null,
        countdown_task: null
      },

      scores: [],

      // If the duration is set to this value, then the round will only
      // stop when the first ends (if stopOnFirstCompletion) or when
      // all players end (else).
      infinite_duration: 600
    },
    search_engine: "https://qwant.com/?q={s}&t=web"
  },
  getters: {
    is_time_infinite: state =>
      state.morel.configuration.time == state.game.infinite_duration
  },
  mutations: {
    set_countdown_task(state, task) {
      state.game.current_round.countdown_task = task;
    },

    next_round(state, round_config) {
      state.game.current_round.round = round_config.round;
      state.game.current_round.letter = round_config.letter;
      state.game.current_round.ended = false;
      state.game.current_round.answers = {};
      state.game.current_round.votes = {};
      state.game.current_round.interrupted_by = null;
    },

    update_round_answers(state, answers) {
      state.game.current_round.answers = answers;
    },

    update_time_left(state, time_left) {
      state.game.current_round.time_left = time_left;
    },

    round_ended(state) {
      state.game.current_round.ended = true;
    },

    set_interrupted_by(state, interrupted_by) {
      state.game.current_round.interrupted_by = interrupted_by;
    },

    set_round_votes(state, votes) {
      state.game.current_round.votes = votes;
    },

    set_round_vote(state, vote_update) {
      Vue.set(
        state.game.current_round.votes[vote_update.vote.category][
          vote_update.vote.uuid
        ].votes,
        vote_update.voter.uuid,
        vote_update.vote.vote
      );
    },

    set_scores(state, scores) {
      state.game.scores = scores;
    },

    /**
     * Resets the game-specific state before restart, and
     * removes logged-out players completly.
     */
    reset_state_for_restart(state) {
      state.game.current_round = {
        round: 0,
        letter: "",
        time_left: -1,
        ended: false,
        answers: {},
        votes: {},
        interrupted_by: null,
        countdown_task: null
      };

      state.game.scores = [];
    }
  },
  actions: {
    ask_start_game() {
      client.ask_start_game();
    },

    next_round_soon(context, countdown) {
      let set_countdown = n => {
        context.commit("morel/set_loading", {
          title: n > 0 ? n.toString() : t("Starting soon…"),
          description: t(
            "Brace yourself, the next round starts in a few seconds…"
          )
        });
      };

      set_countdown(countdown);

      let task = setInterval(() => {
        set_countdown(--countdown);

        if (countdown <= 0) {
          clearTimeout(task);
          context.commit("set_countdown_task", null);
        }
      }, 1000);

      context.commit("set_countdown_task", task);
    },

    next_round(context, round_config) {
      if (context.state.game.current_round.countdown_task) {
        clearTimeout(context.state.game.current_round.countdown_task);
        context.commit("set_countdown_task", null);
      }

      context.commit("morel/set_loading", false);
      context.commit("next_round", round_config);
      context.commit("morel/set_phase", "ROUND_ANSWERS");
      context.dispatch("morel/reset_all_readyness");
    },

    round_finished() {
      client.send_answers();
    },

    end_round_and_send_answers(context) {
      context.commit("round_ended");
      context.commit(
        "morel/set_loading",
        t("Collecting answers from all players…")
      );

      client.send_answers();
    },

    start_vote(context, answers) {
      context.commit("morel/set_phase", "ROUND_VOTES");
      context.commit("morel/set_loading", false);
      context.commit("set_round_votes", answers.answers);
      context.dispatch("morel/reset_all_readyness");

      if (answers.interrupted_by) {
        context.commit("set_interrupted_by", answers.interrupted_by);
      }
    },

    send_vote_update(context, vote_update) {
      context.commit("set_round_vote", vote_update);
      client.send_vote(
        vote_update.vote.uuid,
        vote_update.vote.category,
        vote_update.vote.vote
      );
    },

    update_vote(context, vote_update) {
      context.commit("set_round_vote", vote_update);
    },

    vote_ready() {
      client.send_vote_ready();
    },

    end_game(context, scores) {
      context.commit("set_scores", scores.scores);
      context.commit("morel/set_phase", "END");
    },

    ask_restart_game() {
      client.restart_game();
    },

    restart_game(context) {
      context.commit("reset_state_for_restart");
      context.commit("morel/clear_offline_players");
      context.commit("morel/set_phase", "CONFIG");

      sessionStorage.removeItem("pb-round-answers");
    },

    catch_up(context, catch_up) {
      switch (catch_up.state) {
        case "ROUND_ANSWERS_COUNTDOWN":
          context.dispatch("next_round_soon", catch_up.countdown);
          break;

        case "ROUND_ANSWERS":
          context.dispatch("next_round", {
            round: catch_up.round.round,
            letter: catch_up.round.letter
          });

          context.dispatch(
            "morel/set_all_readyness",
            catch_up.round.players_ready
          );

          if (catch_up.round.time_left) {
            context.commit("update_time_left", catch_up.round.time_left);
          }
          break;

        case "ROUND_VOTES":
          context.dispatch("start_vote", {
            answers: catch_up.vote.answers,
            interrupted_by: catch_up.vote.interrupted
          });
          context.dispatch(
            "morel/set_all_readyness",
            catch_up.vote.players_ready
          );
          break;

        case "END":
          context.dispatch("end_game", {
            scores: catch_up.end.scores
          });
          break;
      }
    }
  }
});

client.set_store(store);
i18n.set_store(store);

i18n.load_locale_from_browser();

store.commit("morel/update_configuration", {
  categories: [],
  stopOnFirstCompletion: true,
  turns: 4,
  time: 400,
  alphabet: "",
  scores: {
    valid: 10,
    duplicate: 5,
    invalid: 0,
    refused: 0,
    empty: 0
  }
});

// We read the slug from the URL, if it exists.
const url_slug = window.location.pathname.slice(1).split("/")[0];
if (url_slug) {
  store.dispatch("morel/set_slug", url_slug);
}

new Vue({
  render: h => h(App),
  store: store,
  i18n: i18n.i18n
}).$mount("#app");
