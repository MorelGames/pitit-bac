<template>
  <div>
    <header class="init-logo">
      <img src="../assets/logo.svg" alt="Pitit Bac" />
    </header>
    <b-field
      label="Comment doit-on vous appeler ?"
      custom-class="is-large ask-pseudonym"
      position="is-centered"
    >
      <b-field>
        <b-input
          placeholder="Entrez votre nom…"
          size="is-large is-expanded"
          maxlength="32"
          v-model.trim="pseudonym"
          @keyup.native.enter="start"
          autofocus
        ></b-input>
        <p class="control">
          <button
            class="button is-primary is-large"
            aria-label="Se connecter au salon de jeu"
            @click.once="start"
          >
            →
          </button>
        </p>
      </b-field></b-field
    >
    <p class="joining-existing-game" v-if="is_existing_game">
      Vous rejoignez une partie existante.<br />
      Si vous le désirez, vous pouvez également <a href="#" @click.prevent="erase_slug">créer une nouvelle partie</a>.
    </p>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      pseudonym: ""
    };
  },
  computed: {
    ...mapState({
      is_existing_game: state => !!state.game.slug
    })
  },
  mounted: function() {
    this.pseudonym = localStorage.getItem("pb_pseudonym") || "";
  },
  methods: {
    start() {
      if (this.pseudonym) {
        localStorage.setItem("pb_pseudonym", this.pseudonym);
        this.$store.dispatch("set_pseudonym_and_connect", this.pseudonym);
      }
    },
    erase_slug() {
      this.$store.dispatch("set_game_slug", "");
    }
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/mixins"

div.field div.field
  margin-top: 2em !important

.init-logo
  text-align: center
  margin-bottom: 4rem
  width: 100%

  img
    width: 70%

    +mobile
      width: 90%

.ask-pseudonym
  text-align: center

p.joining-existing-game
  text-align: center
</style>
