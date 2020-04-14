<template>
  <nav class="panel players-list">
    <div class="panel-block" v-for="(player, i) in sorted_players" :key="i">
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
      <div class="panel-block-main">
        <span
          v-bind:class="{
            'is-offline': !player.online
          }"
          >{{ player.pseudonym }}</span
        >
        <span class="is-size-7 ourself-mark" v-if="player.ourself">(vous)</span>
      </div>
      <div class="panel-icon-right master-icon" :class="{'is-current-master': player.master}" v-if="player.master || (we_are_master && player.online)" @click="switch_master(player.uuid)">
        <b-tooltip :label="player.master ? 'Maître du jeu' : 'Passer maître du jeu'" position="is-bottom" type="is-light">
          <b-icon pack="fas" icon="user-shield" size="is-small"></b-icon>
        </b-tooltip>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState({
      players: state => state.players,
      we_are_master: state => state.master,
      our_uuid: state => state.uuid
    }),
    sorted_players() {
      return this.$store.getters.players_list_sorted;
    },
    players_count() {
      return this.$store.getters.players_count;
    }
  },
  methods: {
    switch_master(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return;
      let player = this.players[uuid];
      if (!player || !player.online) return;

      this.$buefy.dialog.confirm({
        title: `Donner le pouvoir à ${player.pseudonym} ?`,
        message: `<strong>${player.pseudonym}</strong> pourra gérer la partie, sa configuration, ou relancer une nouvelle partie à la fin. Vous perdrez ces pouvoirs.<br /><br /><span class="has-text-grey">Le maître du jeu ne peut pas influencer les votes ou la partie, uniquement sa configuration ou son relancement.</span>`,
        confirmText: "Donner le pouvoir",
        cancelText: "Garder le pouvoir à soi",

        type: "is-primary",
        hasIcon: true,
        iconPack: "fas",
        icon: "user-shield",

        onConfirm: () => {
          this.$store.dispatch("switch_master", uuid);
        }
      });
    }
  }
};
</script>

<style lang="sass">
@import "../assets/variables"

.panel.players-list
  border-radius: 5px

  +mobile
    margin-left: 1rem
    margin-right: 1rem

  .panel-block
    align-items: center

    &:first-child
      border-top-left-radius: 4px
      border-top-right-radius: 4px

    &:last-child
      border-bottom-left-radius: 4px
      border-bottom-right-radius: 4px

    .panel-icon, .panel-icon-right
      display: inline-block
      position: relative
      top: -2px

      width: 1em
      height: 1em

    .panel-block-main
      flex: 2

    .ourself-mark
      display: inline-block
      margin-left: .4em
      padding-top: .3em

    .is-master
      font-weight: bold
    .is-offline
      font-style: italic

    .master-icon
      display: none
      color: $grey
      cursor: pointer

      &.is-current-master
        display: block
        color: $grey-light
        cursor: normal

    &:hover .master-icon
      display: block

.dialog.modal .media-content p span
  font-weight: normal
</style>
