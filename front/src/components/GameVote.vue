<template>
  <section>
    <b-notification :active="true" :closable="false" class="votes-header">
      <div class="columns votes-header-column">
        <div class="column is-9">
          <p class="content">
            Voici les propositions de tout le monde pour la lettre
            <strong>{{ letter }}</strong
            >.<br />
            Sont-elles acceptables&nbsp;? À vous de juger&nbsp;!
            <strong>Décochez</strong> toutes les cases des propositions que vous
            jugez comme étant à rejeter. Quand vous avez terminé, validez avec
            le bouton ci-contre.
          </p>
        </div>
        <div class="column is-3">
          <div class="field">
            <b-button
              type="is-primary is-medium"
              expanded
              :disabled="ready"
              @click.once="vote_ready"
            >
              <span v-if="ready">Patientez…</span>
              <span v-else>J'ai terminé !</span>
            </b-button>
          </div>
        </div>
      </div>
    </b-notification>

    <b-notification
      type="is-primary"
      class="interrupted-by"
      :active="true"
      :closable="false"
      v-if="interrupted && interrupted_by"
    >
      Le tour a été interrompu par <strong>{{ interrupted_by }}</strong
      >, qui a été plus rapide que les autres !
    </b-notification>

    <b-notification
      type="is-dark"
      :active="true"
      :closable="false"
      v-if="categories.length === 0"
    >
      Il semblerait qu'aucun joueur n'ait répondu pendant cette manche… Il n'y a
      donc rien à voter. Cliquez sur « J'ai terminé » pour passer au prochain
      tour.
    </b-notification>

    <div class="all-answers">
      <article
        class="box category-answers"
        v-for="(category, i) in categories"
        :key="i"
      >
        <h3 class="title is-4">{{ category }}</h3>

        <div
          class="level"
          v-for="(answer, j) in answers_in_category(category)"
          :key="j"
        >
          <div class="level-left">
            <div
              class="media answer"
              :class="{
                'is-invalid':
                  !answer_accepted(category, answer.uuid) ||
                  (!answer.answer.valid && answer.answer.text),
                'is-empty': !answer.answer.text
              }"
            >
              <div class="media-left answer-checkbox">
                <b-checkbox
                  size="is-medium"
                  :value="own_vote(category, answer.uuid)"
                  :disabled="!answer.answer.valid"
                  @input="toggle_vote(category, answer.uuid)"
                ></b-checkbox>
              </div>
              <div class="media-content">
                <p class="answer-text">
                  {{
                    answer.answer.text ? answer.answer.text : "(pas de réponse)"
                  }}
                </p>
                <ul class="answer-meta">
                  <li>{{ answer.author.pseudonym }}</li>
                  <li v-if="answer.answer.valid">
                    <b-tooltip
                      :label="
                        `Rechercher « ${answer.answer.text} » sur un moteur de recherche (dans un nouvel onglet)`
                      "
                      position="is-bottom"
                      type="is-light"
                      animated
                      multilined
                    >
                      <a
                        :href="search_url(category, answer.answer.text)"
                        target="search_engine"
                        >Rechercher</a
                      >
                    </b-tooltip>
                  </li>
                  <li v-if="!answer.answer.valid">Proposition invalide</li>
                  <li
                    v-else-if="!answer_accepted(category, answer.author.uuid)"
                  >
                    Refusé par la majorité
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="level-right">
            <div v-for="(vote, k) in answer.votes" :key="k">
              <div class="block">
                <b-tooltip :label="vote.voter.pseudonym">
                  <b-icon icon="check" v-if="vote.vote"></b-icon>
                  <b-icon icon="times" v-else></b-icon>
                </b-tooltip>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <b-notification
      :active="true"
      :closable="false"
      class="mobile-bottom-submit-button"
    >
      <div class="field">
        <b-button
          type="is-primary is-medium"
          expanded
          :disabled="ready"
          @click.once="vote_ready"
        >
          <span v-if="ready">Patientez…</span>
          <span v-else>J'ai terminé !</span>
        </b-button>
      </div>
    </b-notification>
  </section>
</template>

<script>
import { is_answer_accepted } from "ptitbac-commons";
import { mapState } from "vuex";

export default {
  data() {
    return {
      ready: false
    };
  },
  computed: {
    ...mapState({
      letter: state => state.game.current_round.letter,
      votes: state => state.game.current_round.votes,
      players: state => state.players,
      own_uuid: state => state.uuid,
      interrupted: state => state.game.configuration.stopOnFirstCompletion,
      interrupted_by: state => {
        let interrupter =
          state.players[state.game.current_round.interrupted_by];
        return interrupter ? interrupter.pseudonym : null;
      },
      search_engine: state => state.search_engine
    }),
    categories() {
      return Object.keys(this.votes);
    }
  },
  methods: {
    answers_in_category(category) {
      let answers = [];

      Object.keys(this.votes[category]).forEach(uuid => {
        let votes = [];

        Object.keys(this.votes[category][uuid].votes).forEach(voter_uuid => {
          votes.push({
            voter: this.players[voter_uuid],
            vote: this.votes[category][uuid].votes[voter_uuid]
          });
        });

        answers.push({
          uuid: uuid,
          answer: {
            text: this.votes[category][uuid].answer,
            valid: this.votes[category][uuid].valid
          },
          votes: votes,
          author: this.players[uuid]
        });
      });

      return answers;
    },

    answer_accepted(category, uuid) {
      return is_answer_accepted(this.votes[category][uuid].votes);
    },

    own_vote(category, uuid) {
      return this.votes[category][uuid].votes[this.own_uuid];
    },

    toggle_vote(category, uuid) {
      this.$store.dispatch("send_vote_update", {
        voter: {
          uuid: this.own_uuid
        },
        vote: {
          uuid: uuid,
          category: category,
          vote: !this.own_vote(category, uuid)
        }
      });
    },

    vote_ready() {
      this.$store.dispatch("vote_ready");
      this.ready = true;
    },

    search_url(category, text) {
      return this.search_engine.replace("{s}", category + " " + text);
    }
  },

  mounted() {
    // For the position: sticky to work, there must not be ANY overflow: hidden
    // in all parents of the sticky element, up to `<html>`. We do have a
    // overflow: hidden on `<html>` and `<body>`; this disables the CSS rule
    // for this screen only, so the sticky banner actually sticks.
    document.getElementsByTagName("html")[0].classList.add("overflow");
  },

  beforeDestroy() {
    document.getElementsByTagName("html")[0].classList.remove("overflow");
  }
};
</script>

<style lang="sass">
@import "~bulma/sass/utilities/_all"

.notification.votes-header
  position: sticky !important
  top: 10px

  z-index: 40

  +mobile
    border-radius: 0
    position: relative !important

  .media-content
    overflow: hidden

  .votes-header-column
    align-items: center

    p.content
      text-align: justify

.notification.interrupted-by
  +mobile
    border-radius: 0

.all-answers
  display: flex
  flex-direction: column
  align-items: center


  article.category-answers
    width: 99%
    text-align: left

    +mobile
      width: 100%
      border-radius: 0

    // Avoids long answers to overflow
    .level-left
      flex: 2

    .answer
      .answer-checkbox
        padding-top: .2em
      .media-content
        overflow: hidden
      .answer-text
        padding-right: 1em
        font-size: 1.2em
        text-align: justify
        +mobile
          padding-right: 0

      ul.answer-meta
        font-size: .9em
        padding-left: .1em

        li
          display: inline-block

          &:not(:first-child)
            margin-left: .8em

            &:before
              content: "•"
              position: relative
              left: -.4em

          a
            color: $text

      &.is-invalid .answer-text
        color: $grey
        text-decoration: line-through
      &.is-empty .answer-text
        color: $grey-light
        font-style: italic

    .level-right
      +mobile
        display: flex
        flex-direction: row
        align-items: center

        margin-top: .4rem

.notification.mobile-bottom-submit-button
  +tablet
    display: none

  margin-top: 1.5rem
</style>
