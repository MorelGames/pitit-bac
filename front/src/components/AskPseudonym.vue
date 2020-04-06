<template>
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
        @keyup.native.enter.once="start"
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
      localStorage.setItem("pb_pseudonym", this.pseudonym);
      this.$store.dispatch("set_pseudonym_and_connect", this.pseudonym);
    }
  }
};
</script>

<style lang="sass">
div.field div.field
  margin-top: 2em !important

.ask-pseudonym
  text-align: center
</style>
