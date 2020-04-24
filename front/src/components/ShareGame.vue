<template>
  <section class="share-game">
    <header>
      <h3>Partager la partie</h3>
      <b-tooltip :label="lock_tooltip" position="is-bottom" type="is-light" :class="{'is-static': !master}">
        <b-button
          :icon-left="locked ? 'lock' : 'lock-open'"
          :loading="lock_loading"
          :disabled="!master"
          @click="toggle_lock"
          type="is-text" />
      </b-tooltip>
    </header>
    <b-field grouped size="is-small">
      <b-input
        :value="share_url"
        size="is-small"
        readonly
        expanded
        id="share-url-field"
        @focus="$event.target.select()"
      >
      </b-input>
      <p class="control copy-button">
        <b-tooltip
          :label="copied ? 'Copié !' : 'Copier dans le presse-papier'"
          position="is-bottom"
          type="is-light"
          multilined
        >
          <b-button class="button is-light" icon-left="clipboard" @click.stop.prevent="copy_url" :expanded="true">
            Copier le lien
          </b-button>
        </b-tooltip>
      </p>
    </b-field>
    <p class="share-invite">
      Invitez les autres joueurs à ouvrir cette adresse dans leur navigateur
      pour rejoindre cette partie.
    </p>
  </section>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      copied: false
    };
  },
  computed: {
    ...mapState({
      share_url: state => `${window.location.origin}/${state.game.slug}`,
      locked: state => state.game.locked,
      lock_loading: state => state.game.lock_loading,
      master: state => state.master
    }),
    lock_tooltip() {
      if (this.master) {
        return this.locked ? 'Déverrouiller la partie' : 'Verrouiller la partie';
      } else {
        return this.locked ? 'Partie verrouillée' : 'Partie déverrouillée';
      }
    }
  },
  methods: {
    copy_url() {
      let share_url_field = document.getElementById("share-url-field");
      share_url_field.select();

      try {
        if (document.execCommand("copy")) {
          this.copied = true;
          setTimeout(() => (this.copied = false), 1600);
        }
      } catch (e) {
        console.error("Unable to copy game URL", e);
      }

      share_url_field.blur();
    },

    toggle_lock() {
      if (this.master) {
        this.$store.dispatch("lock_game", !this.locked);
      }
    }
  }
};
</script>

<style lang="sass">
@import "../assets/variables"

.share-game
  +mobile
    margin: 0 1rem 1.5rem

  header
    display: flex
    align-items: center

    h3
      flex: 4

      position: relative
      left: 1px

      font-weight: bold
      margin: 1rem 0 .4rem

    span.b-tooltip
      button.button
        position: relative
        top: 5px

        font-size: .9em
        color: $grey

        &, &:hover, &:active, &:focus
          background: none
          border: none
          box-shadow: none

        &:hover, &:active, &:focus
          color: $grey-dark

        span.icon
          transform: scale(-1, 1)

      &.is-static button.button
        cursor: default

  .field.is-grouped
    position: relative

    margin-bottom: .4em
    align-items: center

    input
      border-color: $grey-light
      border-radius: 4px

      font-size: 0.9rem

      +mobile
        font-size: 0.95rem

    // This element must remain “displayed”, else copy will not work.
    .control:not(.copy-button)
      position: absolute
      margin-left: -999999px

    .control.copy-button
      &, & .b-tooltip
        width: 100%

  .share-invite
    position: relative
    left: 1px

    font-size: .9em
    color: $grey-dark !important
</style>
