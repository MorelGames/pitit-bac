<template>
  <section class="columns game-answers">
    <div class="column is-9 answers-column">
      <b-notification :active="true" :closable="false">
        <i18n
          path="Fill all categories with words or phrases beginning with the letter {letter}, then submit your answers using the finish button."
        >
          <strong slot="letter">{{ letter }}</strong>
        </i18n>
        <span v-if="stop_on_first_completion">
          {{ $t("The first player to finish interrupts all the others!") }}
        </span>
      </b-notification>
      <div class="answers-form">
        <b-field
          v-for="(category, i) in categories"
          :key="i"
          :label="category"
          :type="!is_category_valid(category) ? 'is-danger' : ''"
          :message="
            !is_category_valid(category)
              ? $t(
                  'You must enter a word or phrase beginning with the letter {letter}.',
                  { letter }
                )
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
            :label="finish_button_label"
            type="is-dark"
            position="is-bottom"
          >
            <b-button
              type="is-primary is-medium"
              expanded
              :disabled="
                we_finished || end_signal_received || !all_fields_completed
              "
              @click.once="round_finished"
            >
              <template v-if="!we_finished">{{ $t("I finished!") }}</template>
              <template v-else>{{ $t("Please wait…") }}</template>
            </b-button>
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
      slug: state => state.morel.slug,
      current_round: state => state.game.current_round,
      total_rounds: state => state.morel.configuration.turns,
      stop_on_first_completion: state =>
        state.morel.configuration.stopOnFirstCompletion,
      categories: state => state.morel.configuration.categories,
      letter: state => state.game.current_round.letter,
      total_time: state => state.morel.configuration.time,
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
      const $t = this.$t.bind(this);

      switch (this.current_round.round) {
        case 1:
          return $t("First round");
        case 2:
          return $t("Second round");
        case 3:
          return $t("Third round");
        case 4:
          return $t("Fourth round");
        case 5:
          return $t("Fifth round");
        case 6:
          return $t("Sixth round");
        case 7:
          return $t("Seventh round");
        case 8:
          return $t("Eighth round");
        case 9:
          return $t("Ninth round");
        case 10:
          return $t("Tenth round");
        case 11:
          return $t("Eleventh round");
        case 12:
          return $t("Twelfth round");
        case 13:
          return $t("Thirteenth round");
        case 14:
          return $t("Fourteenth round");
        case 15:
          return $t("Fifteenth round");
        case 16:
          return $t("Sixteenth round");
        case 17:
          return $t("Seventeenth round");
        case 18:
          return $t("Eighteenth round");
        case 19:
          return $t("Nineteenth round");
        case 20:
          return $t("Twentieth round");
        case 21:
          return $t("Twenty-first round");
        default:
          return $t("{n}th round", { n: this.current_round.round });
      }
    },
    finish_button_label() {
      const $t = this.$t.bind(this);

      if (this.we_finished) {
        return $t("Wait for the others…");
      } else if (!this.all_fields_completed) {
        return $t("Fill in all categories correctly before submitting");
      } else if (this.stop_on_first_completion) {
        return $t(
          "Click here to submit your answers and interrupt all other players!"
        );
      } else {
        return $t(
          "Click here to submit your answers, and let other players know you're done. You'll still be able to change your answers before the time's up, or as long as not everyone finished."
        );
      }
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
        sessionStorage.getItem("pb-round-answers") || ""
      );

      // If the data is fresh and match the current game/round (TODO match with categories or round starting time?)
      if (
        stored_answers.game === this.slug &&
        stored_answers.letter === this.letter &&
        stored_answers.round === this.current_round.round &&
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
        "pb-round-answers",
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
