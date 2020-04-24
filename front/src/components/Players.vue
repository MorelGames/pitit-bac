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

      <div
        class="panel-icon-right control-icon"
        v-if="we_are_master && !player.master && player.online"
        @click="kick_player(player.uuid)"
      >
        <b-tooltip
          label="Expulser ce joueur"
          position="is-bottom"
          type="is-light"
        >
          <b-icon pack="fas" icon="user-alt-slash" size="is-small"></b-icon>
        </b-tooltip>
      </div>

      <div
        class="panel-icon-right control-icon"
        :class="{ 'is-current-master': player.master }"
        v-if="player.master || (we_are_master && player.online)"
        @click="switch_master(player.uuid)"
      >
        <b-tooltip
          :label="player.master ? 'Maître du jeu' : 'Passer maître du jeu'"
          position="is-bottom"
          type="is-light"
        >
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
      our_uuid: state => state.uuid,
      locked: state => state.game.locked
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
        message: `<strong>${player.pseudonym}</strong> pourra gérer la partie, sa configuration, ou relancer une nouvelle partie à la fin. Vous perdrez ces pouvoirs.<br /><br /><span class="has-text-grey">Le maître du jeu ne peut pas influencer les votes ou la partie, uniquement sa configuration ou son relancement. Il ou elle peut également expulser des joueurs et verrouiller la partie.</span>`,
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
    },

    kick_player(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return;
      let player = this.players[uuid];
      if (!player || !player.online) return;

      this.$buefy.dialog.confirm({
        title: `Expulser ${player.pseudonym} ?`,
        message: this.locked
          ? `<strong>${player.pseudonym}</strong> ne pourra pas se reconnecter tant que la partie est verrouillée.<br /><br /><span class="has-text-grey">Pour déverrouiller la partie, utilisez l'icône cadenas, sous la liste des joueurs.</span>`
          : `<strong>${player.pseudonym}</strong> quittera la partie, mais pourra toujours se reconnecter, car la partie n'est pas verrouillée.<br /><br /><span class="has-text-grey">Vous pouvez verrouiller la partie grâce à l'icône cadenas, sous la liste des joueurs.</span>`,
        confirmText: "Expulser",
        cancelText: "J'ai changé d'avis",

        type: "is-danger",
        hasIcon: true,
        iconPack: "fas",
        icon: "user-alt-slash",

        onConfirm: () => {
          this.$store.dispatch("kick_player", uuid);
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

    .control-icon
      display: none
      color: $grey
      cursor: pointer

      &.is-current-master
        display: block
        color: $grey-light
        cursor: normal

      + .control-icon
        margin-left: .8em

    &:hover .control-icon
      display: block

.dialog.modal .media-content p span
  font-weight: normal
</style>
