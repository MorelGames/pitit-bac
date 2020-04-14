<template>
  <section class="end-screen">
    <section class="hero is-medium is-primary is-bold is-winners-frame">
      <div class="hero-body">
        <div class="container">
          <div class="title winner first-winner">
            <b-icon icon="award"></b-icon>
            <p class="winner-names">{{ firsts }}</p>
            <p class="rank">
              <span v-if="firsts_count === 1"
                >Vainqueur ⋅ {{ firsts_points }}</span
              >
              <span v-else>Vainqueurs ⋅ {{ firsts_points }}</span>
            </p>
          </div>
          <div
            class="subtitle second-and-third-winners"
            v-if="seconds_count > 0 || thirds_count > 0"
          >
            <div class="columns">
              <div
                class="column is-4 winer second-winner"
                :class="{ 'is-offset-4': thirds_count === 0 }"
              >
                <article class="winner second-winner" v-if="seconds_count > 0">
                  <p class="winner-names">{{ seconds }}</p>
                  <p class="rank">
                    <span v-if="seconds_count < 2"
                      >Deuxième ⋅ {{ seconds_points }}</span
                    >
                    <span v-else>Deuxièmes ⋅ {{ seconds_points }}</span>
                  </p>
                </article>
              </div>
              <div class="column is-4 is-offset-4 winner third-winner">
                <article class="winner third-winner" v-if="thirds_count > 0">
                  <p class="winner-names">{{ thirds }}</p>
                  <p class="rank">
                    <span v-if="thirds_count < 2"
                      >Troisième ⋅ {{ thirds_points }}</span
                    >
                    <span v-else>Troisièmes ⋅ {{ thirds_points }}</span>
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <b-notification
      :active="master"
      :closable="false"
      class="restart-game-banner"
    >
      <div class="columns restart-game-columns">
        <div class="column is-9">
          <p class="content">
            <strong>Vous voulez recommencer ?</strong><br />
            Cliquez sur le bouton ci-contre pour retourner avec tous les joueurs
            à l'écran de configuration, et relancer la partie.
          </p>
        </div>
        <div class="column is-3">
          <div class="field">
            <b-button
              type="is-primary is-medium"
              expanded
              :disabled="false"
              @click.once="restart_game"
            >
              Nouvelle partie
            </b-button>
          </div>
        </div>
      </div>
    </b-notification>

    <article class="box all-scores">
      <div class="level is-mobile" v-for="(score, i) in scores" :key="i">
        <div class="level-left">
          <div class="columns is-rank-and-pseudonym is-mobile">
            <div class="column is-3 is-rank">
              {{ score.rank }}<sup>{{ score.rank === 1 ? "er" : "ème" }}</sup>
            </div>
            <div class="column is-9 is-pseudonym">
              {{ (players[score.uuid] || { pseudonym: "Pifra" }).pseudonym }}
            </div>
          </div>
        </div>
        <div class="level-right">
          <p class="is-score">
            <span>{{ score.score }}</span> point{{ score.score > 1 ? "s" : "" }}
          </p>
        </div>
      </div>
    </article>
  </section>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState({
      scores: state => state.game.scores,
      players: state => state.players,
      master: state => state.master
    }),
    firsts() {
      return this.nth_winners(1);
    },
    firsts_count() {
      return this.nth_winners_count(1);
    },
    firsts_points() {
      return this.nth_winners_points(1);
    },
    seconds() {
      return this.nth_winners(2);
    },
    seconds_count() {
      return this.nth_winners_count(2);
    },
    seconds_points() {
      return this.nth_winners_points(2);
    },
    thirds() {
      return this.nth_winners(3);
    },
    thirds_count() {
      return this.nth_winners_count(3);
    },
    thirds_points() {
      return this.nth_winners_points(3);
    }
  },
  methods: {
    array_to_string(array) {
      if (array.length === 0) {
        return "N/A";
      } else if (array.length === 1) {
        return array[0].trim();
      } else {
        let last = array.pop();
        return (array.join(", ") + " et " + last).trim();
      }
    },
    nth_winners(n) {
      return this.array_to_string(
        this.scores
          .filter(score => score.rank === n)
          .map(
            score =>
              (this.players[score.uuid] || { pseudonym: "Pifra" }).pseudonym
          )
      );
    },
    nth_winners_count(n) {
      return this.scores.filter(score => score.rank === n).length;
    },
    nth_winners_points(n) {
      let nth_scores = this.scores.filter(score => score.rank === n);
      console.log(nth_scores, this.scores, "yes");
      if (nth_scores && nth_scores.length > 0) {
        let points = nth_scores[0].score;
        return points + " point" + (points > 1 ? "s" : "");
      } else return "";
    },
    restart_game() {
      this.$store.dispatch("ask_restart_game");
    }
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

.end-screen
  display: flex
  flex-direction: column
  align-items: center

  .hero.is-winners-frame
    width: 100%
    border-radius: 6px
    text-align: center

    animation: fadein 1s 1

    +mobile
      border-radius: 0

    .hero-body
      padding: 4rem 1rem

    .winner
      .winner-names
        padding: 1rem 0
        font-size: 1.2em

      .rank
        font-size: .66em
        font-weight: normal
        font-variant: all-small-caps

      .icon svg
        width: 3rem
        height: 3rem

    .second-and-third-winners
      margin-top: 4rem

    .first-winner
      font-size: 2rem
    .second-winner
      font-size: 1.8rem
    .third-winner
      font-size: 1.6rem

  .restart-game-banner
    margin-top: 2rem

    .restart-game-columns
      align-items: center

  .all-scores
    margin-top: 6rem
    width: 60%

    +mobile
      width: 100%

    .level-left
      flex: 2

      .is-rank-and-pseudonym
        align-items: center
        width: 100%

        .is-rank
          flex: 1

          font-size: 2.2em
          font-weight: 200
          text-align: center

        .is-pseudonym
          font-size: 1.5em
          //font-weight: 200

    .level-right
      .is-score
        font-size: 1.4em
        span
          font-weight: bold

@keyframes fadein
  0%
    opacity: 0
    transform: translateY(20px)
  100%
    opacity: 1
    transform: translateY(0)

</style>
