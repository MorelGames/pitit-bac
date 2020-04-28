<template>
  <section class="columns game-answers">
    <div class="column is-9 answers-column">
      <b-notification :active="true" :closable="false">
        Remplissez toutes les catégories par des mots ou expressions commençant
        par la lettre <strong>{{ letter }}</strong
        >, puis validez avec le bouton à droite.
        <span v-if="stop_on_first_completion"
          >Le premier joueur qui valide interrompt tous les autres !</span
        >
      </b-notification>
      <div class="answers-form">
        <b-field
          v-for="(category, i) in categories"
          :key="i"
          :label="category"
          :type="!is_category_valid(category) ? 'is-danger' : ''"
          :message="
            !is_category_valid(category)
              ? 'Vous devez entrer un mot ou une expression commençant par la lettre ' +
                letter +
                '.'
              : ''
          "
        >
          <b-input
            :placeholder="letter + '…'"
            size="is-medium"
            :autofocus="i == 0"
            v-model="answers[category]"
            @input="answers_updated"
            :disabled="end_signal_received"
          ></b-input>
        </b-field>
      </div>
    </div>
    <div class="column is-3 time-and-button-column">
      <div class="box inner-time-and-button">
        <h3>{{ round_label }}</h3>
        <CircularProgress
          :value="percent_time"
          :label="letter"
        ></CircularProgress>
        <div class="field">
          <b-tooltip
            :multilined="!we_finished"
            :label="we_finished
                ? 'Attendez les autres…'
                : (!all_fields_completed
                    ? 'Remplissez correctement toutes les catégories avant de valider vos résultats'
                    : 'Cliquez ici pour envoyer vos résultats' +
                      (stop_on_first_completion
                        ? ' et interrompre les autres joueurs.'
                        : ' et indiquer aux autres joueurs que vous avez fini. Vous pourrez toujours les modifier avant la fin du temps imparti, ou tant que tout le monde n\'a pas fini.'))
            "
            type="is-dark"
            position="is-bottom"
          >
            <b-button
              type="is-primary is-medium"
              expanded
              :disabled="we_finished || end_signal_received || !all_fields_completed"
              @click.once="round_finished"
              >
                <template v-if="!we_finished">J'ai terminé !</template>
                <template v-else>Patientez…</template>
              </b-button
            >
          </b-tooltip>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { is_answer_valid } from "ptitbac-commons";
import { mapState, mapGetters } from "vuex";

import CircularProgress from "./CircularProgress.vue";

export default {
  data: function() {
    return {
      interval_id: null,
      answers: {},
      we_finished: false
    };
  },
  computed: {
    ...mapState({
      slug: state => state.game.slug,
      current_round: state => state.game.current_round,
      total_rounds: state => state.game.configuration.turns,
      stop_on_first_completion: state =>
        state.game.configuration.stopOnFirstCompletion,
      categories: state => state.game.configuration.categories,
      letter: state => state.game.current_round.letter,
      total_time: state => state.game.configuration.time,
      time_left: state => state.game.current_round.time_left,
      end_signal_received: state => state.game.current_round.ended
    }),

    ...mapGetters(["is_time_infinite"]),

    percent_time() {
      return this.is_time_infinite
        ? 100
        : 100 - Math.floor((this.time_left / this.total_time) * 100);
    },

    round_label() {
      let cardinal = "";
      switch (this.current_round.round) {
        case 1:
          cardinal = "Premier";
          break;
        case 2:
          cardinal = "Second";
          break;
        case 3:
          cardinal = "Troisième";
          break;
        case 4:
          cardinal = "Quatrième";
          break;
        case 5:
          cardinal = "Cinquième";
          break;
        case 6:
          cardinal = "Sixième";
          break;
        case 7:
          cardinal = "Septième";
          break;
        case 8:
          cardinal = "Huitième";
          break;
        case 9:
          cardinal = "Neuvième";
          break;
        case 10:
          cardinal = "Dixième";
          break;
        case 11:
          cardinal = "Onzième";
          break;
        case 12:
          cardinal = "Douzième";
          break;
        case 13:
          cardinal = "Treizième";
          break;
        case 14:
          cardinal = "Quatorzième";
          break;
        case 15:
          cardinal = "Quinzième";
          break;
        case 16:
          cardinal = "Seizième";
          break;
        case 17:
          cardinal = "Dix-septième";
          break;
        case 18:
          cardinal = "Dix-huitième";
          break;
        case 19:
          cardinal = "Dix-neuvième";
          break;
        case 20:
          cardinal = "Vingtième";
          break;
        default:
          cardinal = `${this.current_round.round}ème`;
      }

      return cardinal + " tour";
    },
    valid_answers() {
      return Object.values(this.answers).filter(answer =>
        is_answer_valid(this.letter, answer)
      );
    },
    all_fields_completed() {
      return this.valid_answers.length == this.categories.length;
    }
  },
  mounted() {
    // We check if we have answers stored into the session for this game/round.
    try {
      let stored_answers = JSON.parse(
        sessionStorage.getItem("pb_round_answers") || ""
      );

      // If the data is fresh and match the current game/round (TODO match with categories or round starting time?)
      if (
        stored_answers.game === this.slug &&
        stored_answers.letter === this.letter &&
        (new Date().getTime() - stored_answers.time) / 1000 < 600
      ) {
        this.answers = stored_answers.answers;
        this.$store.commit("update_round_answers", this.answers);
      }
    } catch {} // eslint-disable-line no-empty

    if (!this.is_time_infinite) {
      // If the time left is not -1, it was updated by the catch up message and
      // we should keep it.
      if (this.time_left === -1) {
        this.$store.commit("update_time_left", this.total_time);
      }

      this.interval_id = setInterval(() => {
        this.$store.commit("update_time_left", this.time_left - 1);
        if (this.time_left == 0) {
          clearInterval(this.interval_id);
          this.$store.commit("update_time_left", -1);
        }
      }, 1000);
    }
  },
  beforeDestroy() {
    clearInterval(this.interval_id);
    this.$store.commit("update_time_left", -1);
  },
  methods: {
    answers_updated() {
      this.$store.commit("update_round_answers", this.answers);

      // We store the answers into the session storage, to be able to restore
      // them in case of a reload.
      sessionStorage.setItem(
        "pb_round_answers",
        JSON.stringify({
          game: this.slug,
          round: this.current_round.round,
          letter: this.letter,
          time: new Date().getTime(),
          answers: this.answers
        })
      );
    },
    round_finished() {
      this.we_finished = true;
      this.answers_updated();
      this.$store.dispatch("round_finished");
    },
    is_category_valid(category) {
      let answer = this.answers[category];

      // We don't want to display an error message if the category is not filled
      // yet.
      if (!answer) return true;
      return is_answer_valid(this.letter, answer);
    }
  },
  components: {
    CircularProgress
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/mixins"

.answers-column
  .field
    &:not(:first-child)
      margin-top: 1.4em
    .label
      text-align: left

  .answers-form
    +mobile
      margin: 0 1rem

.column.time-and-button-column
  display: flex
  flex-direction: column
  align-items: center

  .inner-time-and-button
    display: flex
    flex-direction: column
    align-items: center

    position: fixed

    +mobile
      position: unset
      width: 90%

    h3
      font-size: 1.1em
      font-variant: all-small-caps
      letter-spacing: .1em

    .circular-progress
      margin-top: 1.8rem
      margin-bottom: 2rem

    .field
      width: 100%

      button
        cursor: pointer
</style>
