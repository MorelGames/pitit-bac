import Vue from "vue";
import Vuex from "vuex";

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
import { SnackbarProgrammatic as Snackbar } from "buefy";
import "buefy/dist/buefy.css";

import GameClient from "./game";
import App from "./App.vue";

Vue.use(Vuex);
Vue.use(Buefy, {
  defaultIconComponent: "vue-fontawesome",
  defaultIconPack: "fas"
});

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
  process.env.VUE_APP_WS_URL.replace("{hostname}", document.location.hostname)
);

const store = new Vuex.Store({
  state: {
    game_state: "PSEUDONYM",
    uuid: null,
    pseudonym: null,
    loading: null,
    master: false,
    players: {},
    game: {
      slug: "",

      // If the duration is set to this value, then the round will only
      // stop when the first ends (if stopOnFirstCompletion) or when
      // all players end (else).
      infinite_duration: 600,

      locked: false,
      lock_loading: false,

      configuration: {
        categories: [
          "Pays",
          "Ville",
          "Prénom masculin",
          "Prénom féminin",
          "Métier",
          "Objet",
          "Animal",
          "Végétal",
          "Couleur"
        ],
        stopOnFirstCompletion: true,
        turns: 4,
        time: 400,
        alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        scores: {
          valid: 10,
          duplicate: 5,
          invalid: 0,
          refused: 0,
          empty: 0
        }
      },

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

      /**
       * If kicked, can be “locked” or “kicked”.
       * Should be null if not kicked.
       */
      kick_reason: null
    },
    search_engine: "https://qwant.com/?q={s}&t=web"
  },
  getters: {
    players_count: state => Object.keys(state.players).length,
    players_list: state => Object.values(state.players),
    players_list_sorted: state =>
      Object.values(state.players).sort((a, b) =>
        a.pseudonym.toLowerCase().localeCompare(b.pseudonym.toLowerCase())
      ),
    online_players_list: state =>
      Object.values(state.players).filter(player => player.online),
    is_time_infinite: state =>
      state.game.configuration.time == state.game.infinite_duration
  },
  mutations: {
    set_game_state(state, new_state) {
      state.game_state = new_state;
    },

    set_loading(state, loading_message) {
      state.loading = loading_message;
    },

    set_kick_reason(state, reason) {
      state.game.kick_reason = reason;
    },

    set_game_slug(state, slug) {
      state.game.slug = slug;
    },

    set_uuid(state, uuid) {
      state.uuid = uuid;
    },

    set_pseudonym(state, pseudonym) {
      state.pseudonym = pseudonym;
    },

    set_master(state, is_master) {
      state.master = is_master;
    },

    set_master_player(state, master_uuid) {
      Object.keys(state.players).forEach(uuid => {
        if (uuid === master_uuid) {
          state.players[uuid].master = true;
        } else {
          state.players[uuid].master = false;
        }
      });
    },

    add_player(state, player) {
      Vue.set(state.players, player.uuid, player);
    },

    remove_player(state, uuid) {
      Vue.delete(state.players, uuid);
    },

    clear_players(state) {
      state.players = {};
    },

    change_player_online_status(state, online_status) {
      state.players[online_status.uuid].online = online_status.online;
    },

    change_player_pseudonym(state, user_pseudonym) {
      state.players[user_pseudonym.uuid].pseudonym = user_pseudonym.pseudonym;
    },

    set_player_readyness(state, readyness) {
      state.players[readyness.uuid].ready = readyness.ready;
    },

    update_game_configuration(state, config) {
      state.game.configuration = config;
    },

    set_game_lock(state, locked) {
      state.game.locked = locked;
    },

    set_game_lock_loading(state, loading) {
      state.game.lock_loading = loading;
    },

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

      Object.values(state.players)
        .filter(player => !player.online)
        .map(player => player.uuid)
        .forEach(uuid => {
          Vue.delete(state.players, uuid);
        });
    }
  },
  actions: {
    set_pseudonym_and_connect(context, pseudonym) {
      context.commit("set_pseudonym", pseudonym);
      context.commit("set_loading", "Connexion à la partie…");

      context.commit("set_kick_reason", null);

      client
        .connect()
        .then(() => {
          client.join_game().then(() => {
            context.commit("set_loading", false);
            context.commit("set_game_state", "CONFIG");
          });
        })
        .catch(error => {
          console.error("Unable to connect to websocket server.", error);

          context.commit("set_loading", false);

          Snackbar.open({
            message: "Impossible de se connecter à la partie.",
            indefinite: true,
            type: "is-danger",
            actionText: "Réessayer",
            onAction: () =>
              store.dispatch("set_pseudonym_and_connect", pseudonym)
          });
        });
    },

    set_game_slug(context, slug) {
      const slug_not_changed = slug === context.state.game.slug;

      // If the player was connected to a different game than asked
      if (context.state.game.slug && !slug_not_changed && context.state.game_state === "CONFIG") {
        Snackbar.open({
          message: `Vous avez demandé à rejoindre une partie, mais celle-ci n'existait pas. Nous en avons créé une nouvelle pour vous.`,
          queue: false,
          actionText: null,
          duration: 5000
        });
      }

      context.commit("set_game_slug", slug);

      if (!slug_not_changed) {
        window.history.pushState(null, '', `/${slug}`);
      }
    },

    player_join(context, player) {
      let state_player = context.state.players[player.uuid];
      if (!state_player) {
        context.commit("add_player", player);

        // The player is always ready, except if we're in the answers
        // part of a round.
        context.commit("set_player_readyness", {
          uuid: player.uuid,
          ready: context.state.game_state !== "ROUND_ANSWERS"
        });
      } else {
        context.commit("change_player_online_status", {
          uuid: player.uuid,
          online: true
        });
        context.commit("change_player_pseudonym", {
          uuid: player.uuid,
          pseudonym: player.pseudonym
        });
      }

      if (player.ourself) {
        context.commit("set_master", player.master);
      }

      if (context.state.game_state !== "CONFIG" && !player.ourself) {
        Snackbar.open({
          message: `${player.pseudonym} a rejoint la partie`,
          queue: false,
          actionText: null
        });
      }
    },

    player_left(context, uuid) {
      let player = context.state.players[uuid];
      if (!player) return; // nothing to do

      if (context.state.game_state === "CONFIG") {
        context.commit("remove_player", uuid);
      } else {
        context.commit("change_player_online_status", {
          uuid: uuid,
          online: false
        });
      }

      Snackbar.open({
        message: `${player.pseudonym} a quitté la partie`,
        queue: false,
        actionText: null
      });
    },

    update_master(context, master_uuid) {
      context.commit("set_master_player", master_uuid);
      context.commit("set_master", context.state.uuid === master_uuid);

      if (context.state.master) {
        Snackbar.open({
          message: `Vous êtes désormais maître de la partie !`,
          queue: false,
          actionText: null
        });
      }
    },

    switch_master(context, new_master_uuid) {
      if (!context.state.master) return;
      client.switch_master(new_master_uuid);
    },

    kick_player(context, player_uuid) {
      if (!context.state.master) return;
      client.kick_player(player_uuid);
    },

    update_game_configuration(context, configuration) {
      context.commit("update_game_configuration", configuration);
      client.send_config_update();
    },

    lock_game(context, locked) {
      if (context.state.master) {
        context.commit("set_game_lock_loading", true);
        client.lock_game(locked);
      }
    },

    ask_start_game() {
      client.ask_start_game();
    },

    set_all_readyness(context, players_uuids_ready) {
      players_uuids_ready.forEach(uuid =>
        context.commit("set_player_readyness", { uuid: uuid, ready: true })
      );
    },

    reset_all_readyness(context) {
      Object.keys(context.state.players).forEach(uuid =>
        context.commit("set_player_readyness", { uuid: uuid, ready: false })
      );
    },

    next_round_soon(context, countdown) {
      let set_countdown = n => {
        context.commit("set_loading", {
          title: n > 0 ? n.toString() : "Début imminent…",
          subtitle:
            "Préparez-vous, le prochain tour démarre dans quelques secondes…"
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

      context.commit("set_loading", false);
      context.commit("next_round", round_config);
      context.commit("set_game_state", "ROUND_ANSWERS");
      context.dispatch("reset_all_readyness");
    },

    round_finished() {
      client.send_answers();
    },

    end_round_and_send_answers(context) {
      context.commit("round_ended");
      context.commit(
        "set_loading",
        "Collecte des réponses de tous les joueurs…"
      );

      client.send_answers();
    },

    start_vote(context, answers) {
      context.commit("set_game_state", "ROUND_VOTES");
      context.commit("set_loading", false);
      context.commit("set_round_votes", answers.answers);
      context.dispatch("reset_all_readyness");

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
      context.commit("set_game_state", "END");
    },

    ask_restart_game() {
      client.restart_game();
    },

    restart_game(context) {
      context.commit("reset_state_for_restart");
      context.commit("set_game_state", "CONFIG");
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

          context.dispatch("set_all_readyness", catch_up.round.players_ready);

          if (catch_up.round.time_left) {
            context.commit("update_time_left", catch_up.round.time_left);
          }
          break;

        case "ROUND_VOTES":
          context.dispatch("start_vote", {
            answers: catch_up.vote.answers,
            interrupted_by: catch_up.vote.interrupted
          });
          context.dispatch("set_all_readyness", catch_up.vote.players_ready);
          break;

        case "END":
          context.dispatch("end_game", {
            scores: catch_up.end.scores
          });
          break;
      }
    },

    disconnected_from_socket(context) {
      if (!context.state.loading) {
        context.commit("set_loading", {
          title: "Reconnexion en cours…",
          subtitle:
            "La connexion a été perdue, mais nous essayons de corriger le problème.<br /> <strong>Si ça ne fonctionne pas au bout d'une dizaine de secondes, essayez d'actualiser la page</strong> — vous ne perdrez pas votre progression dans la partie."
        });
      }
    },

    reconnect_to_socket(context) {
      context.commit("set_loading", false);
    },

    reload_required(context) {
      context.commit("set_loading", {
        title: "Connexion à la partie perdue.",
        subtitle:
          "<strong>Veuillez actualiser la page pour continuer.</strong><br />Le serveur de jeu a été redémarré, ou bien vous êtes resté inactif⋅ve (beaucoup) trop longtemps. Sans action de votre part, la page s'actualisera automatiquement sous dix secondes."
      });
    }
  }
});

client.set_store(store);

// We read the slug from the URL, if it exists.
const url_slug = window.location.pathname.slice(1).split('/')[0];
if (url_slug) {
  store.dispatch("set_game_slug", url_slug)
}

new Vue({
  render: h => h(App),
  store: store
}).$mount("#app");
