<template>
  <b-message :title="master ? 'Configurer la partie' : 'Configuration de la partie'" :closable="false" type="is-primary">
    <section>
      <div class="columns">
        <div class="column is-half">
          <b-field label="Catégories à remplir" :message="master ? 'Écrivez le nom de la catégorie, et tapez “entrée” pour l\'ajouter.' : ''">
            <b-taginput
              v-model="config.categories"
              @input="update_game_configuration"
              placeholder="Ajouter une catégorie…"
              :disabled="!master"
            >
            </b-taginput>
          </b-field>
          <div class="field">
            <b-button type="is-primary is-medium" expanded
              :disabled="!master || !can_start"
              @click="start_game"
              >Démarrer la partie</b-button>
          </div>
        </div>
        <div class="column is-half">
          <b-field
            :label="'Nombre de tours : ' + config.turns"
            class="no-extended-margin-top"
          >
            <b-slider
              size="is-medium"
              :min="1"
              :max="20"
              :tooltip="false"
              :disabled="!master"
              v-model="config.turns"
              @change="update_game_configuration"
            >
              <template v-for="val in [2, 4, 6, 8, 10, 12, 14, 16, 18]">
                <b-slider-tick :value="val" :key="val">{{ val }}</b-slider-tick>
              </template>
            </b-slider>
          </b-field>

          <b-field
            :label="'Durée maximale par tour : ' + actual_time"
          >
            <b-slider
              size="is-medium"
              :min="15"
              :max="infinite_duration"
              :step="5"
              :tooltip="false"
              :disabled="!master"
              v-model="config.time"
              @change="update_game_configuration"
            >
              <template v-for="val in [60, 120, 180, 240, 300, 360, 420, 480, 540]">
                <b-slider-tick :value="val" :key="val">{{ format_seconds(val) }}</b-slider-tick>
              </template>
              <b-slider-tick :value="infinite_duration">&infin;</b-slider-tick>
            </b-slider>
          </b-field>
          <div class="field">
            <b-switch
              :disabled="!master"
              v-model="config.stopOnFirstCompletion"
              @input="update_game_configuration"
            >
              Arrêter chaque tour lorsque que quelqu'un a terminé
            </b-switch>
          </div>
        </div>
      </div>
    </section>
  </b-message>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      infinite_time_value: 600
    }
  },
  computed: {
    ...mapState({
      master: state => state.master,
      infinite_duration: state => state.game.infinite_duration
    }),
    config() {
      return this.$store.state.game.configuration;
    },
    actual_time() {
      return this.$store.getters.is_time_infinite ? "infinie" : this.format_seconds(this.config.time, true)
    },
    can_start() {
      return this.$store.state.game.configuration.categories.length !== 0 && Object.values(this.$store.state.players).length > 1;
    }
  },
  methods: {
    format_seconds(seconds, long) {
      let mm = Math.floor(seconds / 60);
      let ss = seconds - mm * 60;

      return long
        ? ((mm > 0 ? `${mm} minute${mm > 1 ? 's': ''}` : '') + (mm > 0 && ss > 0 ? ' et' : '') + (ss > 0 ? ` ${ss} seconde${ss > 1 ? 's': ''}` : ""))
        : `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
    },

    update_game_configuration() {
      this.$store.dispatch("update_game_configuration", this.config);
    },

    start_game() {
      this.$store.dispatch("ask_start_game");
    }
  }
};
</script>

<style lang="sass">
label.switch span.control-label
  position: relative
  top: 2px

div.column.is-half div.field:not(:first-child):not(.no-extended-margin-top)
  margin-top: 3rem
</style>
