// Builds an empty bracket for 8, 16 or 32 teams.
// For now the size comes from the address, e.g. index.html?size=16
// Later it will come from the challenge in Firestore (bracketSize).

const ALLOWED_SIZES = [8, 16, 32];

// 1 matchup = Final, 2 = Semi-final, otherwise "Round 1/4", "Round 1/8"...
function roundName(matchCount) {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi-final";
  return `Round 1/${matchCount}`;
}

// innerHTML is fine here because the text is fixed.
// When we add real item names, set them with textContent instead.
// showVote = true  -> matchup with a Vote button (default)
// showVote = false -> no Vote button
function makeMatchup(showVote = true) {
  let voteButton = "";

  if (showVote) {
    voteButton = '<button type="button" class="vote-btn" disabled>Vote</button>';
  } else {
    voteButton = "";
  }

  const matchup = document.createElement("div");
  matchup.className = "matchup";
  matchup.innerHTML = `
    <div class="slot">TBD</div>
    <div class="slot">TBD</div>
    ${voteButton}`;
  return matchup;
}

function makeRound(roundNumber, totalRounds, size) {
  const matchCount = size / 2 ** roundNumber;   // matchups in this round, both sides together
  const isFinal = roundNumber === totalRounds;
  const perSide = isFinal ? 1 : matchCount / 2;

  const round = document.createElement("div");
  round.className = "round";
  round.style.setProperty("--span", 2 ** (roundNumber - 1));

  if (roundNumber === 1) round.classList.add("round-first");
  if (roundNumber <= totalRounds - 2) round.classList.add("round-pairs");
  if (roundNumber >= 2 && roundNumber <= totalRounds - 1) round.classList.add("round-in");
  if (roundNumber === totalRounds - 1) round.classList.add("round-semi");
  if (isFinal) round.classList.add("round-final");

  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = roundName(matchCount);
  round.append(label);

  for (let i = 0; i < perSide; i++) {
    if (isFinal) {
      round.append(makeMatchup(false));  // the final: no Vote button
    } else {
      round.append(makeMatchup(true));   // every other round: Vote button
    }
  }
  return round;
}

export function renderBracket(container, size = 8) {
  if (!ALLOWED_SIZES.includes(size)) size = 8;
  const totalRounds = Math.log2(size);   // 8 -> 3, 16 -> 4, 32 -> 5

  const left = document.createElement("div");
  left.className = "bracket-half bracket-left";
  const right = document.createElement("div");
  right.className = "bracket-half bracket-right";

  for (let r = 1; r < totalRounds; r++) {
    left.append(makeRound(r, totalRounds, size));    // round 1 on the far left
    right.prepend(makeRound(r, totalRounds, size));  // round 1 on the far right
  }

  const tree = document.createElement("div");
  tree.className = "bracket-tree";
  tree.append(left, makeRound(totalRounds, totalRounds, size), right);

  const bracket = document.createElement("div");
  bracket.className = "bracket";
  bracket.style.setProperty("--rows", size / 4);   // first-round matchups on one side
  bracket.append(tree);

  container.replaceChildren(bracket);
}

// Draw the bracket on any page that has <div id="bracket-root">
const root = document.getElementById("bracket-root");
if (root) {
  const size = Number(new URLSearchParams(location.search).get("size")) || 8;
  renderBracket(root, size);
}