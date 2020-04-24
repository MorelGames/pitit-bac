<template>
  <div class="ask-pseudonym">
    <header class="init-logo">
      <img src="../assets/logo.svg" alt="Pitit Bac" />
    </header>
    <b-field custom-class="is-large ask-pseudonym" position="is-centered">
      <template slot="label">
        Comment doit-on vous appeler{{ "\xa0" }}?
      </template>
      <b-field>
        <b-input
          placeholder="Entrez votre nom…"
          size="is-large is-expanded"
          maxlength="32"
          v-model.trim="pseudonym"
          @keyup.native.enter="start_game"
          autofocus
        ></b-input>
        <p class="control">
          <button
            class="button is-primary is-large"
            aria-label="Se connecter au salon de jeu"
            @click.once="start_game"
          >
            <b-icon icon="chevron-right"></b-icon>
          </button>
        </p> </b-field
    ></b-field>
    <p class="joining-existing-game" v-if="is_existing_game && !kick_reason">
      Vous rejoignez une partie existante.<br />
      Si vous le désirez, vous pouvez également
      <a href="#" @click.prevent="erase_slug">créer une nouvelle partie</a>.
    </p>
    <b-message v-if="kick_reason" type="is-danger" class="kick-reason">
      <p>
        <template v-if="kick_reason === 'locked'">
          Vous ne pouvez pas rejoindre cette partie car elle est verrouillée.
        </template>
        <template v-else>
          Vous avez été expulsé⋅e de cette partie.
        </template>
      </p>
      <p>
        <b-button type="is-danger" @click="create_new_game">Créer une nouvelle partie</b-button>
      </p>
    </b-message>
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
      is_existing_game: state => !!state.game.slug,
      kick_reason: state => state.game.kick_reason
    })
  },
  mounted: function() {
    this.pseudonym = localStorage.getItem("pb_pseudonym") || "";
  },
  methods: {
    start_game() {
      if (this.pseudonym) {
        localStorage.setItem("pb_pseudonym", this.pseudonym);
        this.$store.dispatch("set_pseudonym_and_connect", this.pseudonym);
      }
    },
    erase_slug() {
      this.$store.dispatch("set_game_slug", "");
      this.$store.commit("set_kick_reason", null);
    },
    create_new_game() {
      this.erase_slug();
      this.start_game();
    }
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/mixins"

.ask-pseudonym
  +mobile
    padding: 0 1rem

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

.kick-reason
  margin: auto
  width: 100%

  +mobile
    width: 100%

  .message-body
    border: none

    .media-content p
      text-align: center

      & + p
        margin-top: 1rem
</style>
