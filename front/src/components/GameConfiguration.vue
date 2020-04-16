<template>
  <div class="game-configuration">
    <b-message
      :title="master ? 'Configurer la partie' : 'Configuration de la partie'"
      :closable="false"
      type="is-primary"
    >
      <section>
        <div class="columns">
          <div class="column is-half">
            <b-field
              label="Catégories à remplir"
              :message="
                master
                  ? 'Écrivez le nom de la catégorie, et tapez “entrée” pour l\'ajouter.'
                  : ''
              "
            >
              <template slot="label">
                <div class="columns is-mobile">
                  <div class="column is-8">
                    Catégories à remplir
                  </div>
                  <div class="column is-4 suggestions-link" v-if="master">
                    <a href="#" class="suggestions-link-trigger" @click.prevent="toggle_suggestions_modale()"
                      >Suggestions</a
                    >
                  </div>
                </div>
              </template>
              <b-taginput
                v-model="config.categories"
                :data="filtered_suggestions"
                autocomplete
                allow-new
                @input="update_game_configuration"
                @typing="update_suggestions"
                placeholder="Ajouter une catégorie…"
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
                  >Démarrer la partie</b-button
                ></b-tooltip
              >
            </div>
          </div>
          <div class="column is-half">
            <b-field
              :label="'Nombre de tours : ' + config.turns"
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
                  <b-slider-tick :value="val" :key="val">{{ val }}</b-slider-tick>
                </template>
              </b-slider>
            </b-field>

            <b-field>
              <template slot="label">
                Durée maximale par tour :
                <span class="is-date-desktop">{{ actual_time }}</span>
                <span class="is-date-mobile">{{ actual_time_mobile }}</span>
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
                <b-slider-tick :value="infinite_duration">&infin;</b-slider-tick>
              </b-slider>
            </b-field>
            <div class="field">
              <b-switch
                :disabled="!master"
                v-model="config.stopOnFirstCompletion"
                @input="update_game_configuration"
              >
                Arrêter chaque tour lorsque que quelqu'un a terminé
              </b-switch>
            </div>
          </div>
        </div>
      </section>

      <div class="field start-button is-mobile">
        <b-tooltip multilined position="is-bottom" :label="start_button_tooltip">
          <b-button
            type="is-primary is-medium"
            expanded
            :disabled="!master || !can_start"
            @click="start_game"
            >Démarrer la partie</b-button
          ></b-tooltip
        >
      </div>

      <b-modal
        :active="suggestions_opened"
        :on-cancel="toggle_suggestions_modale"
      >
        <div class="modal-card suggestions-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Suggestions de catégories</p>
          </header>
          <section class="modal-card-body">
            <p>
              Des idées de catégories sont suggérées ci-dessous. Vous pouvez
              toujours entrer directement vos propres catégories — n'hésitez pas
              si vous avez des idées originales ou des références privées !
            </p>
            <p>
              Cliquez sur une catégorie pour l'ajouter ou la supprimer.
            </p>

            <div
              class="tags"
              v-for="(categories_group, i) in suggested_categories"
              :key="i"
            >
              <span
                class="tag is-medium"
                :class="{ 'is-primary': has_category(suggestion) }"
                v-for="(suggestion, i) in categories_group"
                :key="i"
                @click="toggle_category(suggestion)"
                >{{ suggestion }}</span
              >
            </div>
          </section>
          <footer class="modal-card-foot">
            <button
              class="button"
              type="button"
              @click="toggle_suggestions_modale()"
            >
              Fermer
            </button>
          </footer>
        </div>
      </b-modal>
    </b-message>

    <div class="avanced-section-toggle" :class="{'is-active': show_advanced}" @click="show_advanced = !show_advanced">
      Paramètres avancés <b-icon :icon="show_advanced ? 'caret-up' : 'caret-down'"></b-icon>
    </div>

    <b-message v-show="show_advanced" type="is-primary" class="avanced-section">
      <div class="columns">
        <div class="column is-half">
          <b-field message="La lettre de chaque tour sera extraite au hasard de ces lettres.">
            <template slot="label">
              <div class="columns is-mobile">
                <div class="column is-half">
                  Alphabet à utiliser
                </div>
                <div class="column is-half suggestions-link" v-if="master">
                  <b-dropdown aria-role="list" position="is-bottom-left">
                    <a
                        href=""
                        @click.prevent=""
                        class="suggestions-link-trigger"
                        slot="trigger"
                        role="button">
                        Pré-sélections <b-icon icon="caret-down" size="is-small"></b-icon>
                    </a>

                    <div v-for="(alphabets_cat, i) in Object.keys(alphabets)" :key="i">
                      <b-dropdown-item separator v-if="i != 0"></b-dropdown-item>
                      <b-dropdown-item :custom="true" @click="this.blur()">
                        <h4>{{ alphabets_cat }}</h4>
                        <p>{{ alphabets[alphabets_cat].description }}</p>
                      </b-dropdown-item>
                      <b-dropdown-item aria-role="listitem" :class="{'is-active': config.alphabet === alphabets[alphabets_cat].alphabets[alphabet_in_cat]}" @click="config.alphabet = alphabets[alphabets_cat].alphabets[alphabet_in_cat]; update_game_configuration()" v-for="(alphabet_in_cat, j) in Object.keys(alphabets[alphabets_cat].alphabets)" :key="j">{{ alphabet_in_cat }}</b-dropdown-item>
                    </div>

                    <b-dropdown-item separator></b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <p>Votre langue ou alphabet manque à la liste ? <a href="https://github.com/AmauryCarrade/pitit-bac/issues" target="_blank">Dites-nous comment l'ajouter !</a></p>
                    </b-dropdown-item>
                </b-dropdown>
                </div>
              </div>
            </template>
            <b-input type="text" v-model="config.alphabet" @blur="update_game_configuration" :disabled="!master"></b-input>
          </b-field>
        </div>
        <div class="column is-half">
          <b-field class="scores-master-field">
            <template slot="label">
              <div class="columns is-mobile">
                <div class="column is-half">
                  Scores
                </div>
                <div class="column is-half suggestions-link" v-if="master">
                  <b-dropdown aria-role="list" position="is-bottom-left">
                    <a
                        href=""
                        @click.prevent=""
                        class="suggestions-link-trigger"
                        slot="trigger"
                        role="button">
                        Explications <b-icon icon="caret-down" size="is-small"></b-icon>
                    </a>

                    <b-dropdown-item :custom="true">
                      <h4>Valide</h4>
                      <p>Points attribués si la réponse est correcte, acceptée par tous, et unique.</p>
                    </b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <h4>Dupliquée</h4>
                      <p>Points attribués si la réponse est correcte, acceptée par tous, mais que plusieurs personne ont répondu la même chose.</p>
                    </b-dropdown-item>
                    <b-dropdown-item separator></b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <h4>Invalide</h4>
                      <p>Points attribués si la réponse n'est pas correcte (elle ne commence pas par la bonne lettre).</p>
                    </b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <h4>Refusée</h4>
                      <p>Points attribués si la réponse commence par la bonne lettre, mais est refusée par la majorité des participants.</p>
                    </b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <h4>Vide</h4>
                      <p>Points attribués si la réponse est manquante.</p>
                    </b-dropdown-item>
                    <b-dropdown-item separator></b-dropdown-item>
                    <b-dropdown-item :custom="true">
                      <p>Les scores peuvent être négatifs (les points sont alors retirés du score du joueur).</p>
                    </b-dropdown-item>
                </b-dropdown>
                </div>
              </div>
            </template>
            <div class="columns scores-columns is-mobile">
              <b-field class="column" label="Valide">
                <b-input type="number" v-model="config.scores.valid" @input="update_game_configuration" :disabled="!master"></b-input>
              </b-field>
              <b-field class="column" label="Dupliquée">
                <b-input type="number" v-model="config.scores.duplicate" @input="update_game_configuration" :disabled="!master"></b-input>
              </b-field>
              <b-field class="column" label="Invalide">
                <b-input type="number" v-model="config.scores.invalid" @input="update_game_configuration" :disabled="!master"></b-input>
              </b-field>
              <b-field class="column" label="Refusée">
                <b-input type="number" v-model="config.scores.refused" @input="update_game_configuration" :disabled="!master"></b-input>
              </b-field>
              <b-field class="column" label="Vide">
                <b-input type="number" v-model="config.scores.empty" @input="update_game_configuration" :disabled="!master"></b-input>
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
      alphabets: require("../../data/alphabets.json")
    };
  },
  computed: {
    ...mapState({
      master: state => state.master,
      infinite_duration: state => state.game.infinite_duration,
      suggested_categories: state => state.game.suggested_categories,
      config: state => state.game.configuration
    }),
    flat_suggested_categories() {
      return Array.prototype.concat.apply([], this.suggested_categories);
    },
    actual_time() {
      return this.$store.getters.is_time_infinite
        ? "infinie"
        : this.format_seconds(this.config.time, true);
    },
    actual_time_mobile() {
      return this.$store.getters.is_time_infinite
        ? "infinie"
        : this.format_seconds(this.config.time, true, true);
    },
    can_start() {
      return this.has_categories && this.has_players;
    },
    has_players() {
      return Object.values(this.$store.state.players).length > 1;
    },
    has_categories() {
      return this.$store.state.game.configuration.categories.length !== 0;
    },
    start_button_tooltip() {
      if (this.master) {
        if (!this.has_players)
          return "Il n'y a que vous ! Invitez d'autres joueurs à vous rejoindre avec le lien ci-contre…";
        else if (!this.has_categories)
          return "Vous ne pouvez pas démarrer le jeu sans aucune catégorie.";
        else return "";
      } else {
        return "Veuillez patienter — le maître du jeu va lancer la partie…";
      }
    }
  },
  methods: {
    format_seconds(seconds, long, mobile) {
      let mm = Math.floor(seconds / 60);
      let ss = seconds - mm * 60;

      return long
        ? (mm > 0 ? `${mm} minute${mm > 1 ? "s" : ""}` : "") +
            (mm > 0 && ss > 0 && !mobile ? " et" : "") +
            (ss > 0
              ? ` ${ss}` + (mobile ? "" : ` seconde${ss > 1 ? "s" : ""}`)
              : "")
        : `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    },

    update_game_configuration() {
      // We update the configuration on the next tick; else, when we click on a slider
      // directly on another point (without dragging the cursor), the value sent to
      // the server is the value before the update, and the configuration update
      // messages resets the value to the previous one immediatly.
      this.$nextTick(() =>
        this.$store.dispatch("update_game_configuration", this.config)
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
        this.$store.state.game.configuration.categories.indexOf(category) !== -1
      );
    },

    toggle_category(category) {
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

div.taginput.control .taginput-container[disabled]
  // TODO use variable for these
  background-color: #f8fef6
  border-color: #f8fef6

  cursor: default

  .tag
    .delete
      display: none

  .autocomplete.control
    display: none

input.input[disabled]
  background: transparent
  border: none
  padding: 0
  color: $grey-dark
  cursor: default

div.field > span.b-tooltip
  display: inline-block
  width: 100%

  &.is-multiline:after
    width: 360px !important

label.label .suggestions-link
  text-align: right
  font-weight: normal !important

  a.suggestions-link-trigger
    color: $primary-dark !important

    cursor: pointer
    text-decoration: none !important

.is-date-desktop
  +mobile
    display: none
.is-date-mobile
  +tablet
    display: none

.b-slider.has-lots-of-ticks
  +mobile
    .b-slider-track
      .b-slider-tick:nth-of-type(2n)
        display: none

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

    .tag
      cursor: pointer

      &:hover
        background-color: $grey-lighter
        &.is-primary
          background-color: $primary-dark

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
            letter-spacing: 0.02em
          p
            color: $grey
            font-size: .9em

          a
            color: $grey-dark
            text-decoration: none

    .scores-master-field
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
</style>
