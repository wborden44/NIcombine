import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
  getFirestore,
  collection,
  collectionGroup,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyAJxv5u5UfWETCKQjEl3JLT1W2CMR17oeY",

  authDomain:
    "ni-kennesaw-combine.firebaseapp.com",

  projectId:
    "ni-kennesaw-combine",

  storageBucket:
    "ni-kennesaw-combine.firebasestorage.app",

  messagingSenderId:
    "963104261958",

  appId:
    "1:963104261958:web:1a3aa62125299084f30747"

};


const app =
  initializeApp(firebaseConfig);


const auth =
  getAuth(app);


const db =
  getFirestore(app);


setPersistence(
  auth,
  browserLocalPersistence
).catch(console.error);



/* =========================================================
   EVENT CONFIGURATION
========================================================= */

const EVENT_CONFIG = {

  pulldown: {
    label: "Pulldown",
    unit: "MPH",
    direction: "high",
    decimals: 1,
    average: true
  },

  exitVelo: {
    label: "Exit Velo",
    unit: "MPH",
    direction: "high",
    decimals: 1,
    average: true
  },

  internalRotation: {
    label: "Internal Rotation",
    unit: "°",
    direction: "high",
    decimals: 1
  },

  externalRotation: {
    label: "External Rotation",
    unit: "°",
    direction: "high",
    decimals: 1
  },

  dynoInternal: {
    label: "Dynamometer Internal",
    unit: "LB",
    direction: "high",
    decimals: 1
  },

  dynoExternal: {
    label: "Dynamometer External",
    unit: "LB",
    direction: "high",
    decimals: 1
  },

  gripLeft: {
    label: "Grip Left",
    unit: "LB",
    direction: "high",
    decimals: 1
  },

  gripRight: {
    label: "Grip Right",
    unit: "LB",
    direction: "high",
    decimals: 1
  },

  medBallLeft: {
    label: "Med Ball Left",
    unit: "IN",
    direction: "high",
    decimals: 1
  },

  medBallRight: {
    label: "Med Ball Right",
    unit: "IN",
    direction: "high",
    decimals: 1
  },

  fiveTenFive: {
    label: "5 / 10 / 5",
    unit: "s",
    direction: "low",
    decimals: 2,
    timer: true
  },

  tenYard: {
    label: "10-Yard Shuttle",
    unit: "s",
    direction: "low",
    decimals: 2,
    timer: true
  },

  broadJump: {
    label: "Broad Jump",
    unit: "IN",
    direction: "high",
    decimals: 1
  }

};


const RANKED_EVENTS =
  Object.keys(EVENT_CONFIG);


const TOTAL_RANKED_EVENTS =
  RANKED_EVENTS.length;



/* =========================================================
   RESULT SORTING
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
    type: "number",
    defaultDirection: "asc"
  },

  combineScore: {
    type: "number",
    defaultDirection: "asc"
  },

  squat: {
    type: "squat",
    defaultDirection: "asc"
  }

};


RANKED_EVENTS.forEach(
  key => {

    SORT_CONFIG[key] = {

      type: "number",

      defaultDirection:
        EVENT_CONFIG[key].direction === "low"
          ? "asc"
          : "desc"

    };

  }
);



/* =========================================================
   STATE
========================================================= */

let players = [];

let attempts = [];

let currentPlayerId = null;

let activeCalculatorTest = null;

let calculatorInput = "";

let timerControllers = [];

let unsubscribePlayers = null;

let unsubscribeAttempts = null;

let squatNotesSaveTimer = null;


let resultsSort = {
  key: "combineScore",
  direction: "asc"
};



/* =========================================================
   DOM — LOGIN
========================================================= */

const loginView =
  document.getElementById("loginView");

const appShell =
  document.getElementById("appShell");

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginError =
  document.getElementById("loginError");

const logoutButton =
  document.getElementById("logoutButton");

const signedInUser =
  document.getElementById("signedInUser");



/* =========================================================
   DOM — APP
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
   DOM — ADD PLAYER
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
   DOM — DRAWER
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
   DOM — CALCULATOR
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
   DOM — SQUAT
========================================================= */

const squatPassButton =
  document.getElementById("squatPassButton");

const squatFailButton =
  document.getElementById("squatFailButton");

const squatNotes =
  document.getElementById("squatNotes");



/* =========================================================
   PLAYER NORMALIZATION
========================================================= */

function normalizePlayer(raw) {

  const oldSquat =
    raw.squat ||
    raw.results?.squat ||
    {};


  return {

    ...raw,

    squat: {

      status:
        oldSquat.status || null,

      notes:
        oldSquat.notes || ""

    }

  };

}



/* =========================================================
   AUTH
========================================================= */

function showLogin(message = "") {

  loginError.textContent =
    message;

  loginView.classList.remove(
    "hidden"
  );

  appShell.classList.add(
    "hidden"
  );

}


function showApp(user) {

  loginError.textContent = "";

  loginView.classList.add(
    "hidden"
  );

  appShell.classList.remove(
    "hidden"
  );

  signedInUser.textContent =
    user.email || "SIGNED IN";

  showView("players");

}


function authErrorMessage(error) {

  switch (error.code) {

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":

      return "Incorrect email or password.";

    case "auth/user-disabled":

      return "This account has been disabled.";

    case "auth/too-many-requests":

      return "Too many attempts. Try again later.";

    case "auth/network-request-failed":

      return "Network error. Check your connection.";

    default:

      return "Sign-in failed.";

  }

}


async function isApprovedStaff(user) {

  const snap =
    await getDoc(

      doc(
        db,
        "staff",
        user.uid
      )

    );

  return snap.exists();

}



/* =========================================================
   FIRESTORE REALTIME LISTENERS
========================================================= */

function stopDataListeners() {

  if (unsubscribePlayers) {

    unsubscribePlayers();

    unsubscribePlayers = null;

  }


  if (unsubscribeAttempts) {

    unsubscribeAttempts();

    unsubscribeAttempts = null;

  }

}


function renderAfterDatabaseChange() {

  renderEverything();


  if (
    currentPlayerId &&
    getCurrentPlayer() &&
    testView.classList.contains("active-view")
  ) {

    renderTestView();

  }

}


function startDataListeners() {

  stopDataListeners();


  unsubscribePlayers =
    onSnapshot(

      collection(
        db,
        "players"
      ),

      snapshot => {

        players =
          snapshot.docs.map(
            playerDoc =>

              normalizePlayer({

                id:
                  playerDoc.id,

                ...playerDoc.data()

              })

          );

        renderAfterDatabaseChange();

      },

      error => {

        console.error(
          "Player listener failed:",
          error
        );

        alert(
          "Could not load players."
        );

      }

    );


  unsubscribeAttempts =
    onSnapshot(

      collectionGroup(
        db,
        "attempts"
      ),

      snapshot => {

        attempts =
          snapshot.docs.map(
            attemptDoc => {

              const data =
                attemptDoc.data();

              const parentPlayer =
                attemptDoc.ref.parent.parent;

              return {

                id:
                  attemptDoc.id,

                playerId:
                  data.playerId ||
                  parentPlayer?.id ||
                  "",

                ...data

              };

            }
          );

        renderAfterDatabaseChange();

      },

      error => {

        console.error(
          "Attempt listener failed:",
          error
        );

        alert(
          "Could not load measurement attempts. Check your Firestore rules."
        );

      }

    );

}



/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,

  async user => {

    if (!user) {

      stopDataListeners();

      players = [];
      attempts = [];

      currentPlayerId = null;

      showLogin();

      return;

    }


    try {

      const approved =
        await isApprovedStaff(user);


      if (!approved) {

        await signOut(auth);

        showLogin(
          "This account is not approved."
        );

        return;

      }


      showApp(user);

      startDataListeners();

    } catch (error) {

      console.error(
        "Staff verification failed:",
        error
      );

      await signOut(auth)
        .catch(() => {});

      showLogin(
        "Could not verify staff access."
      );

    }

  }
);



/* =========================================================
   LOGIN EVENTS
========================================================= */

loginForm.addEventListener(
  "submit",

  async event => {

    event.preventDefault();

    loginError.textContent = "";

    loginButton.disabled = true;

    loginButton.textContent =
      "SIGNING IN...";


    try {

      await signInWithEmailAndPassword(

        auth,

        loginEmail.value.trim(),

        loginPassword.value

      );

      loginPassword.value = "";

    } catch (error) {

      loginError.textContent =
        authErrorMessage(error);

    } finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "SIGN IN";

    }

  }
);


logoutButton.addEventListener(
  "click",

  async () => {

    cancelAllTimers();

    closePlayerDrawer();

    closeCalculator();

    closeAddPlayerModal();

    await signOut(auth);

  }
);



/* =========================================================
   UTILITIES
========================================================= */

function getCurrentPlayer() {

  return players.find(
    player =>
      player.id === currentPlayerId
  );

}


function ageNumber(ageGroup) {

  return (
    parseInt(ageGroup, 10) ||
    999
  );

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

    Number.isFinite(
      Number(value)
    )

  );

}


function attemptTime(attempt) {

  if (
    attempt.createdAt &&
    typeof attempt.createdAt.toMillis === "function"
  ) {

    return attempt.createdAt.toMillis();

  }

  return Number(
    attempt.clientCreatedAt || 0
  );

}


function formatAttemptTime(attempt) {

  let date;


  if (
    attempt.createdAt &&
    typeof attempt.createdAt.toDate === "function"
  ) {

    date =
      attempt.createdAt.toDate();

  } else {

    date =
      new Date(
        attempt.clientCreatedAt ||
        Date.now()
      );

  }


  return date.toLocaleString(
    [],
    {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );

}


function coachName(attempt) {

  const email =
    attempt.enteredByEmail ||
    "staff";

  return email.includes("@")
    ? email.split("@")[0]
    : email;

}


function playerRef(playerId) {

  return doc(
    db,
    "players",
    playerId
  );

}



/* =========================================================
   ATTEMPT HELPERS
========================================================= */

function getActiveAttempts(
  playerId,
  eventKey
) {

  return attempts

    .filter(
      attempt =>

        attempt.playerId ===
          playerId &&

        attempt.eventKey ===
          eventKey &&

        attempt.active !== false &&

        isNumber(
          attempt.value
        )
    )

    .sort(
      (a, b) =>
        attemptTime(b) -
        attemptTime(a)
    );

}


function getBestAttemptValue(
  playerId,
  eventKey
) {

  const entries =
    getActiveAttempts(
      playerId,
      eventKey
    );


  if (!entries.length) {

    return null;

  }


  const values =
    entries.map(
      attempt =>
        Number(attempt.value)
    );


  if (
    EVENT_CONFIG[eventKey]
      .direction === "low"
  ) {

    return Math.min(...values);

  }


  return Math.max(...values);

}


function getAverageAttemptValue(
  playerId,
  eventKey
) {

  const entries =
    getActiveAttempts(
      playerId,
      eventKey
    );


  if (!entries.length) {

    return null;

  }


  return (
    entries.reduce(
      (sum, attempt) =>
        sum +
        Number(attempt.value),
      0
    )
    /
    entries.length
  );

}


function formatEventValue(
  eventKey,
  value
) {

  if (!isNumber(value)) {

    return "—";

  }


  return Number(value).toFixed(
    EVENT_CONFIG[eventKey]
      .decimals
  );

}



/* =========================================================
   ADD INDIVIDUAL ATTEMPT
========================================================= */

async function addMeasurementAttempt(
  playerId,
  eventKey,
  value
) {

  if (!auth.currentUser) {

    throw new Error(
      "Not signed in"
    );

  }


  await addDoc(

    collection(
      db,
      "players",
      playerId,
      "attempts"
    ),

    {

      playerId,

      eventKey,

      value:
        Number(value),

      active:
        true,

      enteredByUid:
        auth.currentUser.uid,

      enteredByEmail:
        auth.currentUser.email || "",

      createdAt:
        serverTimestamp(),

      clientCreatedAt:
        Date.now()

    }

  );

}



/* =========================================================
   VOID ATTEMPT

   The document stays in Firestore.
========================================================= */

async function voidAttempt(attempt) {

  if (!auth.currentUser) {

    return;

  }


  await updateDoc(

    doc(
      db,
      "players",
      attempt.playerId,
      "attempts",
      attempt.id
    ),

    {

      active:
        false,

      deletedAt:
        serverTimestamp(),

      deletedByUid:
        auth.currentUser.uid,

      deletedByEmail:
        auth.currentUser.email || ""

    }

  );

}



/* =========================================================
   RANKING
========================================================= */

function calculateRankings() {

  const rankingData = {};


  players.forEach(
    player => {

      rankingData[player.id] = {

        eventRanks: {},

        completedEvents: 0,

        combineScore: null,

        overallRank: null

      };

    }
  );


  const ageGroups =
    [
      ...new Set(
        players.map(
          player =>
            player.ageGroup
        )
      )
    ];


  ageGroups.forEach(
    ageGroup => {

      const agePlayers =
        players.filter(
          player =>
            player.ageGroup ===
            ageGroup
        );


      RANKED_EVENTS.forEach(
        eventKey => {

          const direction =
            EVENT_CONFIG[eventKey]
              .direction;


          const competitors =
            agePlayers

              .map(
                player => ({

                  player,

                  value:
                    getBestAttemptValue(
                      player.id,
                      eventKey
                    )

                })
              )

              .filter(
                item =>
                  isNumber(
                    item.value
                  )
              );


          competitors.sort(
            (a, b) =>

              direction === "low"

                ? a.value -
                  b.value

                : b.value -
                  a.value
          );


          let previousValue = null;

          let previousRank = null;


          competitors.forEach(
            (item, index) => {

              const rank =

                previousValue !== null &&
                item.value === previousValue

                  ? previousRank

                  : index + 1;


              rankingData[
                item.player.id
              ].eventRanks[
                eventKey
              ] = rank;


              previousValue =
                item.value;

              previousRank =
                rank;

            }
          );

        }
      );


      agePlayers.forEach(
        player => {

          const ranks =
            Object.values(

              rankingData[
                player.id
              ].eventRanks

            );


          rankingData[
            player.id
          ].completedEvents =
            ranks.length;


          if (
            ranks.length ===
            TOTAL_RANKED_EVENTS
          ) {

            rankingData[
              player.id
            ].combineScore =

              ranks.reduce(
                (sum, rank) =>
                  sum + rank,
                0
              )
              /
              ranks.length;

          }

        }
      );


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


          const rank =

            previousScore !== null &&
            Math.abs(
              score -
              previousScore
            ) < 0.000001

              ? previousRank

              : index + 1;


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

    }
  );


  return rankingData;

}



/* =========================================================
   MAIN PLAYER SORT
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
    players.filter(
      player => {

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
          player.ageGroup ===
            ageFilter;


        return (
          matchesSearch &&
          matchesAge
        );

      }
    );


  filtered =
    sortPlayersForMain(
      filtered,
      rankings
    );


  if (!filtered.length) {

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
    filtered.map(
      player => {

        const ranking =
          rankings[player.id];


        const rankDisplay =
          ranking.overallRank !== null

            ? `#${ranking.overallRank}`

            : "—";


        const scoreDisplay =
          ranking.combineScore !== null

            ? ranking.combineScore
                .toFixed(2)

            : `INCOMPLETE (${ranking.completedEvents}/${TOTAL_RANKED_EVENTS})`;


        return `

          <tr>

            <td class="rank-cell">
              ${rankDisplay}
            </td>

            <td>
              ${escapeHTML(
                player.firstName
              )}
            </td>

            <td>
              ${escapeHTML(
                player.lastName
              )}
            </td>

            <td>
              ${escapeHTML(
                player.ageGroup
              )}
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

      }
    ).join("");

}



/* =========================================================
   RESULTS SORTING
========================================================= */

function resultsSortValue(
  player,
  sortKey,
  rankings
) {

  switch (sortKey) {

    case "overallRank":

      return rankings[
        player.id
      ].overallRank;


    case "lastName":

      return `${player.lastName} ${player.firstName}`;


    case "ageGroup":

      return ageNumber(
        player.ageGroup
      );


    case "combineScore":

      return rankings[
        player.id
      ].combineScore;


    case "squat":

      return player.squat?.status || null;


    default:

      return getBestAttemptValue(
        player.id,
        sortKey
      );

  }

}


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
    SORT_CONFIG[
      resultsSort.key
    ];


  return [...playerList].sort(
    (a, b) => {

      const valueA =
        resultsSortValue(
          a,
          resultsSort.key,
          rankings
        );


      const valueB =
        resultsSortValue(
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


      if (
        missingA &&
        !missingB
      ) {

        return 1;

      }


      if (
        !missingA &&
        missingB
      ) {

        return -1;

      }


      if (
        missingA &&
        missingB
      ) {

        return fallbackPlayerSort(
          a,
          b
        );

      }


      let comparison = 0;


      if (
        config.type === "text"
      ) {

        comparison =
          String(valueA)
            .localeCompare(
              String(valueB)
            );

      }

      else if (
        config.type === "squat"
      ) {

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
        resultsSort.direction ===
        "desc"
      ) {

        comparison *= -1;

      }


      return comparison === 0

        ? fallbackPlayerSort(
            a,
            b
          )

        : comparison;

    }
  );

}


function updateSortHeaders() {

  document
    .querySelectorAll(
      ".sort-header"
    )
    .forEach(
      button => {

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
            resultsSort.direction ===
            "asc"

              ? "↑"

              : "↓";

        } else {

          indicator.textContent =
            "↕";

        }

      }
    );

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
    players.filter(
      player => {

        const normal =
          `${player.firstName} ${player.lastName}`
            .toLowerCase();

        const reverse =
          `${player.lastName} ${player.firstName}`
            .toLowerCase();


        return (

          (
            !search ||
            normal.includes(search) ||
            reverse.includes(search)
          )

          &&

          (
            ageFilter === "ALL" ||
            player.ageGroup ===
              ageFilter
          )

        );

      }
    );


  filtered =
    sortResultsPlayers(
      filtered,
      rankings
    );


  updateSortHeaders();


  if (!filtered.length) {

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
    filtered.map(
      player => {

        const ranking =
          rankings[player.id];


        const rank =
          ranking.overallRank !== null

            ? `#${ranking.overallRank}`

            : "—";


        const score =
          ranking.combineScore !== null

            ? ranking.combineScore
                .toFixed(2)

            : "—";


        const value =
          key =>
            formatEventValue(

              key,

              getBestAttemptValue(
                player.id,
                key
              )

            );


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
              ${escapeHTML(
                player.ageGroup
              )}
            </td>

            <td class="score-cell">
              ${score}
            </td>

            <td>${value("pulldown")}</td>

            <td>${value("exitVelo")}</td>

            <td>${value("internalRotation")}</td>

            <td>${value("externalRotation")}</td>

            <td>${value("dynoInternal")}</td>

            <td>${value("dynoExternal")}</td>

            <td>${value("gripLeft")}</td>

            <td>${value("gripRight")}</td>

            <td>${value("medBallLeft")}</td>

            <td>${value("medBallRight")}</td>

            <td>${value("fiveTenFive")}</td>

            <td>${value("tenYard")}</td>

            <td>
              ${escapeHTML(
                player.squat?.status ||
                "—"
              )}
            </td>

            <td>${value("broadJump")}</td>

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

      }
    ).join("");

}



/* =========================================================
   VIEW NAVIGATION
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


function openPlayerTest(playerId) {

  cancelAllTimers();

  currentPlayerId =
    playerId;


  if (!getCurrentPlayer()) {

    return;

  }


  closePlayerDrawer();

  showView("test");

}



/* =========================================================
   RENDER ATTEMPT HISTORY
========================================================= */

function renderAttemptHistory(
  playerId,
  eventKey,
  containerId
) {

  const container =
    document.getElementById(
      containerId
    );


  const entries =
    getActiveAttempts(
      playerId,
      eventKey
    );


  if (!entries.length) {

    container.innerHTML = `

      <div class="attempt-row">

        <span class="attempt-meta">
          No entries yet
        </span>

      </div>
    `;

    return;

  }


  const best =
    getBestAttemptValue(
      playerId,
      eventKey
    );


  const config =
    EVENT_CONFIG[eventKey];


  container.innerHTML =
    entries.map(
      attempt => {

        const attemptValue =
          Number(attempt.value);


        const isBest =
          Math.abs(
            attemptValue -
            best
          ) < 0.000001;


        return `

          <div
            class="attempt-row
            ${isBest ? "best-entry" : ""}"
          >

            <div class="attempt-info">

              <div class="attempt-value-line">

                <span class="attempt-value">

                  ${attemptValue.toFixed(
                    config.decimals
                  )}

                  ${escapeHTML(
                    config.unit
                  )}

                </span>


                ${
                  isBest

                    ? `
                      <span class="best-badge">
                        BEST
                      </span>
                    `

                    : ""
                }

              </div>


              <span class="attempt-meta">

                ${escapeHTML(
                  coachName(attempt)
                )}

                •

                ${escapeHTML(
                  formatAttemptTime(
                    attempt
                  )
                )}

              </span>

            </div>


            <button
              class="delete-attempt"
              data-attempt-id="${attempt.id}"
            >
              VOID
            </button>

          </div>
        `;

      }
    ).join("");

}



/* =========================================================
   RENDER TEST VIEW
========================================================= */

function renderMeasurementCard(
  player,
  eventKey,
  bestElementId,
  attemptsElementId,
  averageElementId = null
) {

  const best =
    getBestAttemptValue(
      player.id,
      eventKey
    );


  document.getElementById(
    bestElementId
  ).textContent =
    best !== null

      ? Number(best).toFixed(
          EVENT_CONFIG[eventKey]
            .decimals
        )

      : "—";


  if (averageElementId) {

    const average =
      getAverageAttemptValue(
        player.id,
        eventKey
      );


    document.getElementById(
      averageElementId
    ).textContent =
      average !== null

        ? Number(average).toFixed(
            EVENT_CONFIG[eventKey]
              .decimals
          )

        : "—";

  }


  renderAttemptHistory(
    player.id,
    eventKey,
    attemptsElementId
  );

}


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


  renderMeasurementCard(
    player,
    "pulldown",
    "pulldownBest",
    "pulldownAttempts",
    "pulldownAverage"
  );


  renderMeasurementCard(
    player,
    "exitVelo",
    "exitVeloBest",
    "exitVeloAttempts",
    "exitVeloAverage"
  );


  renderMeasurementCard(
    player,
    "internalRotation",
    "internalRotationBest",
    "internalRotationAttempts"
  );


  renderMeasurementCard(
    player,
    "externalRotation",
    "externalRotationBest",
    "externalRotationAttempts"
  );


  renderMeasurementCard(
    player,
    "dynoInternal",
    "dynoInternalBest",
    "dynoInternalAttempts"
  );


  renderMeasurementCard(
    player,
    "dynoExternal",
    "dynoExternalBest",
    "dynoExternalAttempts"
  );


  renderMeasurementCard(
    player,
    "gripLeft",
    "gripLeftBest",
    "gripLeftAttempts"
  );


  renderMeasurementCard(
    player,
    "gripRight",
    "gripRightBest",
    "gripRightAttempts"
  );


  renderMeasurementCard(
    player,
    "medBallLeft",
    "medBallLeftBest",
    "medBallLeftAttempts"
  );


  renderMeasurementCard(
    player,
    "medBallRight",
    "medBallRightBest",
    "medBallRightAttempts"
  );


  renderMeasurementCard(
    player,
    "fiveTenFive",
    "fiveTenFiveBest",
    "fiveTenFiveAttempts"
  );


  renderMeasurementCard(
    player,
    "tenYard",
    "tenYardBest",
    "tenYardAttempts"
  );


  renderMeasurementCard(
    player,
    "broadJump",
    "broadJumpBest",
    "broadJumpAttempts"
  );


  updateSquatButtons(
    player.squat?.status ||
    null
  );


  if (
    document.activeElement !==
    squatNotes
  ) {

    squatNotes.value =
      player.squat?.notes ||
      "";

  }

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


  setTimeout(
    () =>
      newPlayerFirstName.focus(),
    50
  );

}


function closeAddPlayerModal() {

  addPlayerModal.classList.remove(
    "show"
  );

}


async function addPlayer() {

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


  savePlayerButton.disabled = true;

  savePlayerButton.textContent =
    "ADDING...";


  try {

    const newRef =
      doc(
        collection(
          db,
          "players"
        )
      );


    await setDoc(
      newRef,
      {

        firstName,

        lastName,

        ageGroup,

        squat: {
          status: null,
          notes: ""
        },

        createdAt:
          serverTimestamp(),

        createdByUid:
          auth.currentUser.uid,

        createdByEmail:
          auth.currentUser.email || ""

      }
    );


    closeAddPlayerModal();


    currentPlayerId =
      newRef.id;


    showView("test");

  } catch (error) {

    console.error(
      "Could not add player:",
      error
    );

    alert(
      "Player could not be added."
    );

  } finally {

    savePlayerButton.disabled = false;

    savePlayerButton.textContent =
      "ADD PLAYER";

  }

}



/* =========================================================
   DRAWER
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


  const filtered =
    [...players]

      .filter(
        player => {

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

        }
      )

      .sort(
        (a, b) => {

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
      );


  if (!filtered.length) {

    drawerPlayerList.innerHTML = `

      <div class="empty-state">
        No players found.
      </div>
    `;

    return;

  }


  let html = "";

  let currentAge = null;


  filtered.forEach(
    player => {

      if (
        player.ageGroup !==
        currentAge
      ) {

        currentAge =
          player.ageGroup;


        html += `

          <div class="drawer-age-heading">

            ${escapeHTML(
              currentAge
            )}

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

    }
  );


  drawerPlayerList.innerHTML =
    html;

}



/* =========================================================
   CALCULATOR
========================================================= */

function openAttemptCalculator(button) {

  if (!getCurrentPlayer()) {

    return;

  }


  activeCalculatorTest = {

    key:
      button.dataset.attemptTest,

    label:
      button.dataset.label,

    unit:
      button.dataset.unit

  };


  calculatorInput = "";


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

  calculatorInput = "";

}


function updateCalculatorDisplay() {

  calculatorValue.textContent =
    calculatorInput;

}


function calculatorKeyPress(key) {

  if (key === "backspace") {

    calculatorInput =
      calculatorInput.slice(
        0,
        -1
      );

    updateCalculatorDisplay();

    return;

  }


  if (key === ".") {

    if (
      calculatorInput.includes(".")
    ) {

      return;

    }


    calculatorInput =
      calculatorInput === ""

        ? "0."

        : `${calculatorInput}.`;


    updateCalculatorDisplay();

    return;

  }


  if (
    calculatorInput.length >= 8
  ) {

    return;

  }


  calculatorInput =
    calculatorInput === "0"

      ? key

      : calculatorInput + key;


  updateCalculatorDisplay();

}


async function saveCalculatorResult() {

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

    alert(
      "Enter a result before saving."
    );

    return;

  }


  const value =
    Number(calculatorInput);


  if (!Number.isFinite(value)) {

    alert(
      "Enter a valid number."
    );

    return;

  }


  calculatorSaveButton.disabled =
    true;

  calculatorSaveButton.textContent =
    "SAVING...";


  try {

    await addMeasurementAttempt(

      player.id,

      activeCalculatorTest.key,

      value

    );


    closeCalculator();

  } catch (error) {

    console.error(
      "Could not save entry:",
      error
    );

    alert(
      "Entry could not be saved."
    );

  } finally {

    calculatorSaveButton.disabled =
      false;

    calculatorSaveButton.textContent =
      "SAVE ENTRY";

  }

}



/* =========================================================
   SQUAT
========================================================= */

function updateSquatButtons(status) {

  squatPassButton.classList.remove(
    "pass-selected"
  );

  squatFailButton.classList.remove(
    "fail-selected"
  );


  if (status === "PASS") {

    squatPassButton.classList.add(
      "pass-selected"
    );

  }


  if (status === "FAIL") {

    squatFailButton.classList.add(
      "fail-selected"
    );

  }

}


async function saveSquatStatus(status) {

  const player =
    getCurrentPlayer();


  if (!player) {

    return;

  }


  try {

    const logRef =
      doc(
        collection(
          db,
          "players",
          player.id,
          "squatEntries"
        )
      );


    const batch =
      writeBatch(db);


    batch.update(

      playerRef(
        player.id
      ),

      {

        "squat.status":
          status,

        updatedAt:
          serverTimestamp(),

        updatedByUid:
          auth.currentUser.uid,

        updatedByEmail:
          auth.currentUser.email || ""

      }

    );


    batch.set(

      logRef,

      {

        status,

        notesSnapshot:
          squatNotes.value,

        enteredAt:
          serverTimestamp(),

        enteredByUid:
          auth.currentUser.uid,

        enteredByEmail:
          auth.currentUser.email || ""

      }

    );


    await batch.commit();


    updateSquatButtons(
      status
    );

  } catch (error) {

    console.error(
      "Could not save squat:",
      error
    );

    alert(
      "Squat assessment could not be saved."
    );

  }

}


function queueSquatNotesSave() {

  const playerId =
    currentPlayerId;

  const notes =
    squatNotes.value;


  clearTimeout(
    squatNotesSaveTimer
  );


  squatNotesSaveTimer =
    setTimeout(

      async () => {

        if (!playerId) {

          return;

        }


        try {

          await updateDoc(

            playerRef(
              playerId
            ),

            {

              "squat.notes":
                notes,

              updatedAt:
                serverTimestamp(),

              updatedByUid:
                auth.currentUser.uid,

              updatedByEmail:
                auth.currentUser.email || ""

            }

          );

        } catch (error) {

          console.error(
            "Could not save notes:",
            error
          );

        }

      },

      600

    );

}



/* =========================================================
   TIMERS
========================================================= */

function createTimer({
  displayElement,
  buttonElement,
  eventKey
}) {

  let running = false;

  let saving = false;

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


  function startTimer() {

    if (saving) {

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


  async function stopTimer() {

    if (!running) {

      return;

    }


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


    buttonElement.classList.remove(
      "running"
    );


    displayElement.textContent =
      finalTime.toFixed(2);


    const player =
      getCurrentPlayer();


    if (!player) {

      buttonElement.textContent =
        "START";

      return;

    }


    saving = true;

    buttonElement.disabled = true;

    buttonElement.textContent =
      "SAVING...";


    try {

      await addMeasurementAttempt(

        player.id,

        eventKey,

        finalTime

      );

    } catch (error) {

      console.error(
        "Could not save timer:",
        error
      );

      alert(
        "Timed result could not be saved."
      );

    } finally {

      saving = false;

      buttonElement.disabled = false;

      buttonElement.textContent =
        "START";

    }

  }


  function toggleTimer() {

    if (saving) {

      return;

    }


    if (running) {

      stopTimer();

    } else {

      startTimer();

    }

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


    if (!saving) {

      buttonElement.disabled = false;

      buttonElement.textContent =
        "START";

    }


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


  return {
    cancel
  };

}


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

    eventKey:
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

    eventKey:
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



/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

  renderPlayersTable();

  renderResultsTable();

  renderPlayerDrawer();

}



/* =========================================================
   NAVIGATION EVENTS
========================================================= */

playersNavButton.addEventListener(
  "click",
  () =>
    showView("players")
);


resultsNavButton.addEventListener(
  "click",
  () =>
    showView("results")
);


mainResultsButton.addEventListener(
  "click",
  () =>
    showView("results")
);


backToPlayersButton.addEventListener(
  "click",
  () =>
    showView("players")
);



/* =========================================================
   SEARCH
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
   SORT EVENTS
========================================================= */

document
  .querySelectorAll(
    ".sort-header"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const sortKey =
            button.dataset.sort;


          if (
            !SORT_CONFIG[
              sortKey
            ]
          ) {

            return;

          }


          if (
            resultsSort.key ===
            sortKey
          ) {

            resultsSort.direction =
              resultsSort.direction ===
              "asc"

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

    }
  );



/* =========================================================
   PLAYER TEST BUTTONS
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

    if (
      event.target ===
      addPlayerModal
    ) {

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
   MEASUREMENT ENTRY BUTTONS
========================================================= */

document
  .querySelectorAll(
    ".add-attempt-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () =>
          openAttemptCalculator(
            button
          )
      );

    }
  );



/* =========================================================
   VOID ATTEMPT
========================================================= */

document.addEventListener(
  "click",

  async event => {

    const button =
      event.target.closest(
        ".delete-attempt"
      );


    if (!button) {

      return;

    }


    const attempt =
      attempts.find(
        item =>
          item.id ===
          button.dataset.attemptId
      );


    if (!attempt) {

      return;

    }


    button.disabled = true;

    button.textContent =
      "VOIDING...";


    try {

      await voidAttempt(
        attempt
      );

    } catch (error) {

      console.error(
        "Could not void attempt:",
        error
      );

      button.disabled = false;

      button.textContent =
        "VOID";

      alert(
        "Entry could not be voided."
      );

    }

  }
);



/* =========================================================
   CALCULATOR EVENTS
========================================================= */

calculatorButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () =>
        calculatorKeyPress(
          button.dataset.key
        )
    );

  }
);


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
      event.target ===
      numberModal
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
  () =>
    saveSquatStatus(
      "PASS"
    )
);


squatFailButton.addEventListener(
  "click",
  () =>
    saveSquatStatus(
      "FAIL"
    )
);


squatNotes.addEventListener(
  "input",
  queueSquatNotesSave
);



/* =========================================================
   KEYBOARD CALCULATOR
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeCalculator();

      closeAddPlayerModal();

      closePlayerDrawer();

      return;

    }


    if (
      !numberModal
        .classList
        .contains("show")
    ) {

      return;

    }


    if (
      /^[0-9]$/.test(
        event.key
      )
    ) {

      calculatorKeyPress(
        event.key
      );

      return;

    }


    if (
      event.key === "."
    ) {

      calculatorKeyPress(".");

      return;

    }


    if (
      event.key ===
      "Backspace"
    ) {

      calculatorKeyPress(
        "backspace"
      );

      return;

    }


    if (
      event.key ===
      "Enter"
    ) {

      saveCalculatorResult();

    }

  }
);



/* =========================================================
   START
========================================================= */

showLogin();
