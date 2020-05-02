<template>
  <section>
    <b-notification :active="true" :closable="false" class="votes-header">
      <div class="columns votes-header-column">
        <div class="column is-9">
          <i18n
            path="Here are everyone's proposals for the letter {letter}."
            tag="p"
            class="content"
          >
            <strong slot="letter">{{ letter }}</strong>
          </i18n>
          <p class="content">
            {{ $t("Are they acceptable? You'll be the judge!") }}
            {{
              $t(
                "Uncheck all the boxes against the proposals you refuse. Then, validate with the finish button."
              )
            }}
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
              <span v-if="ready" v-t="'Please wait…'" />
              <span v-else v-t="'I finished!'" />
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
      <i18n
        path="The round was interrupted by {name}, who was faster than the others!"
      >
        <strong slot="name">{{ interrupted_by }}</strong>
      </i18n>
    </b-notification>

    <b-notification
      type="is-dark"
      :active="true"
      :closable="false"
      v-if="categories.length === 0"
    >
      {{
        $t(
          "It looks like no one answered anything during this round… So there is nothing to vote. Please click “I finished!” to start the next round."
        )
      }}
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
          :class="{ 'has-lots-of-votes': answer.votes.length > 10 }"
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
                    answer.answer.text ? answer.answer.text : $t("(no answer)")
                  }}
                </p>
                <ul class="answer-meta">
                  <li>{{ answer.author.pseudonym }}</li>
                  <li v-if="answer.answer.valid">
                    <b-tooltip
                      :label="
                        $t(
                          'Search “{term}” on a search engine (in a new tab)',
                          { term: answer.answer.text }
                        )
                      "
                      position="is-bottom"
                      type="is-light"
                      multilined
                    >
                      <a
                        :href="search_url(category, answer.answer.text)"
                        target="search_engine"
                        >{{ $t("Search") }}</a
                      >
                    </b-tooltip>
                  </li>
                  <li v-if="!answer.answer.valid" v-t="'Invalid answer'" />
                  <li
                    v-else-if="!answer_accepted(category, answer.author.uuid)"
                    v-t="'Rejected by a majority of players'"
                  />
                </ul>
              </div>
            </div>
          </div>
          <div class="level-right">
            <div v-for="(vote, k) in answer.votes" :key="k">
              <div class="block">
                <b-tooltip :label="vote.voter.pseudonym">
                  <b-icon
                    icon="check"
                    v-if="vote.vote"
                    :aria-label="
                      $t('{name} voted for this answer', {
                        name: vote.voter.pseudonym
                      })
                    "
                  />
                  <b-icon
                    icon="times"
                    v-else
                    :aria-label="
                      $t('{name} voted against this answer', {
                        name: vote.voter.pseudonym
                      })
                    "
                  />
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
          <span v-if="ready" v-t="'Please wait…'" />
          <span v-else v-t="'I finished!'" />
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
      players: state => state.morel.players,
      own_uuid: state => state.morel.uuid,
      interrupted: state => state.morel.configuration.stopOnFirstCompletion,
      interrupted_by: state => {
        let interrupter =
          state.morel.players[state.game.current_round.interrupted_by];
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

        votes.sort((a, b) =>
          a.voter.pseudonym
            .toLowerCase()
            .localeCompare(b.voter.pseudonym.toLowerCase())
        );

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

      answers.sort((a, b) =>
        a.author.pseudonym
          .toLowerCase()
          .localeCompare(b.author.pseudonym.toLowerCase())
      );

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
      margin-bottom: 0
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

    .level.has-lots-of-votes
      flex-direction: column
      align-items: flex-start

      .level-right
        align-self: end

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
