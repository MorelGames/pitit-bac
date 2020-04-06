const should = require('should');

const commons = require("./index");

const is_answer_valid = commons.is_answer_valid;
const is_answer_accepted = commons.is_answer_accepted;
const compare_answers = commons.compare_answers;

describe("Answers validity", () => {
  context("when the letter is correct", () => {
    it("should accept the answer with the exact letter", () => {
      is_answer_valid("E", "Espagne").should.be.true();
    });

    it("should accept the answer with the exact letter regardless of spaces", () => {
      is_answer_valid("E", "    Espagne   ").should.be.true();
    });

    it("should accept the answer with the exact letter regardless of case", () => {
      is_answer_valid("E", "espaaaace").should.be.true();
      is_answer_valid("e", "Espaaaace").should.be.true();
    });

    it("should accept the answer with the exact letter regardless of case and spaces", () => {
      is_answer_valid("E", "      espaaaace").should.be.true();
      is_answer_valid("e", "  Espaaaace ").should.be.true();
    });

    it("should accept the answer with an altered letter (e.g. with accents)", () => {
      is_answer_valid("E", "Étudiant").should.be.true();
      is_answer_valid("E", "Ève").should.be.true();
      is_answer_valid("E", "Êta").should.be.true();
    });

    it("should accept the answer with an altered letter regardless of spaces", () => {
      is_answer_valid("E", "   Étudiant     ").should.be.true();
      is_answer_valid("E", "    Ève  ").should.be.true();
      is_answer_valid("E", "    Êta  ").should.be.true();
    });

    it("should accept the answer with an altered letter regardless of case", () => {
      is_answer_valid("E", "étudiant").should.be.true();
      is_answer_valid("e", "Êta").should.be.true();
    });

    it("should accept the answer with an altered letter regardless of case and spaces", () => {
      is_answer_valid("E", "      énergéticien").should.be.true();
      is_answer_valid("e", "  Électroencéphalogramme ").should.be.true();
    });

    it("should accept answers prefixed with special chars, ignoring them if they have no letter equivalents", () => {
      is_answer_valid("R", "#RestezChezVous").should.be.true();
    });

    it("should accept answers prefixed with special chars, using them if they have a letter equivalent", () => {
      is_answer_valid("E", "€12").should.be.true();
    });
  });

  context("when the letter is incorrect", () => {
    it("should not accept the answer if it is empty", () => {
      is_answer_valid("K", "").should.be.false();
    });

    it("should not accept the answer if the letter is wrong", () => {
      is_answer_valid("F", "Espagne").should.be.false();
      is_answer_valid("K", "Espagne").should.be.false();
    });

    it("should not accept the answer if the letter is wrong, regardless of spaces", () => {
      is_answer_valid("G", "    Espagne   ").should.be.false();
    });

    it("should not accept the answer if the letter is wrong, regardless of case", () => {
      is_answer_valid("G", "espaaaace").should.be.false();
      is_answer_valid("p", "Espaaaace").should.be.false();
    });

    it("should not accept the answer if the letter is wrong, regardless of case and spaces", () => {
      is_answer_valid("M", "      espaaaace").should.be.false();
      is_answer_valid("k", "  Espaaaace ").should.be.false();
    });

    it("should not accept the answer beginning with an altered letter (e.g. with accents) if this altered letter does not match the letter", () => {
      is_answer_valid("P", "Étudiant").should.be.false();
      is_answer_valid("M", "Ève").should.be.false();
      is_answer_valid("I", "Êta").should.be.false();
    });

    it("should not accept the answer with an altered letter if this altered letter does not match the letter, regardless of spaces", () => {
      is_answer_valid("U", "   Étudiant     ").should.be.false();
      is_answer_valid("T", "    Ève  ").should.be.false();
      is_answer_valid("E", "    À gauche  ").should.be.false();
    });

    it("should not accept the answer with an altered letter if this altered letter does not match the letter, regardless of case", () => {
      is_answer_valid("P", "étudiant").should.be.false();
      is_answer_valid("I", "Êta").should.be.false();
    });

    it("should not accept the answer with an altered letter if this altered letter does not match the letter, regardless of case and spaces", () => {
      is_answer_valid("F", "      énergéticien").should.be.false();
      is_answer_valid("u", "  Électroencéphalogramme ").should.be.false();
    });

    it("should not accept answers prefixed with special chars, ignoring them if they have no letter equivalents, if the base letter is wrong", () => {
      is_answer_valid("S", "#RestezChezVous").should.be.false();
    });

    it("should not accept answers prefixed with special chars, using them if they have a letter equivalent, if they does not match the letter", () => {
      is_answer_valid("W", "€12").should.be.false();
    });
  });

  context("when we have some edge-cases", () => {
    it("should not accept the answer if the letter is empty", () => {
      is_answer_valid("", "Anything here").should.be.false();
    });

    it("should accept the answer if both answers and letters are empty", () => {
      is_answer_valid("", "").should.be.true();
    });

    it("should throw an error if either the letter or the answer are null or undefined", () => {
      should(() => is_answer_valid(null, null)).throw("is_answer_valid: string arguments expected");
      should(() => is_answer_valid(null, undefined)).throw("is_answer_valid: string arguments expected");
      should(() => is_answer_valid(undefined, null)).throw("is_answer_valid: string arguments expected");
      should(() => is_answer_valid(undefined, undefined)).throw("is_answer_valid: string arguments expected");
    });
  });
});

/**
 * Generates an object with the correct format for is_answer_accepted from
 * the votes we want inside it, creating dummy incremented keys in the object
 * as they are not used by the function anyway.
 */
function votes(...votes) {
  let votes_object = {};
  let i = 0;

  votes.forEach(vote => votes_object[(i++).toString] = vote);
  return votes_object;
}

describe("Answers acceptance", () => {
  it("shoud accept answer with all positives votes", () => {
    is_answer_accepted(votes(true, true, true, true, true, true)).should.be.true();
  });
  it("shoud refuse answer with all negative votes", () => {
    is_answer_accepted(votes(false, false, false, false, false, false)).should.be.false();
  });
  it("should accept answer with a majority of votes", () => {
    is_answer_accepted(votes(true, true, true, false, false, false, true)).should.be.true();
  });
  it("should refuse answer with a majority of negative votes", () => {
    is_answer_accepted(votes(true, true, false, false, false, true, false)).should.be.false();
  });
  it("should refuse answer in case of equality", () => {
    is_answer_accepted(votes(true, true, true, false, false, false)).should.be.false();
  })
});

describe("Answers comparison", () => {
  it("should say equal for equal strings", () => {
    compare_answers("Space", "Space").should.be.true();
    compare_answers("Espagnolette", "Espagnolette").should.be.true();
  });
  it("should say equal for equal strings with different spacing around", () => {
    compare_answers("Isabelle", "Isabelle  ").should.be.true();
    compare_answers("Isabelle", " Isabelle  ").should.be.true();
    compare_answers(" Isabelle", "Isabelle  ").should.be.true();
    compare_answers("Isabelle ", "  Isabelle  ").should.be.true();
    compare_answers(" Isabelle", "Isabelle  ").should.be.true();
    compare_answers("Isabelle    ", "Isabelle").should.be.true();
  });
  it("should say equal for equal strings with different capitalization", () => {
    compare_answers("ESA", "esa").should.be.true();
    compare_answers("the last jeudi", "The Last Jeudi").should.be.true();
    compare_answers("LaTeX", "lATEX").should.be.true();
  });
  it("should say equal for equal strings with different capitalization and spacing", () => {
    compare_answers("Un orphelinat", " un orphelinat    ").should.be.true();
    compare_answers("  une TASSE de THÉ", "Une tasse de thé ").should.be.true();
  });
  it("should say equal for equal strings with different spacing inside them", () => {
    compare_answers("Animal Crossing", "Animal   Crossing").should.be.true();
    compare_answers("Animal Crossing", "Animal Crossing").should.be.true();  // second is a no-break space
    compare_answers("Animal Crossing", "Animal Crossing").should.be.true();  // first is a tabulation
  });
  it("should say different for different strings", () => {
    compare_answers("ESA", "Roscosmos").should.be.false();
  });
  it("should say different for almost equal strings with different accents", () => {
    compare_answers("Tue", "Tué").should.be.false();
    compare_answers("Thé à la tablée", "The a la tablee").should.be.false();
  });
});
