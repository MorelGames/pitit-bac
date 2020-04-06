const slugify = require("slugify");

/**
 * Checks if an answer is valid, according to the required first letter.
 * Accents and such will be normalized.
 *
 * @param {string} letter The required first letter.
 * @param {string} answer The user's answer.
 *
 * @return true if the answer is valid.
 */
exports.is_answer_valid = function(letter, answer) {
  try {
    return slugify(answer, {lower: true})[0] === slugify(letter, {lower: true})[0];
  }
  catch (e) {
    throw new Error("is_answer_valid: string arguments expected");
  }
}

/**
 * From a given set of votes, checks if it is accepted by the majority.
 *
 * @param {object} votes The votes, as an object uuid => vote (boolean).
 * @return true if the answer is accepted by the majority.
 */
exports.is_answer_accepted = function(votes) {
  let bools_votes = Object.values(votes);
  return (bools_votes.filter(vote => vote).length / bools_votes.length) > .5;
}

function normalize_answer(answer) {
  return answer ? answer.toLowerCase().trim().replace(/\s+/, ' ') : null;
}

exports.compare_answers = function(answer1, answer2) {
  return normalize_answer(answer1) === normalize_answer(answer2);
}
