<template>
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
              <div class="columns">
                <div class="column is-8">
                  Catégories à remplir
                </div>
                <div class="column is-4 suggestions-link" v-if="master">
                  <a href="#" @click.prevent="toggle_suggestions_modale()">Suggestions</a>
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
          <div class="field">
            <b-tooltip multilined position="is-bottom" :label="start_button_tooltip">
            <b-button
              type="is-primary is-medium"
              expanded
              :disabled="!master || !can_start"
              @click="start_game"
              >Démarrer la partie</b-button
            ></b-tooltip>
          </div>
        </div>
        <div class="column is-half">
          <b-field
            :label="'Nombre de tours : ' + config.turns"
            class="no-extended-margin-top"
          >
            <b-slider
              size="is-medium"
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

          <b-field :label="'Durée maximale par tour : ' + actual_time">
            <b-slider
              size="is-medium"
              :min="15"
              :max="infinite_duration"
              :step="5"
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


    <b-modal :active="suggestions_opened" :on-cancel="toggle_suggestions_modale">
      <div class="modal-card suggestions-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Suggestions de catégories</p>
        </header>
        <section class="modal-card-body">
          <p>
            Des idées de catégories sont suggérées ci-dessous. Vous pouvez toujours
            entrer directement vos propres catégories — n'hésitez pas si vous avez
            des idées originales ou des références privées !
          </p>
          <p>
            Cliquez sur une catégorie pour l'ajouter ou la supprimer.
          </p>

          <div class="tags" v-for="(categories_group, i) in suggested_categories" :key="i">
            <span class="tag is-medium" :class="{'is-primary': has_category(suggestion)}" v-for="(suggestion, i) in categories_group" :key="i" @click="toggle_category(suggestion)">{{ suggestion }}</span>
          </div>
        </section>
        <footer class="modal-card-foot">
            <button class="button" type="button" @click="toggle_suggestions_modale()">Fermer</button>
        </footer>
      </div>
    </b-modal>
  </b-message>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      infinite_time_value: 600,
      filtered_suggestions: [],
      suggestions_opened: false
    };
  },
  computed: {
    ...mapState({
      master: state => state.master,
      infinite_duration: state => state.game.infinite_duration,
      suggested_categories: state => state.game.suggested_categories
    }),
    config() {
      return this.$store.state.game.configuration;
    },
    flat_suggested_categories() {
      return Array.prototype.concat.apply([], this.suggested_categories);
    },
    actual_time() {
      return this.$store.getters.is_time_infinite
        ? "infinie"
        : this.format_seconds(this.config.time, true);
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
      }
      else {
        return "Veuillez patienter — le maître du jeu va lancer la partie…";
      }
    }
  },
  methods: {
    format_seconds(seconds, long) {
      let mm = Math.floor(seconds / 60);
      let ss = seconds - mm * 60;

      return long
        ? (mm > 0 ? `${mm} minute${mm > 1 ? "s" : ""}` : "") +
            (mm > 0 && ss > 0 ? " et" : "") +
            (ss > 0 ? ` ${ss} seconde${ss > 1 ? "s" : ""}` : "")
        : `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    },

    update_game_configuration() {
      this.$store.dispatch("update_game_configuration", this.config);
    },

    update_suggestions(text) {
      text = text.toLowerCase().replace("...", "…");
      this.filtered_suggestions = this.flat_suggested_categories.filter(category => category.toLowerCase().indexOf(text) >= 0);
    },

    toggle_suggestions_modale() {
      this.suggestions_opened = !this.suggestions_opened
    },

    has_category(category) {
      return this.$store.state.game.configuration.categories.indexOf(category) !== -1;
    },

    toggle_category(category) {
      let index = this.config.categories.indexOf(category);
      if (index === -1) {
        this.config.categories.push(category);
      }
      else {
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

div.field > span.b-tooltip
  display: inline-block
  width: 100%

  &.is-multiline:after
    width: 360px !important

label.label .suggestions-link
  text-align: right

  a
    color: $primary-dark !important
    font-weight: normal

    cursor: pointer
    text-decoration: none !important

div.modal-card.suggestions-card
  width: auto

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
</style>
