# Rounds: How a Round Closes and Winners Move On

Every 15 minutes, a function checks the open challenges. When a round's time is over, it picks the winners(according to votes) and moves them into the next round.

## The files

| File | Job |
|---|---|
| `backend/functions/index.js` | The scheduled function `closeRounds` |
| `backend/functions/rounds.js` | The logic: pick winners, move them, close the round |

The flow:

```
Cloud Scheduler (every 15 min) -> closeRounds (index.js)
  -> for each open challenge: closeRound (rounds.js)
```

---

# Part 1: rounds.js

## decideWinner(matchup)

Returns `"A"` or `"B"`.

1. If one slot is empty, the other side wins. This is a safety net.
2. More votes wins.
3. A tie with votes: the side with the **earlier** `lastVoteAt` wins. It reached the tied count first.
4. 0 to 0: random.

Notes:
- `votesA` and `votesB` are copied into local variables. A missing number counts as 0.
- `matchup.votesA` is the saved data. The local variable is only our copy.

## nextSlot(matchup)

Says where a winner goes.

- Round: `round + 1`
- Position: `Math.floor(position / 2)`
- Slot: `itemA` if the position is even, `itemB` if odd

```
Round 1                Round 2
position 0 --itemA-->  position 0
position 1 --itemB-->
position 2 --itemA-->  position 1
position 3 --itemB-->
```

- `%` gives the rest of a division. `position % 2` is 0 for even, 1 for odd.

## closeRound(db, challengeId)

Closes the active round of **one** challenge. It runs in a **transaction**.

Transaction rules:
- All **reads** happen first. All **writes** happen last.
- If anything fails, **nothing** is saved.
- If another run changes the data first, Firestore retries with the new data.

### Step 1: reads and early exits

The function reads the challenge, then stops quietly (`return`) if:

| Check | Why |
|---|---|
| The challenge does not exist | Nothing to do |
| `status` is not `"open"` | Already finished |
| `currentRound` is not a number | Old challenge from the Start Challenge page |
| `bracketSize` is not a number | Bad data |
| `roundEndsAt` is missing | Bad data |
| `roundEndsAt` is in the future | The round is not over yet |

Then it reads:
- The matchups of the **current** round
- The matchups of the **next** round (skipped for the final)

"Read" means getting data out of the database so the code can look at it.

### Step 2: decide the winners (no database calls)

For each matchup of the round:
- If it already has a `winnerId`, keep that winner. `alreadyDecided` is `true`.
- If not, call `decideWinner` and take that side's item.
- If there is no item at all, throw an error.

The results go into a list: the matchup, the winning item, and `alreadyDecided`.

### Step 3: writes

1. **Save `winnerId`** on every matchup that did not have one.
2. **If this was the final:** set the challenge to `status: "finished"`, save the `winner` and `finishedAt`, and return `"finished"`.
3. **Otherwise, move each winner into the next round:**
   - Ask `nextSlot` where it goes.
   - Search the next round's matchups for that position.
   - Check it was found. If not, throw an error and save nothing.
   - Put the winner into `itemA` or `itemB`.
4. **Move the challenge forward:** `currentRound + 1`, and a new `roundEndsAt`. Return `"advanced"`.

### The new end time

```javascript
newEndTime = oldEndTime + 24 hours
```

- It starts from the **old** end time, not from "now".
- A late run does not push every later round later. Each round keeps a steady 24-hour schedule.

### What it returns

| Return | Meaning |
|---|---|
| `"advanced"` | The round ended, the challenge goes on |
| `"finished"` | The final ended, the challenge is over |
| nothing | There was nothing to do |

An 8-team challenge gives two `"advanced"` and one `"finished"`.

### Safe to run twice

- After the first run, `currentRound` is higher, and `roundEndsAt` is in the future.
- The second run sees the round is not over, and does nothing.

---

# Part 2: index.js

```javascript
exports.closeRounds = onSchedule(
  { schedule: "*/15 * * * *", timeoutSeconds: 120 },
  async () => { ... }
);
```

- `"*/15 * * * *"` is a cron time: every 15 minutes.
- A round can end up to 15 minutes late.
- `timeoutSeconds: 120` gives it 2 minutes.

Inside:
1. Read every challenge where `status == "open"`.
2. For each one, call `closeRound` inside a `try`.
3. Log `Round closed, next round started` or `Challenge finished` when something happened. Stay quiet when nothing happened.
4. If one challenge fails, log the error and continue with the others.

### Logging an error

```javascript
logger.error("Could not close the round " + doc.id, error);
```

- Pass the error object itself. The reason shows up in the log.
- A log field named `message` gets replaced by the logger. Use another name, like `reason`, if you add your own fields.


# Costs

- About 96 runs a day. About 2 reads for each open challenge in each run, so a few hundred reads a day.
- It is the 2nd of our 3 free Cloud Scheduler jobs.
- Viewers cost more reads than this function, because each open page reads every change.

---


## Words to know

| Word | Meaning |
|---|---|
| Transaction | Reads first, writes last. All saved, or nothing |
| Read | Get data out of the database |
| Write | Save or change data |
| Cron | A short way to write a schedule: `*/15 * * * *` |
| Force run | A button in Cloud Scheduler that starts the job now |
| `alreadyDecided` | The matchup already had a winner |