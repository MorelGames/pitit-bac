<template>
  <div id="app">
    <b-loading :is-full-page="true" :active="!!loading" :can-cancel="false">
      <p v-html="loading_title"></p>
      <p class="loading-subtitle" v-if="loading_subtitle" v-html="loading_subtitle"></p>
    </b-loading>
    <div
      class="container"
      :class="{ 'is-loading': !!loading }"
      v-if="state != 'PSEUDONYM'"
    >
      <div class="columns">
        <div class="column is-3">
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
    <div v-else :class="{ 'is-loading': !!loading }">
      <div class="columns">
        <div class="column is-half is-offset-3">
          <AskPseudonym></AskPseudonym>
        </div>
      </div>
    </div>
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
      return typeof this.loading === "string" ? this.loading : this.loading.title
    },

    loading_subtitle() {
      if (!this.loading) return null;
      return typeof this.loading === "string" ? null : this.loading.subtitle
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
#app
  font-family: "Fira Sans", Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  // text-align: center
  color: #2c3e50
  margin-top: 60px

  .loading-overlay
    flex-direction: column

    padding: 1em 20%

    %mobile
      padding: 1em

    p
      font-size: 2.8em
      font-weight: 200

      text-align: center

      animation: pulse 2s infinite

      strong
        font-weight: 400

      &.loading-subtitle
        margin-top: 2em
        font-size: 1.8em
        animation: none

  .container
    &.is-loading
      filter: blur(4px)

@keyframes pulse
  0%
    color: $black
  50%
    color: $grey
  100%
    color: $black
</style>
