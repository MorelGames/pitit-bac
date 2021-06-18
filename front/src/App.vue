<template>
  <div id="app">
    <b-loading
      :is-full-page="true"
      :active="has_fullscreen_message"
      :can-cancel="false"
    >
      <template slot="default" v-if="loading_reason.title || error.title">
        <p
          v-html="loading_reason.title || error.title"
          :class="{ 'is-pulsing': !!loading }"
        ></p>
        <p
          class="loading-subtitle"
          v-if="loading_reason.title || error.title"
          v-html="loading_reason.description || error.description"
        ></p>
      </template>
    </b-loading>

    <main>
      <div
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
        v-if="phase != 'PSEUDONYM'"
      >
        <div class="pititbac-logo is-mobile" aria-hidden="true">
          <img src="./assets/logo.svg" alt="Pitit Bac" />
        </div>
        <div class="columns layout-columns">
          <div class="column is-3">
            <div class="pititbac-logo">
              <img src="./assets/logo.svg" alt="Pitit Bac" />
            </div>
            <morel-players
              :master-confirm-message="
                $t(
                  '<strong>{name}</strong> will be able to manage the game, its configuration, and relaunch a new game at the end. You\'ll lose those powers.'
                )
              "
              :master-confirm-help="
                $t(
                  'The game master cannot influence the votes or the game, only its configuration or relaunch. It can also kick players and lock the game.'
                )
              "
              :class="{ 'is-sticky': sticky_players_list }"
            />
            <morel-share-game />
          </div>
          <div class="column is-9">
            <GameConfiguration v-if="phase === 'CONFIG'"></GameConfiguration>
            <Game v-else-if="phase === 'ROUND_ANSWERS'"></Game>
            <GameVote v-else-if="phase === 'ROUND_VOTES'"></GameVote>
            <GameEnd v-else-if="phase === 'END'"></GameEnd>
          </div>
        </div>
      </div>
      <div
        v-else
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
      >
        <div class="columns">
          <div class="column is-half is-offset-3">
            <header class="init-logo">
              <img src="./assets/logo.svg" alt="Pitit Bac" />
            </header>
            <morel-ask-pseudonym />
          </div>
        </div>
      </div>
    </main>

    <footer class="footer" :class="{ 'is-loading': has_fullscreen_message }">
      <div class="content has-text-centered">
        <p>
          <i18n path="Pitit Bac is brought to you by {name}.">
            <a href="https://amaury.carrade.eu" slot="name"
              >Amaury Carrade</a
            > </i18n
          >&nbsp;
          <i18n path="This application is {open_source}.">
            <a
              href="https://github.com/MorelGames/pitit-bac"
              slot="open_source"
              >{{ $t("open source, and published under a free licence") }}</a
            >
          </i18n>
        </p>
        <morel-locale-switcher />
      </div>
    </footer>
  </div>
</template>

<script>
import { mapState } from "vuex";

import GameConfiguration from "./components/GameConfiguration.vue";
import Game from "./components/Game.vue";
import GameVote from "./components/GameVote.vue";
import GameEnd from "./components/GameEnd.vue";

export default {
  name: "App",
  computed: {
    ...mapState("morel", {
      phase: state => state.phase,
      loading: state => state.loading,
      loading_reason: state => state.loading_reason,
      error: state => state.error
    }),
    ...mapState(["sticky_players_list"]),
    has_fullscreen_message() {
      return !!this.loading || (!!this.error && !!this.error.title);
    }
  },

  watch: {
    phase() {
      this.$nextTick(() => window.scrollTo(0, 0));
    }
  },

  components: {
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

  +mobile
    overflow-x: hidden

html.overflow, html.overflow body
  overflow-y: unset

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

      &.is-pulsing
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
      color: $grey-dark

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

  .init-logo
    text-align: center
    margin-bottom: 4rem
    width: 100%

    img
      width: 70%

      +mobile
        width: 90%

  .columns.layout-columns
    +mobile
      display: flex
      flex-direction: column-reverse

  .morel-players-list.is-sticky
    position: sticky
    top: 10px
    z-index: 21
    background-color: white

@keyframes pulse
  0%
    color: $black
  50%
    color: $grey
  100%
    color: $black
</style>
