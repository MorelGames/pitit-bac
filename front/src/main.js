import Vue from "vue";
import Vuex from "vuex";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faExclamationCircle, faTimes, faHourglassHalf, faAward } from "@fortawesome/free-solid-svg-icons";
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

library.add(faCheck, faExclamationCircle, faTimes, faHourglassHalf, faAward);

Vue.component("vue-fontawesome", FontAwesomeIcon);

const client = new GameClient("ws://127.0.0.1:62868");

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
        time: 400
      },

      current_round: {
        round: 0,
        letter: "",
        ended: false,
        answers: {},
        votes: {},
        interrupted_by: null
      },

      scores: []
    }
  },
  getters: {
    players_count: state => Object.keys(state.players).length,
    players_list: state => Object.values(state.players),
    players_list_sorted: state => Object.values(state.players).sort((a, b) => a.pseudonym.toLowerCase().localeCompare(b.pseudonym.toLowerCase())),
    is_time_infinite: state => state.game.configuration.time == state.game.infinite_duration
  },
  mutations: {
    set_game_state(state, new_state) {
      state.game_state = new_state;
    },

    set_loading(state, loading_message) {
      state.loading = loading_message;
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

    add_player(state, player) {
      Vue.set(state.players, player.uuid, player);
    },

    remove_player(state, uuid) {
      Vue.delete(state.players, uuid);
    },

    set_player_readyness(state, readyness) {
      state.players[readyness.uuid].ready = readyness.ready;
    },

    update_game_configuration(state, config) {
      state.game.configuration = config;
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
      Vue.set(state.game.current_round.votes[vote_update.vote.category][vote_update.vote.uuid].votes, vote_update.voter.uuid, vote_update.vote.vote);
    },

    set_scores(state, scores) {
      state.game.scores = scores;
    },

    reset_state_for_restart(state) {
      state.game.current_round = {};
      state.game.scores = [];
    }
  },
  actions: {
    set_pseudonym_and_connect(context, pseudonym) {
      context.commit("set_pseudonym", pseudonym);

      let connectingSnake = Snackbar.open({
        message: "Connexion à la partie en cours…",
        indefinite: true,
        actionText: null
      });

      context.commit("set_loading", "Connexion à la partie…");

      client
        .connect()
        .then(() => {
          client.join_game().then(() => {
            connectingSnake.close();
            context.commit("set_loading", false);
            context.commit("set_game_state", "CONFIG");
          });
        })
        .catch(error => {
          console.error("Unable to connect to websocket server.", error);

          context.commit("set_loading", false);

          connectingSnake.close();

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
      context.commit("set_game_slug", slug);
      document.location.hash = slug;
    },

    player_join(context, player) {
      context.commit("add_player", player);

      if (player.ourself)
      {
        context.commit("set_master", player.master);
      }

      if (context.state.game_state !== "CONFIG" && !player.ourself)
      {
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

        context.commit("remove_player", uuid);

        Snackbar.open({
          message: `${player.pseudonym} a quitté la partie`,
          queue: false,
          actionText: null
        });
    },

    update_game_configuration(context, configuration) {
      context.commit("update_game_configuration", configuration);
      client.send_config_update();
    },

    ask_start_game() {
      client.ask_start_game();
    },

    reset_all_readyness(context) {
      Object.keys(context.state.players).forEach(uuid => context.commit("set_player_readyness", {uuid: uuid, ready: false}));
    },

    next_round(context, round_config) {
      context.commit("next_round", round_config);
      context.commit("set_game_state", "ROUND_ANSWERS");
      context.dispatch("reset_all_readyness");
    },

    round_finished() {
      client.send_answers();
    },

    end_round_and_send_answers(context) {
      context.commit("round_ended");
      context.commit("set_loading", "Collecte des réponses de tous les joueurs…");

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
      client.send_vote(vote_update.vote.uuid, vote_update.vote.category, vote_update.vote.vote);
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
    }
  }
});

client.set_store(store);

store.dispatch("set_game_slug", document.location.hash.substring(1));

// Updates the slug if the hash is changed, before the connection to the server.
window.onhashchange = function() {
  let hash = document.location.hash.substring(1);
  if (store.state.game.slug != hash && store.state.game_state == "PSEUDONYM") {
    store.dispatch("set_game_slug", hash);
  }
}

new Vue({
  render: h => h(App),
  store: store
}).$mount("#app");
