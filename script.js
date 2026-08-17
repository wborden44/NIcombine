/* =========================================================
   NINTH INNING COMBINE
   APP LOGIC — PROTOTYPE STORAGE VERSION

   IMPORTANT:
   This version uses localStorage.
   Firebase / Firestore will replace localStorage later.
========================================================= */


/* =========================================================
   APP CONFIGURATION
========================================================= */

const STORAGE_KEY = "niCombineData_v1";

const RANKED_EVENTS = [
  { key: "pulldown", direction: "high" },
  { key: "exitVelo", direction: "high" },
  { key: "internalRotation", direction: "high" },
  { key: "externalRotation", direction: "high" },
  { key: "dynoInternal", direction: "high" },
  { key: "dynoExternal", direction: "high" },
  { key: "gripLeft", direction: "high" },
  { key: "gripRight", direction: "high" },
  { key: "broadJump", direction: "high" },
  { key: "medBallLeft", direction: "high" },
  { key: "medBallRight", direction: "high" },
  { key: "fiveTenFive", direction: "low" },
  { key: "tenYard", direction: "low" }
];

const TOTAL_RANKED_EVENTS = RANKED_EVENTS.length;


/* =========================================================
   APP STATE
========================================================= */

let players = loadPlayers();

let currentPlayerId = null;

let activeCalculatorTest = null;
let calculatorInput = "0";

let selectedSquatStatus = null;

let timerControllers = [];


/* =========================================================
   DEFAULT PLAYER RESULTS
========================================================= */

function defaultResults() {
  return {
    pulldown: null,
    exitVelo: null,

    internalRotation: null,
    externalRotation: null,

    dynoInternal: null,
    dynoExternal: null,

    gripLeft: null,
    gripRight: null,

    broadJump: null,

    medBallLeft: null,
    medBallRight: null,

    squat: {
      status: null,
      notes: ""
    },

    fiveTenFive: [],
    tenYard: []
  };
}


/* =========================================================
   STORAGE
========================================================= */

function loadPlayers() {

  try {

    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizePlayer);

  } catch (error) {

    console.error("Could not load players:", error);

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

    console.error("Could not save players:", error);
  }
}


/* =========================================================
   NORMALIZE OLD / PARTIAL PLAYER DATA
========================================================= */

function normalizePlayer(player) {

  const defaults = defaultResults();

  return {
    ...player,

    results: {
      ...defaults,
      ...(player.results || {}),

      squat: {
        ...defaults.squat,
        ...(player.results?.squat || {})
      },

      fiveTenFive:
        Array.isArray(player.results?.fiveTenFive)
          ? player.results.fiveTenFive
          : [],

      tenYard:
        Array.isArray(player.results?.tenYard)
          ? player.results.tenYard
          : []
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


/* =========================================================
   ADD PLAYER DOM
========================================================= */

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


/* =========================================================
   PLAYER DRAWER DOM
========================================================= */

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


/* =========================================================
   CALCULATOR DOM
========================================================= */

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
  document.querySelectorAll(
    ".calculator-grid button"
  );


/* =========================================================
   SQUAT DOM
========================================================= */

const squatPassButton =
  document.getElementById("squatPassButton");

const squatFailButton =
  document.getElementById("squatFailButton");

const squatNotes =
  document.getElementById("squatNotes");

const saveSquatButton =
  document.getElementById("saveSquatButton");


/* =========================================================
   UTILITY FUNCTIONS
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


function bestTime(attempts) {

  if (
    !Array.isArray(attempts) ||
    attempts.length === 0
  ) {
    return null;
  }

  return Math.min(
    ...attempts.map(Number)
  );
}


function getEventValue(player, eventKey) {

  if (!player) {
    return null;
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


function formatValue(value, decimals = 1) {

  if (!isNumber(value)) {
    return "—";
  }

  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return numericValue.toString();
  }

  return numericValue.toFixed(decimals);
}


/* =========================================================
   RANKING ENGINE
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


  const ageGroups =
    [...new Set(
      players.map(player => player.ageGroup)
    )];


  ageGroups.forEach(ageGroup => {

    const agePlayers =
      players.filter(
        player => player.ageGroup === ageGroup
      );


    /* -----------------------------------------
       RANK EACH EVENT
    ----------------------------------------- */

    RANKED_EVENTS.forEach(event => {

      const competitors =
        agePlayers
          .map(player => ({
            player,
            value:
              getEventValue(
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

            rank = previousRank;

          } else {

            rank = index + 1;
          }


          rankingData[
            item.player.id
          ].eventRanks[event.key] = rank;


          previousValue = item.value;
          previousRank = rank;
        }
      );
    });


    /* -----------------------------------------
       CALCULATE COMBINE SCORE
    ----------------------------------------- */

    agePlayers.forEach(player => {

      const ranks =
        Object.values(
          rankingData[player.id].eventRanks
        );

      rankingData[
        player.id
      ].completedEvents = ranks.length;


      /*
        Player must complete ALL ranked events
        before receiving an official combine score.
      */

      if (
        ranks.length ===
        TOTAL_RANKED_EVENTS
      ) {

        const total =
          ranks.reduce(
            (sum, rank) =>
              sum + rank,
            0
          );

        rankingData[
          player.id
        ].combineScore =
          total / ranks.length;
      }
    });


    /* -----------------------------------------
       OVERALL AGE GROUP RANK
    ----------------------------------------- */

    const eligible =
      agePlayers
        .filter(player =>
          rankingData[player.id]
            .combineScore !== null
        )
        .sort((a, b) =>
          rankingData[a.id].combineScore -
          rankingData[b.id].combineScore
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

          rank = previousRank;

        } else {

          rank = index + 1;
        }


        rankingData[
          player.id
        ].overallRank = rank;

        previousScore = score;
        previousRank = rank;
      }
    );
  });


  return rankingData;
}


/* =========================================================
   SORT PLAYERS
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


      const lastNameCompare =
        a.lastName.localeCompare(
          b.lastName
        );

      if (lastNameCompare !== 0) {
        return lastNameCompare;
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

      const fullName =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search);

      const matchesAge =
        ageFilter === "ALL" ||
        player.ageGroup === ageFilter;

      return (
        matchesSearch &&
        matchesAge
      );
    });


  filtered =
    sortPlayersForMain(
      filtered,
      rankings
    );


  if (filtered.length === 0) {

    playersTableBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-state"
        >
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

      const fullName =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search);

      const matchesAge =
        ageFilter === "ALL" ||
        player.ageGroup === ageFilter;

      return (
        matchesSearch &&
        matchesAge
      );
    });


  filtered =
    sortPlayersForMain(
      filtered,
      rankings
    );


  if (filtered.length === 0) {

    resultsTableBody.innerHTML = `
      <tr>
        <td
          colspan="19"
          class="empty-state"
        >
          No results found.
        </td>
      </tr>
    `;

    return;
  }


  resultsTableBody.innerHTML =
    filtered.map(player => {

      const r = player.results;

      const ranking =
        rankings[player.id];

      const overallRank =
        ranking.overallRank !== null
          ? `#${ranking.overallRank}`
          : "—";

      const combineScore =
        ranking.combineScore !== null
          ? ranking.combineScore.toFixed(2)
          : "—";

      const squat =
        r.squat?.status || "—";

      const fiveTenFive =
        bestTime(r.fiveTenFive);

      const tenYard =
        bestTime(r.tenYard);


      return `
        <tr>

          <td class="rank-cell">
            ${overallRank}
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
            ${combineScore}
          </td>

          <td>
            ${formatValue(r.pulldown)}
          </td>

          <td>
            ${formatValue(r.exitVelo)}
          </td>

          <td>
            ${escapeHTML(squat)}
          </td>

          <td>
            ${formatValue(r.internalRotation)}
          </td>

          <td>
            ${formatValue(r.externalRotation)}
          </td>

          <td>
            ${formatValue(r.dynoInternal)}
          </td>

          <td>
            ${formatValue(r.dynoExternal)}
          </td>

          <td>
            ${formatValue(r.gripLeft)}
          </td>

          <td>
            ${formatValue(r.gripRight)}
          </td>

          <td>
            ${formatValue(r.broadJump)}
          </td>

          <td>
            ${formatValue(r.medBallLeft)}
          </td>

          <td>
            ${formatValue(r.medBallRight)}
          </td>

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
   SHOW VIEWS
========================================================= */

function showView(viewName) {

  if (viewName !== "test") {
    cancelAllTimers();
  }

  playersView.classList.remove(
    "active-view"
  );

  resultsView.classList.remove(
    "active-view"
  );

  testView.classList.remove(
    "active-view"
  );


  playersNavButton.classList.remove(
    "active"
  );

  resultsNavButton.classList.remove(
    "active"
  );


  if (viewName === "players") {

    playersView.classList.add(
      "active-view"
    );

    playersNavButton.classList.add(
      "active"
    );

    renderPlayersTable();
  }


  if (viewName === "results") {

    resultsView.classList.add(
      "active-view"
    );

    resultsNavButton.classList.add(
      "active"
    );

    renderResultsTable();
  }


  if (viewName === "test") {

    testView.classList.add(
      "active-view"
    );

    renderTestView();
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   OPEN PLAYER TEST PAGE
========================================================= */

function openPlayerTest(playerId) {

  cancelAllTimers();

  currentPlayerId = playerId;

  const player =
    getCurrentPlayer();

  if (!player) {
    return;
  }

  selectedSquatStatus =
    player.results.squat?.status ||
    null;

  closePlayerDrawer();

  showView("test");
}


/* =========================================================
   TEST SCREEN
========================================================= */

function renderTestView() {

  const player =
    getCurrentPlayer();

  if (!player) {

    testPlayerName.textContent =
      "Select Player";

    testPlayerAge.textContent = "";

    return;
  }


  testPlayerName.textContent =
    `${player.firstName} ${player.lastName}`;

  testPlayerAge.textContent =
    player.ageGroup;


  const numberFields = [
    "pulldown",
    "exitVelo",
    "internalRotation",
    "externalRotation",
    "dynoInternal",
    "dynoExternal",
    "gripLeft",
    "gripRight",
    "broadJump",
    "medBallLeft",
    "medBallRight"
  ];


  numberFields.forEach(key => {

    const element =
      document.getElementById(
        `${key}Value`
      );

    if (!element) {
      return;
    }

    element.textContent =
      formatValue(
        player.results[key]
      );
  });


  selectedSquatStatus =
    player.results.squat?.status ||
    null;

  squatNotes.value =
    player.results.squat?.notes ||
    "";

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

  addPlayerModal.classList.add(
    "show"
  );

  setTimeout(() => {
    newPlayerFirstName.focus();
  }, 50);
}


function closeAddPlayerModal() {

  addPlayerModal.classList.remove(
    "show"
  );
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
      "Enter the player's first name, last name, and age group."
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
   PLAYER INDEX DRAWER
========================================================= */

function openPlayerDrawer() {

  renderPlayerDrawer();

  playerDrawer.classList.add(
    "open"
  );

  drawerBackdrop.classList.add(
    "show"
  );
}


function closePlayerDrawer() {

  playerDrawer.classList.remove(
    "open"
  );

  drawerBackdrop.classList.remove(
    "show"
  );
}


function renderPlayerDrawer() {

  const search =
    drawerSearch.value
      .trim()
      .toLowerCase();


  let filtered =
    players.filter(player => {

      const fullName =
        `${player.firstName} ${player.lastName}`
          .toLowerCase();

      return (
        !search ||
        fullName.includes(search)
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

    if (
      player.ageGroup !== currentAge
    ) {

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
   NUMBER ENTRY CALCULATOR
========================================================= */

function openCalculator(card) {

  const player =
    getCurrentPlayer();

  if (!player) {
    return;
  }


  activeCalculatorTest = {
    key: card.dataset.test,
    label: card.dataset.label,
    unit: card.dataset.unit
  };


  const existingValue =
    player.results[
      activeCalculatorTest.key
    ];


  calculatorInput =
    isNumber(existingValue)
      ? String(existingValue)
      : "0";


  calculatorLabel.textContent =
    activeCalculatorTest.label;

  calculatorUnit.textContent =
    activeCalculatorTest.unit;

  updateCalculatorDisplay();

  numberModal.classList.add(
    "show"
  );
}


function closeCalculator() {

  numberModal.classList.remove(
    "show"
  );

  activeCalculatorTest = null;
}


function updateCalculatorDisplay() {

  calculatorValue.textContent =
    calculatorInput || "0";
}


function calculatorKeyPress(key) {

  if (key === "backspace") {

    if (
      calculatorInput.length <= 1
    ) {

      calculatorInput = "0";

    } else {

      calculatorInput =
        calculatorInput.slice(0, -1);
    }

    updateCalculatorDisplay();

    return;
  }


  if (key === ".") {

    if (
      calculatorInput.includes(".")
    ) {
      return;
    }

    calculatorInput += ".";

    updateCalculatorDisplay();

    return;
  }


  if (
    calculatorInput === "0"
  ) {

    calculatorInput = key;

  } else {

    /*
      Prevent unreasonable accidental input.
    */

    if (
      calculatorInput.length >= 8
    ) {
      return;
    }

    calculatorInput += key;
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


  const value =
    Number(calculatorInput);


  if (
    !Number.isFinite(value)
  ) {
    return;
  }


  player.results[
    activeCalculatorTest.key
  ] = value;


  savePlayers();

  closeCalculator();

  renderEverything();

  renderTestView();
}


/* =========================================================
   SQUAT ASSESSMENT
========================================================= */

function updateSquatButtons() {

  squatPassButton.classList.remove(
    "pass-selected"
  );

  squatFailButton.classList.remove(
    "fail-selected"
  );


  if (
    selectedSquatStatus === "PASS"
  ) {

    squatPassButton.classList.add(
      "pass-selected"
    );
  }


  if (
    selectedSquatStatus === "FAIL"
  ) {

    squatFailButton.classList.add(
      "fail-selected"
    );
  }
}


function saveSquatAssessment() {

  const player =
    getCurrentPlayer();

  if (!player) {
    return;
  }


  if (!selectedSquatStatus) {

    alert(
      "Select PASS or FAIL before saving."
    );

    return;
  }


  player.results.squat = {

    status:
      selectedSquatStatus,

    notes:
      squatNotes.value.trim()
  };


  savePlayers();

  renderEverything();

  updateSquatButtons();
}


/* =========================================================
   TIMER SYSTEM
========================================================= */

function createTimer({
  displayElement,
  buttonElement,
  attemptsElement,
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


  function start() {

    if (running) {
      stop();
      return;
    }


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


  function stop() {

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
      resultKey
    );

    renderPlayersTable();
    renderResultsTable();
  }


  function cancel() {

    if (running) {

      cancelAnimationFrame(
        animationFrame
      );
    }


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
    start
  );


  attemptsElement.addEventListener(
    "click",
    event => {

      const deleteButton =
        event.target.closest(
          ".delete-attempt"
        );


      if (!deleteButton) {
        return;
      }


      const player =
        getCurrentPlayer();

      if (!player) {
        return;
      }


      const index =
        Number(
          deleteButton.dataset.index
        );


      player.results[
        resultKey
      ].splice(index, 1);


      savePlayers();


      renderTimerAttempts(
        attemptsElement,
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
   RENDER TIMER ATTEMPTS
========================================================= */

function renderTimerAttempts(
  container,
  resultKey
) {

  const player =
    getCurrentPlayer();


  if (!player) {

    container.innerHTML = "";

    return;
  }


  const attempts =
    player.results[resultKey] || [];


  if (attempts.length === 0) {

    container.innerHTML = `
      <div class="attempt-row">
        <span>No attempts yet</span>
      </div>
    `;

    return;
  }


  const best =
    Math.min(...attempts);


  container.innerHTML =
    attempts.map(
      (attempt, index) => {

        const isBest =
          Number(attempt) ===
          Number(best);


        return `
          <div class="attempt-row">

            <span>
              Attempt ${index + 1}
              ${
                isBest
                  ? " • BEST"
                  : ""
              }
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
   TIMER SETUP
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

    resultKey:
      "tenYard"
  });


timerControllers = [
  fiveTenFiveController,
  tenYardController
];


function cancelAllTimers() {

  timerControllers.forEach(
    controller =>
      controller.cancel()
  );
}


function renderAllTimerAttempts() {

  renderTimerAttempts(
    document.getElementById(
      "fiveTenFiveAttempts"
    ),
    "fiveTenFive"
  );


  renderTimerAttempts(
    document.getElementById(
      "tenYardAttempts"
    ),
    "tenYard"
  );
}


/* =========================================================
   MAIN EVENT LISTENERS
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
   SEARCH / FILTER EVENTS
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
   TABLE TEST BUTTONS
========================================================= */

playersTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".test-button"
      );

    if (!button) {
      return;
    }

    openPlayerTest(
      button.dataset.playerId
    );
  }
);


resultsTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".test-button"
      );

    if (!button) {
      return;
    }

    openPlayerTest(
      button.dataset.playerId
    );
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

    if (
      event.target === addPlayerModal
    ) {

      closeAddPlayerModal();
    }
  }
);


/* =========================================================
   PLAYER DRAWER EVENTS
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

    if (!button) {
      return;
    }

    openPlayerTest(
      button.dataset.playerId
    );
  }
);


/* =========================================================
   NUMBER TEST EVENTS
========================================================= */

document
  .querySelectorAll(".number-test")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => openCalculator(card)
    );
  });


calculatorButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      calculatorKeyPress(
        button.dataset.key
      );
    }
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

    if (
      event.target === numberModal
    ) {

      closeCalculator();
    }
  }
);


/* =========================================================
   SQUAT EVENTS
========================================================= */

squatPassButton.addEventListener(
  "click",
  () => {

    selectedSquatStatus = "PASS";

    updateSquatButtons();
  }
);


squatFailButton.addEventListener(
  "click",
  () => {

    selectedSquatStatus = "FAIL";

    updateSquatButtons();
  }
);


saveSquatButton.addEventListener(
  "click",
  saveSquatAssessment
);


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    /*
      Close overlays with Escape.
    */

    if (event.key === "Escape") {

      closeCalculator();
      closeAddPlayerModal();
      closePlayerDrawer();

      return;
    }


    /*
      Calculator keyboard support.
    */

    if (
      !numberModal.classList.contains(
        "show"
      )
    ) {
      return;
    }


    if (
      /^[0-9]$/.test(event.key)
    ) {

      calculatorKeyPress(
        event.key
      );

      return;
    }


    if (event.key === ".") {

      calculatorKeyPress(".");

      return;
    }


    if (
      event.key === "Backspace"
    ) {

      calculatorKeyPress(
        "backspace"
      );

      return;
    }


    if (
      event.key === "Enter"
    ) {

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
   START APPLICATION
========================================================= */

renderEverything();

showView("players");
