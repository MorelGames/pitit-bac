<template>
  <nav class="panel">
    <p class="panel-heading">
      {{ players_count }} joueur{{ players_count > 1 ? "s" : "" }}
    </p>
    <a class="panel-block" v-for="(player, i) in sorted_players" :key="i">
      <span class="panel-icon">
        <b-icon
          pack="fas"
          icon="user-alt-slash"
          size="is-small"
          v-if="!player.online"
          key="ready"
        ></b-icon>
        <b-icon
          pack="fas"
          icon="check"
          size="is-small"
          v-else-if="player.ready"
          key="ready"
        ></b-icon>
        <b-icon
          pack="fas"
          icon="hourglass-half"
          size="is-small"
          v-else
          key="not-ready"
        ></b-icon>
      </span>
      <span
        v-bind:class="{
          'is-master': player.master,
          'is-offline': !player.online
        }"
        >{{ player.pseudonym }}</span
      >
      <span class="is-size-7 ourself-mark" v-if="player.ourself">(vous)</span>
    </a>
  </nav>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState({
      players: state => state.players
    }),
    sorted_players() {
      return this.$store.getters.players_list_sorted;
    },
    players_count() {
      return this.$store.getters.players_count;
    }
  }
};
</script>

<style lang="sass" scoped>
.panel
  .panel-heading
    text-align: center
  .panel-block
    .panel-icon
      position: relative
      top: -2px
    .ourself-mark
      display: inline-block
      margin-left: .4em
      padding-top: .3em

    .is-master
      font-weight: bold
    .is-offline
      font-style: italic
</style>
