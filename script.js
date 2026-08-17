/* =========================================================
   NINTH INNING COMBINE
========================================================= */

const STORAGE_KEY = "niCombineData_v2";


/* =========================================================
   RANKED EVENTS

   high = higher is better
   low  = lower is better
========================================================= */

const RANKED_EVENTS = [
  { key: "pulldown", direction: "high" },
  { key: "exitVelo", direction: "high" },

  { key: "internalRotation", direction: "high" },
  { key: "externalRotation", direction: "high" },

  { key: "dynoInternal", direction: "high" },
  { key: "dynoExternal", direction: "high" },

  { key: "gripLeft", direction: "high" },
  { key: "gripRight", direction: "high" },

  { key: "medBallLeft", direction: "high" },
  { key: "medBallRight", direction: "high" },

  { key: "fiveTenFive", direction: "low" },
  { key: "tenYard", direction: "low" },

  { key: "broadJump", direction: "high" }
];

const TOTAL_RANKED_EVENTS = RANKED_EVENTS.length;


/* =========================================================
   RESULTS SORTING
========================================================= */

const SORT_CONFIG = {

  overallRank: {
    type: "number",
    defaultDirection: "asc"
  },

  lastName: {
    type: "text",
    defaultDirection: "asc"
  },

  ageGroup: {
    type: "age",
    defaultDirection: "asc"
  },

  combineScore: {
    type: "number",
    defaultDirection: "asc"
  },

  pulldown: {
    type: "number",
    defaultDirection: "desc"
  },

  exitVelo: {
    type: "number",
    defaultDirection: "desc"
  },

  internalRotation: {
    type: "number",
    defaultDirection: "desc"
  },

  externalRotation: {
    type: "number",
    defaultDirection: "desc"
  },

  dynoInternal: {
    type: "number",
    defaultDirection: "desc"
  },

  dynoExternal: {
    type: "number",
    defaultDirection: "desc"
  },

  gripLeft: {
    type: "number",
    defaultDirection: "desc"
  },

  gripRight: {
    type: "number",
    defaultDirection: "desc"
  },

  medBallLeft: {
    type: "number",
    defaultDirection: "desc"
  },

  medBallRight: {
    type: "number",
    defaultDirection: "desc"
  },

  fiveTenFive: {
    type: "number",
    defaultDirection: "asc"
  },

  tenYard: {
    type: "number",
    defaultDirection: "asc"
  },

  squat: {
    type: "squat",
    defaultDirection: "asc"
  },

  broadJump: {
    type: "number",
    defaultDirection: "desc"
  }

};


let resultsSort = {
  key: "combineScore",
  direction: "asc"
};


/* =========================================================
   STATE
========================================================= */

let players = loadPlayers();

let currentPlayerId = null;

let activeCalculatorTest = null;

let calculatorInput = "";

let selectedSquatStatus = null;

let timerControllers = [];


/* =========================================================
   RESULT TEMPLATE
========================================================= */

function defaultResults() {

  return {

    pulldown: [],
    exitVelo: [],

    internalRotation: null,
    externalRotation: null,

    dynoInternal: null,
    dynoExternal: null,

    gripLeft: null,
    gripRight: null,

    medBallLeft: null,
    medBallRight: null,

    fiveTenFive: [],
    tenYard: [],

    squat: {
      status: null,
      notes: ""
    },

    broadJump: null

  };

}


/* =========================================================
   STORAGE
========================================================= */

function loadPlayers() {

  try {

    let stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      stored =
        localStorage.getItem("niCombineData_v1");
    }

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizePlayer);

  } catch (error) {

    console.error(
      "Could not load player data:",
      error
    );

    return [];

  }

}


function savePlayers() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(players)
    );

  } catch (error) {

    console.error(
      "Could not save player data:",
      error
    );

  }

}


/* =========================================================
   NORMALIZE OLD DATA
========================================================= */

function normalizePlayer(player) {

  const defaults =
    defaultResults();

  const old =
    player.results || {};


  const pulldown =
    Array.isArray(old.pulldown)
      ? old.pulldown.map(Number).filter(Number.isFinite)
      : isNumber(old.pulldown)
        ? [Number(old.pulldown)]
        : [];


  const exitVelo =
    Array.isArray(old.exitVelo)
      ? old.exitVelo.map(Number).filter(Number.isFinite)
      : isNumber(old.exitVelo)
        ? [Number(old.exitVelo)]
        : [];


  const fiveTenFive =
    Array.isArray(old.fiveTenFive)
      ? old.fiveTenFive.map(Number).filter(Number.isFinite)
      : [];


  const tenYard =
    Array.isArray(old.tenYard)
      ? old.tenYard.map(Number).filter(Number.isFinite)
      : [];


  return {

    ...player,

    results: {

      ...defaults,
      ...old,

      pulldown,
      exitVelo,
      fiveTenFive,
      tenYard,

      squat: {
        ...defaults.squat,
        ...(old.squat || {})
      }

    }

  };

}


/* =========================================================
   DOM REFERENCES
========================================================= */

const playersView =
  document.getElementById("playersView");

const resultsView =
  document.getElementById("resultsView");

const testView =
  document.getElementById("testView");


const playersNavButton =
  document.getElementById("playersNavButton");

const resultsNavButton =
  document.getElementById("resultsNavButton");

const mainResultsButton =
  document.getElementById("mainResultsButton");

const backToPlayersButton =
  document.getElementById("backToPlayersButton");


const playersTableBody =
  document.getElementById("playersTableBody");

const resultsTableBody =
  document.getElementById("resultsTableBody");


const playerSearch =
  document.getElementById("playerSearch");

const playerAgeFilter =
  document.getElementById("playerAgeFilter");

const resultsSearch =
  document.getElementById("resultsSearch");

const resultsAgeFilter =
  document.getElementById("resultsAgeFilter");


const testPlayerName =
  document.getElementById("testPlayerName");

const testPlayerAge =
  document.getElementById("testPlayerAge");


const addPlayerButton =
  document.getElementById("addPlayerButton");

const addPlayerModal =
  document.getElementById("addPlayerModal");

const closeAddPlayerButton =
  document.getElementById("closeAddPlayerButton");

const savePlayerButton =
  document.getElementById("savePlayerButton");

const newPlayerFirstName =
  document.getElementById("newPlayerFirstName");

const newPlayerLastName =
  document.getElementById("newPlayerLastName");

const newPlayerAgeGroup =
  document.getElementById("newPlayerAgeGroup");


const indexButton =
  document.getElementById("indexButton");

const playerDrawer =
  document.getElementById("playerDrawer");

const drawerBackdrop =
  document.getElementById("drawerBackdrop");

const closeDrawerButton =
  document.getElementById("closeDrawerButton");

const drawerSearch =
  document.getElementById("drawerSearch");

const drawerPlayerList =
  document.getElementById("drawerPlayerList");


const numberModal =
  document.getElementById("numberModal");

const calculatorLabel =
  document.getElementById("calculatorLabel");

const calculatorValue =
  document.getElementById("calculatorValue");

const calculatorUnit =
  document.getElementById("calculatorUnit");

const calculatorSaveButton =
  document.getElementById("calculatorSaveButton");

const closeCalculatorButton =
  document.getElementById("closeCalculatorButton");

const calculatorButtons =
  document.querySelectorAll(".calculator-grid button");


const squatPassButton =
  document.getElementById("squatPassButton");

const squatFailButton =
  document.getElementById("squatFailButton");

const squatNotes =
  document.getElementById("squatNotes");


/* =========================================================
   UTILITIES
========================================================= */

function generateId() {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );

}


function getCurrentPlayer() {

  return players.find(
    player => player.id === currentPlayerId
  );

}


function ageNumber(ageGroup) {

  return parseInt(ageGroup, 10) || 999;

}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function isNumber(value) {

  return (
    value !== null &&
    value !== "" &&
    Number.isFinite(Number(value))
  );

}


function formatValue(value, decimals = 1) {

  if (!isNumber(value)) {
    return "—";
  }

  const number =
    Number(value);

  if (Number.isInteger(number)) {
    return number.toString();
  }

  return number.toFixed(decimals);

}


/* =========================================================
   ATTEMPT CALCULATIONS
========================================================= */

function maxAttempt(attempts) {

  if (
    !Array.isArray(attempts) ||
    attempts.length === 0
  ) {
    return null;
  }

  const values =
    attempts
      .map(Number)
      .filter(Number.isFinite);

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);

}


function averageAttempt(attempts) {

  if (
    !Array.isArray(attempts) ||
    attempts.length === 0
  ) {
    return null;
  }

  const values =
    attempts
      .map(Number)
      .filter(Number.isFinite);

  if (values.length === 0) {
    return null;
  }

  const total =
    values.reduce(
      (sum, value) => sum + value,
      0
    );

  return total / values.length;

}


function bestTime(attempts) {

  if (
    !Array.isArray(attempts) ||
    attempts.length === 0
  ) {
    return null;
  }

  const values =
    attempts
      .map(Number)
      .filter(Number.isFinite);

  if (values.length === 0) {
    return null;
  }

  return Math.min(...values);

}


/* =========================================================
   EVENT VALUE USED FOR RANKING
========================================================= */

function getEventValue(player, eventKey) {

  if (!player) {
    return null;
  }


  if (
    eventKey === "pulldown" ||
    eventKey === "exitVelo"
  ) {

    return maxAttempt(
      player.results[eventKey]
    );

  }


  if (eventKey === "fiveTenFive") {

    return bestTime(
      player.results.fiveTenFive
    );

  }


  if (eventKey === "tenYard") {

    return bestTime(
      player.results.tenYard
    );

  }


  const value =
    player.results[eventKey];


  return isNumber(value)
    ? Number(value)
    : null;

}


/* =========================================================
   RANKING ENGINE

   Combine Score =
   average event finish within age group.

   Lower score is better.

   Squat does NOT count.
========================================================= */

function calculateRankings() {

  const rankingData = {};


  players.forEach(player => {

    rankingData[player.id] = {

      eventRanks: {},

      completedEvents: 0,

      combineScore: null,

      overallRank: null

    };

  });


  const ageGroups = [
    ...new Set(
      players.map(player => player.ageGroup)
    )
  ];


  ageGroups.forEach(ageGroup => {

    const agePlayers =
      players.filter(
        player => player.ageGroup === ageGroup
      );


    RANKED_EVENTS.forEach(event => {

      const competitors =
        agePlayers
          .map(player => ({
            player,
            value: getEventValue(
              player,
              event.key
            )
          }))
          .filter(item =>
            isNumber(item.value)
          );


      competitors.sort((a, b) => {

        if (event.direction === "low") {
          return a.value - b.value;
        }

        return b.value - a.value;

      });


      let previousValue = null;
      let previousRank = null;


      competitors.forEach(
        (item, index) => {

          let rank;


          if (
            previousValue !== null &&
            item.value === previousValue
          ) {

            rank =
              previousRank;

          } else {

            rank =
              index + 1;

          }


          rankingData[
            item.player.id
          ].eventRanks[
            event.key
          ] = rank;


          previousValue =
            item.value;

          previousRank =
            rank;

        }
      );

    });


    agePlayers.forEach(player => {

      const ranks =
        Object.values(
          rankingData[player.id].eventRanks
        );


      rankingData[
        player.id
      ].completedEvents =
        ranks.length;


      if (
        ranks.length === TOTAL_RANKED_EVENTS
      ) {

        const total =
          ranks.reduce(
            (sum, rank) => sum + rank,
            0
          );


        rankingData[
          player.id
        ].combineScore =
          total / ranks.length;

      }

    });


    const eligible =
      agePlayers
        .filter(
          player =>
            rankingData[
              player.id
            ].combineScore !== null
        )
        .sort(
          (a, b) =>
            rankingData[
              a.id
            ].combineScore -
            rankingData[
              b.id
            ].combineScore
        );


    let previousScore = null;
    let previousRank = null;


    eligible.forEach(
      (player, index) => {

        const score =
          rankingData[
            player.id
          ].combineScore;


        let rank;


        if (
          previousScore !== null &&
          Math.abs(
            score - previousScore
          ) < 0.000001
        ) {

          rank =
            previousRank;

        } else {

          rank =
            index + 1;

        }


        rankingData[
          player.id
        ].overallRank =
          rank;


        previousScore =
          score;

        previousRank =
          rank;

      }
    );

  });


  return rankingData;

}


/* =========================================================
   DEFAULT PLAYER SORT
========================================================= */

function sortPlayersForMain(
  playerList,
  rankings
) {

  return [...playerList].sort(
    (a, b) => {

      const ageDifference =
        ageNumber(a.ageGroup) -
        ageNumber(b.ageGroup);


      if (ageDifference !== 0) {
        return ageDifference;
      }


      const rankA =
        rankings[a.id].overallRank;

      const rankB =
        rankings[b.id].overallRank;


      if (
        rankA !== null &&
        rankB !== null &&
        rankA !== rankB
      ) {

        return rankA - rankB;

      }


      if (
        rankA !== null &&
        rankB === null
      ) {
        return -1;
      }


      if (
        rankA === null &&
        rankB !== null
      ) {
        return 1;
      }


      const lastCompare =
        a.lastName.localeCompare(
          b.lastName
        );


      if (lastCompare !== 0) {
        return lastCompare;
      }


      return a.firstName.localeCompare(
        b.firstName
      );

    }
  );

}


/* =========================================================
   PLAYERS TABLE
========================================================= */

function renderPlayersTable() {

  const rankings =
    calculateRankings();


  const search =
    playerSearch.value
      .trim()
      .toLowerCase();


  const ageFilter =
    playerAgeFilter.value;


  let filtered =
    players.filter(player => {

      const normal =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const reverse =
        `${player.lastName} ${player.firstName}`
          .toLowerCase();


      const matchesSearch =
        !search ||
        normal.includes(search) ||
        reverse.includes(search);


      const matchesAge =
        ageFilter === "ALL" ||
        player.ageGroup === ageFilter;


      return matchesSearch && matchesAge;

    });


  filtered =
    sortPlayersForMain(
      filtered,
      rankings
    );


  if (filtered.length === 0) {

    playersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No players found.
        </td>
      </tr>
    `;

    return;

  }


  playersTableBody.innerHTML =
    filtered.map(player => {

      const ranking =
        rankings[player.id];


      const rankDisplay =
        ranking.overallRank !== null
          ? `#${ranking.overallRank}`
          : "—";


      const scoreDisplay =
        ranking.combineScore !== null
          ? ranking.combineScore.toFixed(2)
          : `INCOMPLETE (${ranking.completedEvents}/${TOTAL_RANKED_EVENTS})`;


      return `
        <tr>

          <td class="rank-cell">
            ${rankDisplay}
          </td>

          <td>
            ${escapeHTML(player.firstName)}
          </td>

          <td>
            ${escapeHTML(player.lastName)}
          </td>

          <td>
            ${escapeHTML(player.ageGroup)}
          </td>

          <td class="score-cell">
            ${scoreDisplay}
          </td>

          <td>
            <button
              class="test-button"
              data-player-id="${player.id}"
            >
              TEST
            </button>
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   RESULT SORT VALUES
========================================================= */

function getResultsSortValue(
  player,
  sortKey,
  rankings
) {

  const ranking =
    rankings[player.id];


  switch (sortKey) {

    case "overallRank":
      return ranking.overallRank;

    case "lastName":
      return `${player.lastName} ${player.firstName}`;

    case "ageGroup":
      return ageNumber(player.ageGroup);

    case "combineScore":
      return ranking.combineScore;

    case "pulldown":
      return maxAttempt(player.results.pulldown);

    case "exitVelo":
      return maxAttempt(player.results.exitVelo);

    case "fiveTenFive":
      return bestTime(player.results.fiveTenFive);

    case "tenYard":
      return bestTime(player.results.tenYard);

    case "squat":
      return player.results.squat?.status || null;

    default:
      return getEventValue(player, sortKey);

  }

}


/* =========================================================
   RESULTS SORT
========================================================= */

function fallbackPlayerSort(a, b) {

  const ageDifference =
    ageNumber(a.ageGroup) -
    ageNumber(b.ageGroup);


  if (ageDifference !== 0) {
    return ageDifference;
  }


  const lastCompare =
    a.lastName.localeCompare(
      b.lastName
    );


  if (lastCompare !== 0) {
    return lastCompare;
  }


  return a.firstName.localeCompare(
    b.firstName
  );

}


function sortResultsPlayers(
  playerList,
  rankings
) {

  const config =
    SORT_CONFIG[resultsSort.key];


  return [...playerList].sort(
    (a, b) => {

      const valueA =
        getResultsSortValue(
          a,
          resultsSort.key,
          rankings
        );


      const valueB =
        getResultsSortValue(
          b,
          resultsSort.key,
          rankings
        );


      const missingA =
        valueA === null ||
        valueA === undefined ||
        valueA === "";


      const missingB =
        valueB === null ||
        valueB === undefined ||
        valueB === "";


      if (missingA && !missingB) {
        return 1;
      }

      if (!missingA && missingB) {
        return -1;
      }

      if (missingA && missingB) {
        return fallbackPlayerSort(a, b);
      }


      let comparison = 0;


      if (config.type === "text") {

        comparison =
          String(valueA).localeCompare(
            String(valueB)
          );

      }

      else if (config.type === "squat") {

        const order = {
          PASS: 1,
          FAIL: 2
        };


        comparison =
          (order[valueA] || 999) -
          (order[valueB] || 999);

      }

      else {

        comparison =
          Number(valueA) -
          Number(valueB);

      }


      if (
        resultsSort.direction === "desc"
      ) {

        comparison *= -1;

      }


      if (comparison === 0) {
        return fallbackPlayerSort(a, b);
      }


      return comparison;

    }
  );

}


/* =========================================================
   SORT HEADER DISPLAY
========================================================= */

function updateSortHeaders() {

  document
    .querySelectorAll(".sort-header")
    .forEach(button => {

      const indicator =
        button.querySelector(
          ".sort-indicator"
        );


      button.classList.remove(
        "active-sort"
      );


      if (
        button.dataset.sort ===
        resultsSort.key
      ) {

        button.classList.add(
          "active-sort"
        );


        indicator.textContent =
          resultsSort.direction === "asc"
            ? "↑"
            : "↓";

      } else {

        indicator.textContent =
          "↕";

      }

    });

}


/* =========================================================
   RESULTS TABLE
========================================================= */

function renderResultsTable() {

  const rankings =
    calculateRankings();


  const search =
    resultsSearch.value
      .trim()
      .toLowerCase();


  const ageFilter =
    resultsAgeFilter.value;


  let filtered =
    players.filter(player => {

      const normal =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const reverse =
        `${player.lastName} ${player.firstName}`
          .toLowerCase();


      const matchesSearch =
        !search ||
        normal.includes(search) ||
        reverse.includes(search);


      const matchesAge =
        ageFilter === "ALL" ||
        player.ageGroup === ageFilter;


      return matchesSearch && matchesAge;

    });


  filtered =
    sortResultsPlayers(
      filtered,
      rankings
    );


  updateSortHeaders();


  if (filtered.length === 0) {

    resultsTableBody.innerHTML = `
      <tr>
        <td colspan="19" class="empty-state">
          No results found.
        </td>
      </tr>
    `;

    return;

  }


  resultsTableBody.innerHTML =
    filtered.map(player => {

      const r =
        player.results;

      const ranking =
        rankings[player.id];


      const rank =
        ranking.overallRank !== null
          ? `#${ranking.overallRank}`
          : "—";


      const score =
        ranking.combineScore !== null
          ? ranking.combineScore.toFixed(2)
          : "—";


      const pulldown =
        maxAttempt(r.pulldown);

      const exitVelo =
        maxAttempt(r.exitVelo);

      const fiveTenFive =
        bestTime(r.fiveTenFive);

      const tenYard =
        bestTime(r.tenYard);

      const squat =
        r.squat?.status || "—";


      return `
        <tr>

          <td class="rank-cell">
            ${rank}
          </td>

          <td>
            ${escapeHTML(
              `${player.lastName}, ${player.firstName}`
            )}
          </td>

          <td>
            ${escapeHTML(player.ageGroup)}
          </td>

          <td class="score-cell">
            ${score}
          </td>

          <td>${formatValue(pulldown)}</td>
          <td>${formatValue(exitVelo)}</td>

          <td>${formatValue(r.internalRotation)}</td>
          <td>${formatValue(r.externalRotation)}</td>

          <td>${formatValue(r.dynoInternal)}</td>
          <td>${formatValue(r.dynoExternal)}</td>

          <td>${formatValue(r.gripLeft)}</td>
          <td>${formatValue(r.gripRight)}</td>

          <td>${formatValue(r.medBallLeft)}</td>
          <td>${formatValue(r.medBallRight)}</td>

          <td>
            ${
              fiveTenFive !== null
                ? fiveTenFive.toFixed(2)
                : "—"
            }
          </td>

          <td>
            ${
              tenYard !== null
                ? tenYard.toFixed(2)
                : "—"
            }
          </td>

          <td>${escapeHTML(squat)}</td>

          <td>${formatValue(r.broadJump)}</td>

          <td>
            <button
              class="test-button"
              data-player-id="${player.id}"
            >
              TEST
            </button>
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   NAVIGATION
========================================================= */

function showView(viewName) {

  if (viewName !== "test") {
    cancelAllTimers();
  }


  playersView.classList.remove("active-view");
  resultsView.classList.remove("active-view");
  testView.classList.remove("active-view");


  playersNavButton.classList.remove("active");
  resultsNavButton.classList.remove("active");


  if (viewName === "players") {

    playersView.classList.add("active-view");

    playersNavButton.classList.add("active");

    renderPlayersTable();

  }


  if (viewName === "results") {

    resultsView.classList.add("active-view");

    resultsNavButton.classList.add("active");

    renderResultsTable();

  }


  if (viewName === "test") {

    testView.classList.add("active-view");

    renderTestView();

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function openPlayerTest(playerId) {

  cancelAllTimers();

  currentPlayerId =
    playerId;


  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  selectedSquatStatus =
    player.results.squat?.status || null;


  closePlayerDrawer();

  showView("test");

}


/* =========================================================
   TEST VIEW
========================================================= */

function renderTestView() {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  testPlayerName.textContent =
    `${player.firstName} ${player.lastName}`;


  testPlayerAge.textContent =
    player.ageGroup;


  const singleValueFields = [

    "internalRotation",
    "externalRotation",

    "dynoInternal",
    "dynoExternal",

    "gripLeft",
    "gripRight",

    "medBallLeft",
    "medBallRight",

    "broadJump"

  ];


  singleValueFields.forEach(key => {

    const element =
      document.getElementById(
        `${key}Value`
      );


    if (element) {

      element.textContent =
        formatValue(
          player.results[key]
        );

    }

  });


  renderVelocityAttempts(
    "pulldown",
    "pulldownMax",
    "pulldownAverage",
    "pulldownAttempts"
  );


  renderVelocityAttempts(
    "exitVelo",
    "exitVeloMax",
    "exitVeloAverage",
    "exitVeloAttempts"
  );


  selectedSquatStatus =
    player.results.squat?.status || null;


  squatNotes.value =
    player.results.squat?.notes || "";


  updateSquatButtons();


  renderAllTimerAttempts();

}


/* =========================================================
   ADD PLAYER
========================================================= */

function openAddPlayerModal() {

  newPlayerFirstName.value = "";
  newPlayerLastName.value = "";
  newPlayerAgeGroup.value = "";


  addPlayerModal.classList.add("show");


  setTimeout(
    () => newPlayerFirstName.focus(),
    50
  );

}


function closeAddPlayerModal() {

  addPlayerModal.classList.remove("show");

}


function addPlayer() {

  const firstName =
    newPlayerFirstName.value.trim();

  const lastName =
    newPlayerLastName.value.trim();

  const ageGroup =
    newPlayerAgeGroup.value;


  if (
    !firstName ||
    !lastName ||
    !ageGroup
  ) {

    alert(
      "Enter first name, last name, and age group."
    );

    return;

  }


  const player = {

    id: generateId(),

    firstName,
    lastName,
    ageGroup,

    createdAt:
      new Date().toISOString(),

    results:
      defaultResults()

  };


  players.push(player);

  savePlayers();

  closeAddPlayerModal();

  renderEverything();

  openPlayerTest(player.id);

}


/* =========================================================
   PLAYER DRAWER
========================================================= */

function openPlayerDrawer() {

  renderPlayerDrawer();

  playerDrawer.classList.add("open");

  drawerBackdrop.classList.add("show");

}


function closePlayerDrawer() {

  playerDrawer.classList.remove("open");

  drawerBackdrop.classList.remove("show");

}


function renderPlayerDrawer() {

  const search =
    drawerSearch.value
      .trim()
      .toLowerCase();


  let filtered =
    players.filter(player => {

      const normal =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const reverse =
        `${player.lastName} ${player.firstName}`
          .toLowerCase();


      return (
        !search ||
        normal.includes(search) ||
        reverse.includes(search)
      );

    });


  filtered.sort((a, b) => {

    const ageDifference =
      ageNumber(a.ageGroup) -
      ageNumber(b.ageGroup);


    if (ageDifference !== 0) {
      return ageDifference;
    }


    const lastCompare =
      a.lastName.localeCompare(
        b.lastName
      );


    if (lastCompare !== 0) {
      return lastCompare;
    }


    return a.firstName.localeCompare(
      b.firstName
    );

  });


  if (filtered.length === 0) {

    drawerPlayerList.innerHTML = `
      <div class="empty-state">
        No players found.
      </div>
    `;

    return;

  }


  let html = "";
  let currentAge = null;


  filtered.forEach(player => {

    if (player.ageGroup !== currentAge) {

      currentAge =
        player.ageGroup;


      html += `
        <div class="drawer-age-heading">
          ${escapeHTML(currentAge)}
        </div>
      `;

    }


    html += `
      <button
        class="drawer-player-button"
        data-player-id="${player.id}"
      >
        ${escapeHTML(
          `${player.lastName}, ${player.firstName}`
        )}
      </button>
    `;

  });


  drawerPlayerList.innerHTML =
    html;

}


/* =========================================================
   STANDARD CALCULATOR
========================================================= */

function openCalculator(card) {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  activeCalculatorTest = {

    key:
      card.dataset.test,

    label:
      card.dataset.label,

    unit:
      card.dataset.unit,

    isAttempt:
      false

  };


  const existing =
    player.results[
      activeCalculatorTest.key
    ];


  calculatorInput =
    isNumber(existing)
      ? String(existing)
      : "";


  calculatorLabel.textContent =
    activeCalculatorTest.label;

  calculatorUnit.textContent =
    activeCalculatorTest.unit;


  updateCalculatorDisplay();

  numberModal.classList.add("show");

}


/* =========================================================
   PULLDOWN / EXIT VELO CALCULATOR

   Always starts blank.
========================================================= */

function openAttemptCalculator(button) {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  activeCalculatorTest = {

    key:
      button.dataset.attemptTest,

    label:
      button.dataset.label,

    unit:
      button.dataset.unit,

    isAttempt:
      true

  };


  calculatorInput = "";


  calculatorLabel.textContent =
    activeCalculatorTest.label;

  calculatorUnit.textContent =
    activeCalculatorTest.unit;


  updateCalculatorDisplay();

  numberModal.classList.add("show");

}


function closeCalculator() {

  numberModal.classList.remove("show");

  activeCalculatorTest = null;

  calculatorInput = "";

}


function updateCalculatorDisplay() {

  calculatorValue.textContent =
    calculatorInput;

}


function calculatorKeyPress(key) {

  if (key === "backspace") {

    calculatorInput =
      calculatorInput.slice(0, -1);

    updateCalculatorDisplay();

    return;

  }


  if (key === ".") {

    if (calculatorInput.includes(".")) {
      return;
    }


    calculatorInput =
      calculatorInput === ""
        ? "0."
        : `${calculatorInput}.`;


    updateCalculatorDisplay();

    return;

  }


  if (calculatorInput.length >= 8) {
    return;
  }


  if (calculatorInput === "0") {

    calculatorInput =
      key;

  } else {

    calculatorInput +=
      key;

  }


  updateCalculatorDisplay();

}


function saveCalculatorResult() {

  const player =
    getCurrentPlayer();


  if (
    !player ||
    !activeCalculatorTest
  ) {
    return;
  }


  if (
    calculatorInput === "" ||
    calculatorInput === "." ||
    calculatorInput === "0."
  ) {

    alert("Enter a result before saving.");

    return;

  }


  const value =
    Number(calculatorInput);


  if (!Number.isFinite(value)) {

    alert("Enter a valid number.");

    return;

  }


  if (activeCalculatorTest.isAttempt) {

    const key =
      activeCalculatorTest.key;


    if (!Array.isArray(player.results[key])) {
      player.results[key] = [];
    }


    player.results[key].push(value);

  } else {

    player.results[
      activeCalculatorTest.key
    ] = value;

  }


  savePlayers();

  closeCalculator();

  renderEverything();

  renderTestView();

}


/* =========================================================
   VELOCITY DISPLAY
========================================================= */

function renderVelocityAttempts(
  resultKey,
  maxElementId,
  averageElementId,
  attemptsElementId
) {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  const attempts =
    Array.isArray(
      player.results[resultKey]
    )
      ? player.results[resultKey]
      : [];


  const max =
    maxAttempt(attempts);

  const average =
    averageAttempt(attempts);


  document.getElementById(
    maxElementId
  ).textContent =
    max !== null
      ? max.toFixed(1)
      : "—";


  document.getElementById(
    averageElementId
  ).textContent =
    average !== null
      ? average.toFixed(1)
      : "—";


  const container =
    document.getElementById(
      attemptsElementId
    );


  if (attempts.length === 0) {

    container.innerHTML = `
      <div class="attempt-row">
        <span>No entries yet</span>
      </div>
    `;

    return;

  }


  const lastThree =
    attempts
      .map((value, index) => ({
        value,
        originalIndex: index
      }))
      .slice(-3)
      .reverse();


  container.innerHTML =
    lastThree.map(item => `

      <div class="attempt-row">

        <span>
          Attempt ${item.originalIndex + 1}
        </span>

        <strong>
          ${Number(item.value).toFixed(1)} MPH
        </strong>

        <button
          class="delete-velocity-attempt"
          data-test="${resultKey}"
          data-index="${item.originalIndex}"
        >
          DELETE
        </button>

      </div>

    `).join("");

}


/* =========================================================
   SQUAT — AUTO SAVE
========================================================= */

function updateSquatButtons() {

  squatPassButton.classList.remove(
    "pass-selected"
  );

  squatFailButton.classList.remove(
    "fail-selected"
  );


  if (selectedSquatStatus === "PASS") {

    squatPassButton.classList.add(
      "pass-selected"
    );

  }


  if (selectedSquatStatus === "FAIL") {

    squatFailButton.classList.add(
      "fail-selected"
    );

  }

}


function saveSquatStatus(status) {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  selectedSquatStatus =
    status;


  player.results.squat.status =
    status;


  player.results.squat.notes =
    squatNotes.value;


  savePlayers();

  updateSquatButtons();

  renderPlayersTable();

  renderResultsTable();

}


function saveSquatNotes() {

  const player =
    getCurrentPlayer();


  if (!player) {
    return;
  }


  player.results.squat.notes =
    squatNotes.value;


  savePlayers();

}


/* =========================================================
   TIMER SYSTEM
========================================================= */

function createTimer({
  displayElement,
  buttonElement,
  attemptsElement,
  bestElement,
  resultKey
}) {

  let running = false;

  let startTime = null;

  let animationFrame = null;


  function updateTimer() {

    if (!running) {
      return;
    }


    const elapsed =
      (
        performance.now() -
        startTime
      ) / 1000;


    displayElement.textContent =
      elapsed.toFixed(2);


    animationFrame =
      requestAnimationFrame(
        updateTimer
      );

  }


  function toggleTimer() {

    if (running) {
      stopTimer();
    } else {
      startTimer();
    }

  }


  function startTimer() {

    running = true;

    startTime =
      performance.now();


    displayElement.textContent =
      "0.00";


    buttonElement.textContent =
      "STOP";


    buttonElement.classList.add(
      "running"
    );


    animationFrame =
      requestAnimationFrame(
        updateTimer
      );

  }


  function stopTimer() {

    if (!running) {
      return;
    }


    const player =
      getCurrentPlayer();


    const elapsed =
      (
        performance.now() -
        startTime
      ) / 1000;


    const finalTime =
      Number(
        elapsed.toFixed(2)
      );


    running = false;


    cancelAnimationFrame(
      animationFrame
    );


    animationFrame = null;


    buttonElement.textContent =
      "START";


    buttonElement.classList.remove(
      "running"
    );


    displayElement.textContent =
      finalTime.toFixed(2);


    if (!player) {
      return;
    }


    if (
      !Array.isArray(
        player.results[resultKey]
      )
    ) {

      player.results[resultKey] = [];

    }


    player.results[
      resultKey
    ].push(finalTime);


    savePlayers();


    renderTimerAttempts(
      attemptsElement,
      bestElement,
      resultKey
    );


    renderPlayersTable();

    renderResultsTable();

  }


  function cancel() {

    if (animationFrame) {

      cancelAnimationFrame(
        animationFrame
      );

    }


    animationFrame = null;

    running = false;

    startTime = null;


    buttonElement.textContent =
      "START";


    buttonElement.classList.remove(
      "running"
    );


    displayElement.textContent =
      "0.00";

  }


  buttonElement.addEventListener(
    "click",
    toggleTimer
  );


  attemptsElement.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          ".delete-attempt"
        );


      if (!button) {
        return;
      }


      const player =
        getCurrentPlayer();


      if (!player) {
        return;
      }


      const index =
        Number(
          button.dataset.index
        );


      player.results[
        resultKey
      ].splice(index, 1);


      savePlayers();


      renderTimerAttempts(
        attemptsElement,
        bestElement,
        resultKey
      );


      renderPlayersTable();

      renderResultsTable();

    }
  );


  return {
    cancel
  };

}


/* =========================================================
   TIMER ATTEMPT DISPLAY
========================================================= */

function renderTimerAttempts(
  container,
  bestElement,
  resultKey
) {

  const player =
    getCurrentPlayer();


  if (!player) {

    container.innerHTML = "";

    bestElement.textContent = "—";

    return;

  }


  const attempts =
    Array.isArray(
      player.results[resultKey]
    )
      ? player.results[resultKey]
      : [];


  const best =
    bestTime(attempts);


  bestElement.textContent =
    best !== null
      ? `${best.toFixed(2)}s`
      : "—";


  if (attempts.length === 0) {

    container.innerHTML = `
      <div class="attempt-row">
        <span>No attempts yet</span>
      </div>
    `;

    return;

  }


  container.innerHTML =
    attempts.map(
      (attempt, index) => {

        const isBest =
          best !== null &&
          Number(attempt) === Number(best);


        return `
          <div class="attempt-row">

            <span>
              Attempt ${index + 1}
              ${isBest ? " • BEST" : ""}
            </span>

            <strong>
              ${Number(attempt).toFixed(2)}s
            </strong>

            <button
              class="delete-attempt"
              data-index="${index}"
            >
              DELETE
            </button>

          </div>
        `;

      }
    ).join("");

}


/* =========================================================
   TIMERS
========================================================= */

const fiveTenFiveController =
  createTimer({

    displayElement:
      document.getElementById(
        "fiveTenFiveTimer"
      ),

    buttonElement:
      document.getElementById(
        "fiveTenFiveStartButton"
      ),

    attemptsElement:
      document.getElementById(
        "fiveTenFiveAttempts"
      ),

    bestElement:
      document.getElementById(
        "fiveTenFiveBest"
      ),

    resultKey:
      "fiveTenFive"

  });


const tenYardController =
  createTimer({

    displayElement:
      document.getElementById(
        "tenYardTimer"
      ),

    buttonElement:
      document.getElementById(
        "tenYardStartButton"
      ),

    attemptsElement:
      document.getElementById(
        "tenYardAttempts"
      ),

    bestElement:
      document.getElementById(
        "tenYardBest"
      ),

    resultKey:
      "tenYard"

  });


timerControllers = [
  fiveTenFiveController,
  tenYardController
];


function cancelAllTimers() {

  timerControllers.forEach(
    controller => controller.cancel()
  );

}


function renderAllTimerAttempts() {

  renderTimerAttempts(

    document.getElementById(
      "fiveTenFiveAttempts"
    ),

    document.getElementById(
      "fiveTenFiveBest"
    ),

    "fiveTenFive"

  );


  renderTimerAttempts(

    document.getElementById(
      "tenYardAttempts"
    ),

    document.getElementById(
      "tenYardBest"
    ),

    "tenYard"

  );

}


/* =========================================================
   NAV EVENTS
========================================================= */

playersNavButton.addEventListener(
  "click",
  () => showView("players")
);


resultsNavButton.addEventListener(
  "click",
  () => showView("results")
);


mainResultsButton.addEventListener(
  "click",
  () => showView("results")
);


backToPlayersButton.addEventListener(
  "click",
  () => showView("players")
);


/* =========================================================
   SEARCH / FILTER
========================================================= */

playerSearch.addEventListener(
  "input",
  renderPlayersTable
);


playerAgeFilter.addEventListener(
  "change",
  renderPlayersTable
);


resultsSearch.addEventListener(
  "input",
  renderResultsTable
);


resultsAgeFilter.addEventListener(
  "change",
  renderResultsTable
);


/* =========================================================
   RESULTS SORT
========================================================= */

document
  .querySelectorAll(".sort-header")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const sortKey =
          button.dataset.sort;


        if (!SORT_CONFIG[sortKey]) {
          return;
        }


        if (resultsSort.key === sortKey) {

          resultsSort.direction =
            resultsSort.direction === "asc"
              ? "desc"
              : "asc";

        } else {

          resultsSort.key =
            sortKey;


          resultsSort.direction =
            SORT_CONFIG[
              sortKey
            ].defaultDirection;

        }


        renderResultsTable();

      }
    );

  });


/* =========================================================
   TEST BUTTONS
========================================================= */

playersTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".test-button"
      );


    if (button) {

      openPlayerTest(
        button.dataset.playerId
      );

    }

  }
);


resultsTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".test-button"
      );


    if (button) {

      openPlayerTest(
        button.dataset.playerId
      );

    }

  }
);


/* =========================================================
   ADD PLAYER EVENTS
========================================================= */

addPlayerButton.addEventListener(
  "click",
  openAddPlayerModal
);


closeAddPlayerButton.addEventListener(
  "click",
  closeAddPlayerModal
);


savePlayerButton.addEventListener(
  "click",
  addPlayer
);


addPlayerModal.addEventListener(
  "click",
  event => {

    if (event.target === addPlayerModal) {
      closeAddPlayerModal();
    }

  }
);


/* =========================================================
   DRAWER EVENTS
========================================================= */

indexButton.addEventListener(
  "click",
  openPlayerDrawer
);


closeDrawerButton.addEventListener(
  "click",
  closePlayerDrawer
);


drawerBackdrop.addEventListener(
  "click",
  closePlayerDrawer
);


drawerSearch.addEventListener(
  "input",
  renderPlayerDrawer
);


drawerPlayerList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".drawer-player-button"
      );


    if (button) {

      openPlayerTest(
        button.dataset.playerId
      );

    }

  }
);


/* =========================================================
   NUMBER TESTS
========================================================= */

document
  .querySelectorAll(".number-test")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => openCalculator(card)
    );

  });


document
  .querySelectorAll(".add-attempt-button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => openAttemptCalculator(button)
    );

  });


/* =========================================================
   DELETE VELOCITY
========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".delete-velocity-attempt"
      );


    if (!button) {
      return;
    }


    const player =
      getCurrentPlayer();


    if (!player) {
      return;
    }


    const resultKey =
      button.dataset.test;


    const index =
      Number(
        button.dataset.index
      );


    player.results[
      resultKey
    ].splice(index, 1);


    savePlayers();

    renderEverything();

    renderTestView();

  }
);


/* =========================================================
   CALCULATOR EVENTS
========================================================= */

calculatorButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => calculatorKeyPress(
      button.dataset.key
    )
  );

});


calculatorSaveButton.addEventListener(
  "click",
  saveCalculatorResult
);


closeCalculatorButton.addEventListener(
  "click",
  closeCalculator
);


numberModal.addEventListener(
  "click",
  event => {

    if (event.target === numberModal) {
      closeCalculator();
    }

  }
);


/* =========================================================
   SQUAT AUTO SAVE
========================================================= */

squatPassButton.addEventListener(
  "click",
  () => saveSquatStatus("PASS")
);


squatFailButton.addEventListener(
  "click",
  () => saveSquatStatus("FAIL")
);


squatNotes.addEventListener(
  "input",
  saveSquatNotes
);


/* =========================================================
   KEYBOARD CALCULATOR
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeCalculator();

      closeAddPlayerModal();

      closePlayerDrawer();

      return;

    }


    if (
      !numberModal.classList.contains(
        "show"
      )
    ) {
      return;
    }


    if (/^[0-9]$/.test(event.key)) {

      calculatorKeyPress(
        event.key
      );

      return;

    }


    if (event.key === ".") {

      calculatorKeyPress(".");

      return;

    }


    if (event.key === "Backspace") {

      calculatorKeyPress(
        "backspace"
      );

      return;

    }


    if (event.key === "Enter") {

      saveCalculatorResult();

    }

  }
);


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

  renderPlayersTable();

  renderResultsTable();

  renderPlayerDrawer();

}


/* =========================================================
   START APP
========================================================= */

renderEverything();

showView("players");
