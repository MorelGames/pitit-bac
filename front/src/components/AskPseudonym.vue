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
  </div>
</template>

<script>
export default {
  data() {
    return {
      pseudonym: ""
    };
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
</style>
