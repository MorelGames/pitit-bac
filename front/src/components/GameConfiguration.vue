<template>
  <div class="game-configuration">
    <b-message
      :title="master ? $t('Configure the game') : $t('Game configuration')"
      :closable="false"
      type="is-primary"
    >
      <section>
        <div class="columns">
          <div class="column is-half is-column-with-start-button">
            <b-field
              :label="$t('Categories')"
              :message="
                master
                  ? $t(
                      'Write down the category you want, and press enter to add it.'
                    )
                  : ''
              "
            >
              <template slot="label">
                <div class="columns is-mobile">
                  <div class="column is-8">
                    {{ $t("Categories") }}
                  </div>
                  <div class="column is-4 suggestions-link">
                    <a
                      href="#"
                      class="suggestions-link-trigger"
                      @click.prevent="toggle_suggestions_modale()"
                      >{{ $t("Suggestions") }}</a
                    >
                  </div>
                </div>
              </template>
              <b-taginput
                v-model="config.categories"
                :data="filtered_suggestions"
                autocomplete
                allow-new
                :confirm-key-codes="[13, 9]"
                @input="update_game_configuration"
                @typing="update_suggestions"
                :placeholder="$t('Add a category…')"
                :disabled="!master"
                type="is-primary-dark"
              >
              </b-taginput>
            </b-field>
            <div class="field start-button is-desktop">
              <b-tooltip
                multilined
                position="is-bottom"
                :label="start_button_tooltip"
              >
                <b-button
                  type="is-primary is-medium"
                  expanded
                  :disabled="!master || !can_start"
                  @click="start_game"
                  >{{ $t("Start the game") }}</b-button
                ></b-tooltip
              >
            </div>
          </div>
          <div class="column is-half">
            <b-field
              :label="$t('Rounds: {rounds}', { rounds: config.turns })"
              class="no-extended-margin-top"
            >
              <b-slider
                size="is-medium"
                class="has-lots-of-ticks"
                :min="1"
                :max="20"
                :tooltip="false"
                :disabled="!master"
                v-model="config.turns"
                @change="update_game_configuration"
              >
                <template v-for="val in [2, 4, 6, 8, 10, 12, 14, 16, 18]">
                  <b-slider-tick :value="val" :key="val">{{
                    val
                  }}</b-slider-tick>
                </template>
              </b-slider>
            </b-field>

            <b-field>
              <template slot="label">
                <i18n path="Time limit for each round: {limit}">
                  <template slot="limit">
                    <span class="is-date-desktop">{{ actual_time }}</span>
                    <span class="is-date-mobile">{{ actual_time_mobile }}</span>
                  </template>
                </i18n>
              </template>
              <b-slider
                size="is-medium"
                class="has-lots-of-ticks"
                :min="15"
                :max="infinite_duration"
                :step="15"
                :tooltip="false"
                :disabled="!master"
                v-model="config.time"
                @change="update_game_configuration"
              >
                <template
                  v-for="val in [60, 120, 180, 240, 300, 360, 420, 480, 540]"
                >
                  <b-slider-tick :value="val" :key="val">{{
                    format_seconds(val)
                  }}</b-slider-tick>
                </template>
                <b-slider-tick :value="infinite_duration"
                  >&infin;</b-slider-tick
                >
              </b-slider>
            </b-field>
            <div class="field">
              <b-switch
                :disabled="!master"
                v-model="config.stopOnFirstCompletion"
                @input="update_game_configuration"
              >
                {{ $t("Stop rounds as soon as the first player finishes") }}
              </b-switch>
            </div>
          </div>
        </div>
      </section>

      <div class="field start-button is-mobile">
        <b-tooltip
          multilined
          position="is-bottom"
          :label="start_button_tooltip"
        >
          <b-button
            type="is-primary is-medium"
            expanded
            :disabled="!master || !can_start"
            @click="start_game"
            >{{ $t("Start the game") }}</b-button
          ></b-tooltip
        >
      </div>

      <b-modal
        :active="suggestions_opened"
        :on-cancel="toggle_suggestions_modale"
      >
        <div class="modal-card suggestions-card">
          <header class="modal-card-head">
            <p class="modal-card-title">{{ $t("Categories suggestions") }}</p>
          </header>
          <section class="modal-card-body">
            <div v-if="master">
              <p
                v-t="
                  'Categories ideas are suggested below. You can always write your own categories directly—don\'t hesitate if you have original ideas or private references!'
                "
              />
              <p v-t="'Click on a category to add or remove it.'" />
            </div>
            <div v-else>
              <p
                v-t="
                  'Categories ideas are suggested below. The game master can write your own categories directly—don\'t hesitate to ask if you have original ideas or private references!'
                "
              />
            </div>

            <div
              class="tags"
              v-for="(categories_group, i) in suggested_categories"
              :key="i"
            >
              <span
                class="tag is-medium"
                :class="{
                  'is-primary': has_category(suggestion),
                  'is-static': !master
                }"
                v-for="(suggestion, i) in categories_group"
                :key="i"
                @click="toggle_category(suggestion)"
                >{{ suggestion }}</span
              >
            </div>

            <b-notification
              type="is-light"
              v-if="suggested_categories.length === 0"
              :closable="false"
            >
              {{
                $t(
                  "Sorry, but there are no suggestions available for your language."
                )
              }}
            </b-notification>
          </section>
          <footer class="modal-card-foot">
            <button
              class="button"
              type="button"
              @click="toggle_suggestions_modale()"
            >
              {{ $t("Close") }}
            </button>
          </footer>
        </div>
      </b-modal>
    </b-message>

    <div
      class="avanced-section-toggle"
      :class="{ 'is-active': show_advanced }"
      @click="show_advanced = !show_advanced"
    >
      {{ $t("Advanced settings") }}
      <b-icon :icon="show_advanced ? 'caret-up' : 'caret-down'"></b-icon>
    </div>

    <b-message v-show="show_advanced" type="is-primary" class="avanced-section">
      <div class="columns">
        <div class="column is-half">
          <b-field
            :message="
              $t('Each round\'s letter will be drawn from these letters.')
            "
          >
            <template slot="label">
              <div class="columns is-mobile">
                <div class="column is-half">
                  {{ $t("Alphabet") }}
                </div>
                <div class="column is-half suggestions-link" v-if="master">
                  <b-dropdown aria-role="list" position="is-bottom-left">
                    <a
                      href=""
                      @click.prevent=""
                      class="suggestions-link-trigger"
                      slot="trigger"
                      role="button"
                    >
                      {{ $t("Presets") }}
                      <b-icon icon="caret-down" size="is-small"></b-icon>
                    </a>

                    <div
                      v-for="(alphabets_cat, i) in Object.keys(alphabets)"
                      :key="i"
                    >
                      <b-dropdown-item
                        separator
                        v-if="i != 0"
                      ></b-dropdown-item>
                      <div class="dropdown-item">
                        <h4>{{ $t(alphabets_cat) }}</h4>
                        <p>{{ $t(alphabets[alphabets_cat].description) }}</p>
                      </div>
                      <b-dropdown-item
                        aria-role="listitem"
                        :class="{
                          'is-active':
                            config.alphabet ===
                            alphabets[alphabets_cat].alphabets[alphabet_in_cat]
                        }"
                        @click="
                          config.alphabet =
                            alphabets[alphabets_cat].alphabets[alphabet_in_cat];
                          update_game_configuration();
                        "
                        v-for="(alphabet_in_cat, j) in Object.keys(
                          alphabets[alphabets_cat].alphabets
                        )"
                        :key="j"
                        >{{ $t(alphabet_in_cat) }}</b-dropdown-item
                      >
                    </div>

                    <b-dropdown-item separator></b-dropdown-item>
                    <div class="dropdown-item">
                      <p>
                        {{ $t("Your language or alphabet is missing?") }}
                        <a
                          href="https://github.com/MorelGames/pitit-bac/issues"
                          target="_blank"
                          >{{ $t("Explain us how to add it!") }}</a
                        >
                      </p>
                    </div>
                  </b-dropdown>
                </div>
              </div>
            </template>
            <b-input
              type="text"
              v-model="config.alphabet"
              @blur="update_game_configuration"
              :disabled="!master"
            ></b-input>
          </b-field>
        </div>
        <div class="column is-half">
          <b-field class="scores-master-field">
            <template slot="label">
              <div class="columns is-mobile">
                <div class="column is-half">
                  {{ $t("Scores") }}
                </div>
                <div class="column is-half suggestions-link">
                  <b-dropdown aria-role="list" position="is-bottom-left">
                    <a
                      href=""
                      @click.prevent=""
                      class="suggestions-link-trigger"
                      slot="trigger"
                      role="button"
                    >
                      {{ $t("How does it work?") }}
                      <b-icon icon="caret-down" size="is-small"></b-icon>
                    </a>

                    <div class="dropdown-item">
                      <h4 v-t="'Valid'" />
                      <p
                        v-t="
                          'Points granted if the answer is correct, accepted by all players, and unique.'
                        "
                      />
                    </div>
                    <div class="dropdown-item">
                      <h4 v-t="'Duplicated'" />
                      <p
                        v-t="
                          'Points granted if the answer is correct, accepted by all players, but when other players answered the same thing.'
                        "
                      />
                    </div>
                    <b-dropdown-item separator></b-dropdown-item>
                    <div class="dropdown-item">
                      <h4 v-t="'Invalid'" />
                      <p
                        v-t="
                          'Points granted if the answer is not correct (does not start with the correct letter).'
                        "
                      />
                    </div>
                    <div class="dropdown-item">
                      <h4 v-t="'Refused'" />
                      <p
                        v-t="
                          'Points granted if the answer starts with the correct letter, but was voted against by a majority of players.'
                        "
                      />
                    </div>
                    <div class="dropdown-item">
                      <h4 v-t="'Empty'" />
                      <p v-t="'Points granted if the answer is missing.'" />
                    </div>
                    <b-dropdown-item separator></b-dropdown-item>
                    <div class="dropdown-item">
                      <p
                        v-t="
                          'Scores can be negative (points are then subtracted from the player\'s score).'
                        "
                      />
                    </div>
                  </b-dropdown>
                </div>
              </div>
            </template>
            <div
              class="columns scores-columns is-mobile is-multiline"
              :class="{ 'is-disabled': !master }"
            >
              <b-field class="column" :label="$t('Valid')">
                <b-input
                  type="number"
                  v-model="config.scores.valid"
                  @input="update_game_configuration($event)"
                  :disabled="!master"
                ></b-input>
              </b-field>
              <b-field class="column" :label="$t('Duplicated')">
                <b-input
                  type="number"
                  v-model="config.scores.duplicate"
                  @input="update_game_configuration($event)"
                  :disabled="!master"
                ></b-input>
              </b-field>
              <b-field class="column" :label="$t('Invalid')">
                <b-input
                  type="number"
                  v-model="config.scores.invalid"
                  @input="update_game_configuration($event)"
                  :disabled="!master"
                ></b-input>
              </b-field>
              <b-field class="column" :label="$t('Refused')">
                <b-input
                  type="number"
                  v-model="config.scores.refused"
                  @input="update_game_configuration($event)"
                  :disabled="!master"
                ></b-input>
              </b-field>
              <b-field class="column" :label="$t('Empty')">
                <b-input
                  type="number"
                  v-model="config.scores.empty"
                  @input="update_game_configuration($event)"
                  :disabled="!master"
                ></b-input>
              </b-field>
            </div>
          </b-field>
        </div>
      </div>
    </b-message>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      infinite_time_value: 600,
      filtered_suggestions: [],
      suggestions_opened: false,
      show_advanced: false,
      alphabets: require("../../data/alphabets.json"),
      categories_edited: false,
      suggested_categories: []
    };
  },
  computed: {
    ...mapState({
      master: state => state.morel.master,
      infinite_duration: state => state.game.infinite_duration,
      config: state => state.morel.configuration
    }),
    locale() {
      return this.$i18n.locale;
    },
    flat_suggested_categories() {
      return Array.prototype.concat.apply([], this.suggested_categories);
    },
    actual_time() {
      return this.$store.getters.is_time_infinite
        ? this.$t("infinite")
        : this.format_seconds(this.config.time, true);
    },
    actual_time_mobile() {
      return this.$store.getters.is_time_infinite
        ? this.$t("infinite")
        : this.format_seconds(this.config.time, true, true);
    },
    can_start() {
      return (
        this.has_categories && this.has_players && this.required_fields_filled
      );
    },
    has_players() {
      return Object.values(this.$store.state.morel.players).length > 1;
    },
    has_categories() {
      return this.$store.state.morel.configuration.categories.length !== 0;
    },
    required_fields_filled() {
      return (
        this.config.alphabet &&
        this.config.scores.valid !== "" &&
        this.config.scores.valid !== undefined &&
        this.config.scores.duplicate !== "" &&
        this.config.scores.duplicate !== undefined &&
        this.config.scores.invalid !== "" &&
        this.config.scores.invalid !== undefined &&
        this.config.scores.refused !== "" &&
        this.config.scores.refused !== undefined &&
        this.config.scores.empty !== "" &&
        this.config.scores.empty !== undefined
      );
    },
    start_button_tooltip() {
      if (this.master) {
        if (!this.has_players)
          return this.$t(
            "You're alone! Invite other players to join using the game link…"
          );
        else if (!this.has_categories)
          return this.$t("You cannot start the game without categories.");
        else if (!this.required_fields_filled)
          return this.$t("Some fields are not correctly set.");
        else return "";
      } else {
        return this.$t("Please wait—the game master will start the game…");
      }
    }
  },
  methods: {
    load_suggestions(init) {
      // Okay so what are we doing here (if init = true).
      // We want default categories to be set according to the current locale,
      // except if there are some saved categories on the server. The server
      // don't sent a configuration message if the game was just created, so
      // we use that as a signal.
      // If a configuration message is sent, there is a good chance it will be
      // received during the categories loading. So we check if the categories
      // list is still empty. If it's not, we don't update it as it was filled
      // by the server. If it is, maybe the network is a little bit slow so we
      // wait one more second to save the configuration server side, so if the
      // message is received before, the update will contains this and the
      // server version will be kept.
      // Also, if there are categories received in init mode we set the
      // categories as edited, so we won't erase them if the user changes its
      // locale.
      // In other cases, we're on a new game, so we can write our categories
      // normally.
      // If init = false, this is called from a locale switch. Then, we only
      // update the categories with the default if they were not updated by the
      // user yet.
      import(
        /* webpackChunkName: "categories-[request]" */ "./../../locales/categories/" +
          this.locale +
          ".json"
      )
        .then(categories => {
          this.suggested_categories = categories.default.suggestions;

          if (!this.master) return;

          if (
            (init && this.config.categories.length === 0) ||
            (!init && !this.categories_edited)
          ) {
            this.config.categories = categories.default.default.categories;
            this.config.alphabet = categories.default.default.alphabet;

            setTimeout(
              () => {
                this.$store.dispatch(
                  "morel/update_game_configuration",
                  this.config
                );
              },
              init ? 1000 : 1
            );
          } else if (init) {
            this.categories_edited = true;
          }
        })
        .catch(() => {
          this.suggested_categories = [];
        });
    },

    format_seconds(seconds, long, mobile) {
      let mm = Math.floor(seconds / 60);
      let ss = seconds - mm * 60;

      const $t = this.$t.bind(this);
      const $tc = this.$tc.bind(this);

      if (long) {
        if (mm > 0 && ss > 0) {
          if (mobile) {
            return $t("{minutes} and {seconds}", {
              minutes: $tc("{n} minute | {n} minutes", mm),
              seconds: $tc("{n}s | {n}s", ss)
            });
          } else {
            return $t("{minutes} and {seconds}", {
              minutes: $tc("{n} minute | {n} minutes", mm),
              seconds: $tc("{n} second | {n} seconds", ss)
            });
          }
        } else if (mm > 0) {
          return $tc("{n} minute | {n} minutes", mm);
        } else {
          return $tc("{n} second | {n} seconds", ss);
        }
      } else {
        return `${mm.toString().padStart(2, "0")}:${ss
          .toString()
          .padStart(2, "0")}`;
      }
    },

    update_game_configuration(edited_value) {
      // If the edited value is given and empty, we don't trigger an update, so
      // the user _can_ empty the field to type a new value. Used for text &
      // number fields that are updated for every keystroke.
      if (
        edited_value !== undefined &&
        typeof edited_value !== "boolean" &&
        !edited_value
      ) {
        return;
      }

      this.categories_edited = true;

      // We update the configuration on the next tick; else, when we click on a slider
      // directly on another point (without dragging the cursor), the value sent to
      // the server is the value before the update, and the configuration update
      // messages resets the value to the previous one immediatly.
      this.$nextTick(() =>
        this.$store.dispatch("morel/update_game_configuration", this.config)
      );
    },

    update_suggestions(text) {
      text = text.toLowerCase().replace("...", "…");
      this.filtered_suggestions = this.flat_suggested_categories.filter(
        category => category.toLowerCase().indexOf(text) >= 0
      );
    },

    toggle_suggestions_modale() {
      this.suggestions_opened = !this.suggestions_opened;
    },

    has_category(category) {
      return (
        this.$store.state.morel.configuration.categories.indexOf(category) !==
        -1
      );
    },

    toggle_category(category) {
      if (!this.master) return;

      let index = this.config.categories.indexOf(category);
      if (index === -1) {
        this.config.categories.push(category);
      } else {
        this.config.categories.splice(index, 1);
      }

      this.update_game_configuration();
    },

    start_game() {
      this.$store.dispatch("ask_start_game");
    }
  },
  mounted() {
    this.load_suggestions(true);
  },
  watch: {
    locale() {
      this.load_suggestions();
    }
  }
};
</script>

<style lang="sass">
@import "../assets/variables"

.message
  .message-header
    +mobile
      border-radius: 0
  .message-body
    .media-content
      overflow-x: inherit

      div.column.is-half:first-of-type
        +mobile
          padding-bottom: 0

      .start-button
        &.is-desktop
          +mobile
            display: none
        &.is-mobile
          +tablet
            display: none
          +mobile
            margin-top: 1.5rem

label.switch span.control-label
  position: relative
  top: 2px

div.column.is-half div.field:not(:first-child):not(.no-extended-margin-top)
  margin-top: 3rem

div.field > span.b-tooltip
  display: inline-block
  width: 100%

  &.is-multiline:after
    width: 360px !important

.is-date-desktop
  +mobile
    display: none
.is-date-mobile
  +tablet
    display: none

.game-configuration
  label.label .suggestions-link
    text-align: right
    font-weight: normal !important

    a.suggestions-link-trigger
      color: $primary-dark !important

      cursor: pointer
      text-decoration: none !important

  input.input[disabled]
    background: transparent
    border: none
    padding: 0
    color: $grey-dark
    cursor: default

  div.taginput.control .taginput-container[disabled]
    position: relative
    left: -2px

    // TODO use variable for these
    background-color: #f8fef6
    border-color: #f8fef6

    cursor: default

    .tag
      .delete
        display: none

    .autocomplete.control
      display: none

  .b-slider
    &.has-lots-of-ticks
      +mobile
        .b-slider-track
          .b-slider-tick:nth-of-type(2n)
            display: none

    &.is-disabled
      .b-slider-track
        opacity: 1 !important
        cursor: default !important
        .b-slider-tick
          background: transparent

      .b-slider-thumb-wrapper
        display: none

  .switch[disabled]
    opacity: 1 !important

    .control-label
      color: $dark
      cursor: default

div.modal-card.suggestions-card
  width: auto

  +mobile
    width: 100%
    height: 100%
    max-height: 100vh
    margin: 0
    background-color: whitesmoke

    p
      width: calc(100vw - 2rem)
      text-align: justify

  p:not(:first-child)
    margin-top: .8rem

  div.tags
    margin-top: 1.5rem

    .tag:not(.is-static)
      cursor: pointer

      &:hover
        background-color: $grey-lighter
        &.is-primary
          background-color: $primary-dark

    .tag.is-static
      cursor: default

  article.notification
    margin-top: 1rem

div.column.is-column-with-start-button
  display: flex
  flex-direction: column

  .field:not(.start-button)
    flex: 4

.avanced-section-toggle
  margin-bottom: 1.5rem
  text-align: center
  color: $grey-light
  cursor: pointer

  &.is-active
    color: $grey

  &:hover
    color: $grey-dark

  .icon
    position: relative
    top: 6px

.avanced-section
  .message-body
    border: none

    .suggestions-link
      position: relative
      top: -2px

      a .icon
        position: relative
        top: 6px

      .dropdown-content
        div.dropdown-item
          margin-bottom: .4rem

          text-align: left
          color: $grey

          +tablet
            min-width: 20rem

          h4
            color: $grey-dark
            font-size: 1.1em
            font-variant: all-small-caps
            letter-spacing: 1px
          p
            color: $grey
            font-size: .9em

          a
            color: $grey-dark
            text-decoration: none

          &:last-child
            margin-bottom: 0

    .scores-master-field
      +mobile
        margin-top: 1rem

      label.label
        margin-bottom: 0

      .scores-columns
        // The alphabet and score columns are not aligned correctly
        position: relative
        top: -4px

        .field.column
          display: flex
          flex-direction: column-reverse
          margin-top: 0 !important

          label
            flex: 2
            padding-top: .4rem
            padding-left: .1em
            font-weight: normal

          input[disabled]
            -moz-appearance: textfield

            &:-webkit-outer-spin-button, &:-webkit-inner-spin-button
              -webkit-appearance: none
              margin: 0

        &.is-disabled
          +mobile
            margin-top: .4rem

          .field.column
            flex-direction: column

            label
              padding-top: 0
              padding-left: 0

            div.control
              flex: 4
</style>
