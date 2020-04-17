<template>
  <div id="app">
    <b-loading :is-full-page="true" :active="!!loading" :can-cancel="false">
      <p v-html="loading_title"></p>
      <p
        class="loading-subtitle"
        v-if="loading_subtitle"
        v-html="loading_subtitle"
      ></p>
    </b-loading>
    <main>
      <div
        class="container"
        :class="{ 'is-loading': !!loading }"
        v-if="state != 'PSEUDONYM'"
      >
        <div class="pititbac-logo is-mobile" aria-hidden="true">
          <img src="./assets/logo.svg" alt="Pitit Bac" />
        </div>
        <div class="columns layout-columns">
          <div class="column is-3">
            <div class="pititbac-logo">
              <img src="./assets/logo.svg" alt="Pitit Bac" />
            </div>
            <Players></Players>
            <ShareGame></ShareGame>
          </div>
          <div class="column is-9">
            <GameConfiguration v-if="state === 'CONFIG'"></GameConfiguration>
            <Game v-else-if="state === 'ROUND_ANSWERS'"></Game>
            <GameVote v-else-if="state === 'ROUND_VOTES'"></GameVote>
            <GameEnd v-else-if="state === 'END'"></GameEnd>
          </div>
        </div>
      </div>
      <div v-else class="container" :class="{ 'is-loading': !!loading }">
        <div class="columns">
          <div class="column is-half is-offset-3">
            <AskPseudonym></AskPseudonym>
          </div>
        </div>
      </div>
    </main>
    <footer class="footer" :class="{ 'is-loading': !!loading }">
      <div class="content has-text-centered">
        <p>
          <em>Pitit Bac</em> est réalisé par
          <a href="https://amaury.carrade.eu">Amaury Carrade</a>. Cette
          application est
          <a href="https://github.com/AmauryCarrade/pitit-bac"
            >à source ouverte, et publiée sous licence libre</a
          >.
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import { mapState } from "vuex";

// import CircularProgress from "./components/CircularProgress.vue";

import AskPseudonym from "./components/AskPseudonym.vue";
import Players from "./components/Players.vue";
import ShareGame from "./components/ShareGame.vue";
import GameConfiguration from "./components/GameConfiguration.vue";
import Game from "./components/Game.vue";
import GameVote from "./components/GameVote.vue";
import GameEnd from "./components/GameEnd.vue";

export default {
  name: "App",
  computed: {
    ...mapState({
      state: "game_state",
      loading: "loading"
    }),

    loading_title() {
      if (!this.loading) return null;
      return typeof this.loading === "string"
        ? this.loading
        : this.loading.title;
    },

    loading_subtitle() {
      if (!this.loading) return null;
      return typeof this.loading === "string" ? null : this.loading.subtitle;
    }
  },

  watch: {
    state() {
      this.$nextTick(() => window.scrollTo(0, 0));
    }
  },

  components: {
    AskPseudonym,
    Players,
    ShareGame,
    GameConfiguration,
    Game,
    GameVote,
    GameEnd
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

@import "assets/variables"

@import "~bulma"
@import "~buefy/src/scss/buefy"

html, body
  overflow-y: auto
  min-height: 100vh

#app
  font-family: "Fira Sans", Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

  display: flex
  flex-direction: column
  min-height: 100vh

  color: #2c3e50
  padding-top: 60px

  +mobile
    padding: 1.6rem 0 1rem 0

  +tablet
    padding: 1.6rem 1rem

  main
    flex: 2

  .notification
    padding-right: 1.5rem !important

    .media-content
      overflow: hidden

  .loading-overlay
    flex-direction: column

    padding: 1em 20%
    background-color: rgba(white, .8)

    +mobile
      padding: 1em

    p
      font-size: 2.8em
      font-weight: 200

      +mobile
        font-size: 1.8em

      text-align: center

      animation: pulse 2s infinite

      strong
        font-weight: 400

      &.loading-subtitle
        margin-top: 2em
        font-size: 1.8em
        animation: none

        +mobile
          font-size: 1.3em

  .container, .footer
    &.is-loading
      filter: blur(4px)

  .field
    .help
      color: $grey-light

  .pititbac-logo
    margin-top: .2rem
    margin-bottom: 2rem

    +tablet
      display: none

    &.is-mobile
      +mobile
        display: block
        text-align: center

        img
          width: 90%
          max-height: 4rem

    &:not(.is-mobile)
      +mobile
        display: none
      +tablet
        display: block

  .columns.layout-columns
    +mobile
      display: flex
      flex-direction: column-reverse

@keyframes pulse
  0%
    color: $black
  50%
    color: $grey
  100%
    color: $black
</style>
