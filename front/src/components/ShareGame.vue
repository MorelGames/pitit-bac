<template>
  <b-field
    label="Partager la partie"
    message="Invitez les autres joueurs à ouvrir cette adresse dans leur navigateur pour rejoindre cette partie."
    size="is-small"
    class="share-game"
  >
    <b-input
      :value="share_url"
      size="is-small"
      readonly
      @focus="$event.target.select()"
    >
    </b-input>
  </b-field>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: mapState({
    share_url(state) {
      return window.location.origin + "/#" + state.game.slug;
    }
  })
};
</script>

<style lang="sass">
.field.share-game
    label, p.help
        margin-bottom: 0

        position: relative
        left: 2px

        text-align: left
</style>
