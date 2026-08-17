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
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
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
   RANKED EVENTS
========================================================= */

const RANKED_EVENTS = [

  {
    key: "pulldown",
    direction: "high"
  },

  {
    key: "exitVelo",
    direction: "high"
  },

  {
    key: "internalRotation",
    direction: "high"
  },

  {
    key: "externalRotation",
    direction: "high"
  },

  {
    key: "dynoInternal",
    direction: "high"
  },

  {
    key: "dynoExternal",
    direction: "high"
  },

  {
    key: "gripLeft",
    direction: "high"
  },

  {
    key: "gripRight",
    direction: "high"
  },

  {
    key: "medBallLeft",
    direction: "high"
  },

  {
    key: "medBallRight",
    direction: "high"
  },

  {
    key: "fiveTenFive",
    direction: "low"
  },

  {
    key: "tenYard",
    direction: "low"
  },

  {
    key: "broadJump",
    direction: "high"
  }

];


const TOTAL_RANKED_EVENTS =
  RANKED_EVENTS.length;



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



/* =========================================================
   STATE
========================================================= */

let players = [];

let currentPlayerId = null;

let activeCalculatorTest = null;

let calculatorInput = "";

let selectedSquatStatus = null;

let timerControllers = [];

let unsubscribePlayers = null;

let resultsSort = {
  key: "combineScore",
  direction: "asc"
};

let squatNotesSaveTimer = null;



/* =========================================================
   DEFAULT RESULTS
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
   NORMALIZE DATABASE DATA
========================================================= */

function normalizePlayer(player) {

  const defaults =
    defaultResults();


  const old =
    player.results || {};


  const toArray =
    value => {

      if (
        Array.isArray(value)
      ) {

        return value
          .map(Number)
          .filter(Number.isFinite);

      }


      if (
        isNumber(value)
      ) {

        return [
          Number(value)
        ];

      }


      return [];

    };


  return {

    ...player,


    results: {

      ...defaults,

      ...old,


      pulldown:
        toArray(
          old.pulldown
        ),


      exitVelo:
        toArray(
          old.exitVelo
        ),


      fiveTenFive:
        toArray(
          old.fiveTenFive
        ),


      tenYard:
        toArray(
          old.tenYard
        ),


      squat: {

        ...defaults.squat,

        ...(old.squat || {})

      }

    }

  };

}



/* =========================================================
   DOM — LOGIN
========================================================= */

const loginView =
  document.getElementById(
    "loginView"
  );


const appShell =
  document.getElementById(
    "appShell"
  );


const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginEmail =
  document.getElementById(
    "loginEmail"
  );


const loginPassword =
  document.getElementById(
    "loginPassword"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginError =
  document.getElementById(
    "loginError"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


const signedInUser =
  document.getElementById(
    "signedInUser"
  );



/* =========================================================
   DOM — APP
========================================================= */

const playersView =
  document.getElementById(
    "playersView"
  );


const resultsView =
  document.getElementById(
    "resultsView"
  );


const testView =
  document.getElementById(
    "testView"
  );


const playersNavButton =
  document.getElementById(
    "playersNavButton"
  );


const resultsNavButton =
  document.getElementById(
    "resultsNavButton"
  );


const mainResultsButton =
  document.getElementById(
    "mainResultsButton"
  );


const backToPlayersButton =
  document.getElementById(
    "backToPlayersButton"
  );


const playersTableBody =
  document.getElementById(
    "playersTableBody"
  );


const resultsTableBody =
  document.getElementById(
    "resultsTableBody"
  );


const playerSearch =
  document.getElementById(
    "playerSearch"
  );


const playerAgeFilter =
  document.getElementById(
    "playerAgeFilter"
  );


const resultsSearch =
  document.getElementById(
    "resultsSearch"
  );


const resultsAgeFilter =
  document.getElementById(
    "resultsAgeFilter"
  );


const testPlayerName =
  document.getElementById(
    "testPlayerName"
  );


const testPlayerAge =
  document.getElementById(
    "testPlayerAge"
  );



/* =========================================================
   DOM — ADD PLAYER
========================================================= */

const addPlayerButton =
  document.getElementById(
    "addPlayerButton"
  );


const addPlayerModal =
  document.getElementById(
    "addPlayerModal"
  );


const closeAddPlayerButton =
  document.getElementById(
    "closeAddPlayerButton"
  );


const savePlayerButton =
  document.getElementById(
    "savePlayerButton"
  );


const newPlayerFirstName =
  document.getElementById(
    "newPlayerFirstName"
  );


const newPlayerLastName =
  document.getElementById(
    "newPlayerLastName"
  );


const newPlayerAgeGroup =
  document.getElementById(
    "newPlayerAgeGroup"
  );



/* =========================================================
   DOM — DRAWER
========================================================= */

const indexButton =
  document.getElementById(
    "indexButton"
  );


const playerDrawer =
  document.getElementById(
    "playerDrawer"
  );


const drawerBackdrop =
  document.getElementById(
    "drawerBackdrop"
  );


const closeDrawerButton =
  document.getElementById(
    "closeDrawerButton"
  );


const drawerSearch =
  document.getElementById(
    "drawerSearch"
  );


const drawerPlayerList =
  document.getElementById(
    "drawerPlayerList"
  );



/* =========================================================
   DOM — CALCULATOR
========================================================= */

const numberModal =
  document.getElementById(
    "numberModal"
  );


const calculatorLabel =
  document.getElementById(
    "calculatorLabel"
  );


const calculatorValue =
  document.getElementById(
    "calculatorValue"
  );


const calculatorUnit =
  document.getElementById(
    "calculatorUnit"
  );


const calculatorSaveButton =
  document.getElementById(
    "calculatorSaveButton"
  );


const closeCalculatorButton =
  document.getElementById(
    "closeCalculatorButton"
  );


const calculatorButtons =
  document.querySelectorAll(
    ".calculator-grid button"
  );



/* =========================================================
   DOM — SQUAT
========================================================= */

const squatPassButton =
  document.getElementById(
    "squatPassButton"
  );


const squatFailButton =
  document.getElementById(
    "squatFailButton"
  );


const squatNotes =
  document.getElementById(
    "squatNotes"
  );



/* =========================================================
   AUTHENTICATION
========================================================= */

function showLogin(
  message = ""
) {

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

  loginError.textContent =
    "";


  loginView.classList.add(
    "hidden"
  );


  appShell.classList.remove(
    "hidden"
  );


  signedInUser.textContent =
    user.email ||
    "SIGNED IN";


  showView(
    "players"
  );

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

      return "Too many sign-in attempts. Try again later.";


    case "auth/network-request-failed":

      return "Network error. Check your connection and try again.";


    default:

      return "Sign-in failed. Check your information and try again.";

  }

}



async function isApprovedStaff(
  user
) {

  const staffSnap =
    await getDoc(

      doc(
        db,
        "staff",
        user.uid
      )

    );


  return staffSnap.exists();

}



/* =========================================================
   REAL-TIME PLAYER DATABASE
========================================================= */

function startPlayersListener() {

  if (
    unsubscribePlayers
  ) {

    unsubscribePlayers();

  }


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


        renderEverything();


        if (
          currentPlayerId &&
          getCurrentPlayer()
        ) {

          renderTestView();

        }

      },


      error => {

        console.error(
          "Player listener failed:",
          error
        );


        alert(
          "The player database could not be loaded. Check Firebase permissions and your connection."
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


      if (
        unsubscribePlayers
      ) {

        unsubscribePlayers();

        unsubscribePlayers =
          null;

      }


      players = [];

      currentPlayerId =
        null;


      showLogin();


      return;

    }


    try {


      const approved =
        await isApprovedStaff(
          user
        );


      if (!approved) {


        await signOut(
          auth
        );


        showLogin(
          "This account is not approved for Combine access."
        );


        return;

      }


      showApp(
        user
      );


      startPlayersListener();


    } catch (error) {


      console.error(
        "Staff verification failed:",
        error
      );


      await signOut(
        auth
      ).catch(
        () => {}
      );


      showLogin(
        "Could not verify staff access. Check Firestore rules and try again."
      );

    }

  }

);



/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",

  async event => {


    event.preventDefault();


    loginError.textContent =
      "";


    loginButton.disabled =
      true;


    loginButton.textContent =
      "SIGNING IN...";


    try {


      await signInWithEmailAndPassword(

        auth,

        loginEmail.value.trim(),

        loginPassword.value

      );


      loginPassword.value =
        "";


    } catch (error) {


      loginError.textContent =
        authErrorMessage(
          error
        );


    } finally {


      loginButton.disabled =
        false;


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


    await signOut(
      auth
    );

  }

);



/* =========================================================
   FIRESTORE HELPERS
========================================================= */

function playerRef(
  playerId
) {

  return doc(
    db,
    "players",
    playerId
  );

}



async function updatePlayerFields(
  playerId,
  fields
) {

  if (
    !auth.currentUser
  ) {

    throw new Error(
      "Not signed in"
    );

  }


  await updateDoc(

    playerRef(
      playerId
    ),

    {

      ...fields,


      updatedAt:
        serverTimestamp(),


      updatedBy:
        auth.currentUser.uid

    }

  );

}



/* =========================================================
   UTILITIES
========================================================= */

function getCurrentPlayer() {

  return players.find(
    player =>
      player.id ===
      currentPlayerId
  );

}



function ageNumber(
  ageGroup
) {

  return (
    parseInt(
      ageGroup,
      10
    ) ||
    999
  );

}



function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



function isNumber(
  value
) {

  return (

    value !== null &&

    value !== "" &&

    Number.isFinite(
      Number(value)
    )

  );

}



function formatValue(
  value,
  decimals = 1
) {

  if (
    !isNumber(value)
  ) {

    return "—";

  }


  const number =
    Number(value);


  if (
    Number.isInteger(
      number
    )
  ) {

    return number.toString();

  }


  return number.toFixed(
    decimals
  );

}



/* =========================================================
   ATTEMPT CALCULATIONS
========================================================= */

function maxAttempt(
  attempts
) {

  if (

    !Array.isArray(
      attempts
    ) ||

    attempts.length === 0

  ) {

    return null;

  }


  const values =
    attempts

      .map(Number)

      .filter(
        Number.isFinite
      );


  return values.length

    ? Math.max(
        ...values
      )

    : null;

}



function averageAttempt(
  attempts
) {

  if (

    !Array.isArray(
      attempts
    ) ||

    attempts.length === 0

  ) {

    return null;

  }


  const values =
    attempts

      .map(Number)

      .filter(
        Number.isFinite
      );


  if (
    !values.length
  ) {

    return null;

  }


  return (

    values.reduce(

      (sum, value) =>
        sum + value,

      0

    )

    /

    values.length

  );

}



function bestTime(
  attempts
) {

  if (

    !Array.isArray(
      attempts
    ) ||

    attempts.length === 0

  ) {

    return null;

  }


  const values =
    attempts

      .map(Number)

      .filter(
        Number.isFinite
      );


  return values.length

    ? Math.min(
        ...values
      )

    : null;

}



/* =========================================================
   EVENT VALUE FOR RANKING
========================================================= */

function getEventValue(
  player,
  eventKey
) {

  if (!player) {

    return null;

  }


  if (

    eventKey ===
      "pulldown" ||

    eventKey ===
      "exitVelo"

  ) {

    return maxAttempt(

      player.results[
        eventKey
      ]

    );

  }


  if (
    eventKey ===
    "fiveTenFive"
  ) {

    return bestTime(
      player.results.fiveTenFive
    );

  }


  if (
    eventKey ===
    "tenYard"
  ) {

    return bestTime(
      player.results.tenYard
    );

  }


  const value =
    player.results[
      eventKey
    ];


  return isNumber(
    value
  )

    ? Number(value)

    : null;

}



/* =========================================================
   RANKING ENGINE
========================================================= */

function calculateRankings() {

  const rankingData =
    {};


  players.forEach(
    player => {


      rankingData[
        player.id
      ] = {

        eventRanks:
          {},

        completedEvents:
          0,

        combineScore:
          null,

        overallRank:
          null

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
        event => {


          const competitors =
            agePlayers

              .map(
                player => ({

                  player,

                  value:
                    getEventValue(
                      player,
                      event.key
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

              event.direction ===
              "low"

                ? a.value -
                  b.value

                : b.value -
                  a.value

          );


          let previousValue =
            null;


          let previousRank =
            null;


          competitors.forEach(
            (item, index) => {


              const rank =

                previousValue !==
                  null &&

                item.value ===
                  previousValue

                  ? previousRank

                  : index + 1;


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
              ].combineScore !==
              null
          )

          .sort(
            (a, b) =>

              rankingData[
                a.id
              ].combineScore

              -

              rankingData[
                b.id
              ].combineScore

          );


      let previousScore =
        null;


      let previousRank =
        null;


      eligible.forEach(
        (player, index) => {


          const score =
            rankingData[
              player.id
            ].combineScore;


          const rank =

            previousScore !==
              null &&

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
   PLAYER TABLE
========================================================= */

function sortPlayersForMain(
  playerList,
  rankings
) {

  return [
    ...playerList
  ].sort(
    (a, b) => {


      const ageDifference =

        ageNumber(
          a.ageGroup
        )

        -

        ageNumber(
          b.ageGroup
        );


      if (
        ageDifference !==
        0
      ) {

        return ageDifference;

      }


      const rankA =
        rankings[
          a.id
        ].overallRank;


      const rankB =
        rankings[
          b.id
        ].overallRank;


      if (

        rankA !== null &&

        rankB !== null &&

        rankA !== rankB

      ) {

        return (
          rankA -
          rankB
        );

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


      if (
        lastCompare !==
        0
      ) {

        return lastCompare;

      }


      return (
        a.firstName.localeCompare(
          b.firstName
        )
      );

    }
  );

}



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

          normal.includes(
            search
          ) ||

          reverse.includes(
            search
          );


        const matchesAge =

          ageFilter ===
            "ALL" ||

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


  if (
    !filtered.length
  ) {

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
    filtered

      .map(
        player => {


          const ranking =
            rankings[
              player.id
            ];


          const rankDisplay =

            ranking.overallRank !==
            null

              ? `#${ranking.overallRank}`

              : "—";


          const scoreDisplay =

            ranking.combineScore !==
            null

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
      )

      .join("");

}



/* =========================================================
   RESULTS SORTING
========================================================= */

function getResultsSortValue(
  player,
  sortKey,
  rankings
) {

  const ranking =
    rankings[
      player.id
    ];


  switch (
    sortKey
  ) {


    case "overallRank":

      return ranking.overallRank;


    case "lastName":

      return `${player.lastName} ${player.firstName}`;


    case "ageGroup":

      return ageNumber(
        player.ageGroup
      );


    case "combineScore":

      return ranking.combineScore;


    case "pulldown":

      return maxAttempt(
        player.results.pulldown
      );


    case "exitVelo":

      return maxAttempt(
        player.results.exitVelo
      );


    case "fiveTenFive":

      return bestTime(
        player.results.fiveTenFive
      );


    case "tenYard":

      return bestTime(
        player.results.tenYard
      );


    case "squat":

      return (
        player.results
          .squat
          ?.status ||
        null
      );


    default:

      return getEventValue(
        player,
        sortKey
      );

  }

}



function fallbackPlayerSort(
  a,
  b
) {

  const ageDifference =

    ageNumber(
      a.ageGroup
    )

    -

    ageNumber(
      b.ageGroup
    );


  if (
    ageDifference !==
    0
  ) {

    return ageDifference;

  }


  const lastCompare =
    a.lastName.localeCompare(
      b.lastName
    );


  if (
    lastCompare !==
    0
  ) {

    return lastCompare;

  }


  return (
    a.firstName.localeCompare(
      b.firstName
    )
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


  return [
    ...playerList
  ].sort(
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


      let comparison =
        0;


      if (
        config.type ===
        "text"
      ) {


        comparison =
          String(
            valueA
          ).localeCompare(
            String(
              valueB
            )
          );


      } else if (
        config.type ===
        "squat"
      ) {


        const order = {

          PASS:
            1,

          FAIL:
            2

        };


        comparison =

          (
            order[valueA] ||
            999
          )

          -

          (
            order[valueB] ||
            999
          );


      } else {


        comparison =

          Number(valueA)

          -

          Number(valueB);

      }


      if (

        resultsSort.direction ===
        "desc"

      ) {

        comparison *=
          -1;

      }


      return comparison ===
        0

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


        const matchesSearch =

          !search ||

          normal.includes(
            search
          ) ||

          reverse.includes(
            search
          );


        const matchesAge =

          ageFilter ===
            "ALL" ||

          player.ageGroup ===
            ageFilter;


        return (
          matchesSearch &&
          matchesAge
        );

      }
    );


  filtered =
    sortResultsPlayers(
      filtered,
      rankings
    );


  updateSortHeaders();


  if (
    !filtered.length
  ) {

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
    filtered

      .map(
        player => {


          const r =
            player.results;


          const ranking =
            rankings[
              player.id
            ];


          const rank =

            ranking.overallRank !==
            null

              ? `#${ranking.overallRank}`

              : "—";


          const score =

            ranking.combineScore !==
            null

              ? ranking.combineScore
                  .toFixed(2)

              : "—";


          const pulldown =
            maxAttempt(
              r.pulldown
            );


          const exitVelo =
            maxAttempt(
              r.exitVelo
            );


          const fiveTenFive =
            bestTime(
              r.fiveTenFive
            );


          const tenYard =
            bestTime(
              r.tenYard
            );


          const squat =
            r.squat?.status ||
            "—";


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

              <td>
                ${formatValue(
                  pulldown
                )}
              </td>

              <td>
                ${formatValue(
                  exitVelo
                )}
              </td>

              <td>
                ${formatValue(
                  r.internalRotation
                )}
              </td>

              <td>
                ${formatValue(
                  r.externalRotation
                )}
              </td>

              <td>
                ${formatValue(
                  r.dynoInternal
                )}
              </td>

              <td>
                ${formatValue(
                  r.dynoExternal
                )}
              </td>

              <td>
                ${formatValue(
                  r.gripLeft
                )}
              </td>

              <td>
                ${formatValue(
                  r.gripRight
                )}
              </td>

              <td>
                ${formatValue(
                  r.medBallLeft
                )}
              </td>

              <td>
                ${formatValue(
                  r.medBallRight
                )}
              </td>

              <td>

                ${
                  fiveTenFive !==
                  null

                    ? fiveTenFive
                        .toFixed(2)

                    : "—"
                }

              </td>

              <td>

                ${
                  tenYard !==
                  null

                    ? tenYard
                        .toFixed(2)

                    : "—"
                }

              </td>

              <td>
                ${escapeHTML(
                  squat
                )}
              </td>

              <td>
                ${formatValue(
                  r.broadJump
                )}
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
      )

      .join("");

}



/* =========================================================
   VIEWS
========================================================= */

function showView(
  viewName
) {

  if (
    viewName !==
    "test"
  ) {

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


  if (
    viewName ===
    "players"
  ) {


    playersView.classList.add(
      "active-view"
    );


    playersNavButton.classList.add(
      "active"
    );


    renderPlayersTable();


  } else if (
    viewName ===
    "results"
  ) {


    resultsView.classList.add(
      "active-view"
    );


    resultsNavButton.classList.add(
      "active"
    );


    renderResultsTable();


  } else if (
    viewName ===
    "test"
  ) {


    testView.classList.add(
      "active-view"
    );


    renderTestView();

  }


  window.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });

}



function openPlayerTest(
  playerId
) {

  cancelAllTimers();


  currentPlayerId =
    playerId;


  const player =
    getCurrentPlayer();


  if (!player) {

    return;

  }


  selectedSquatStatus =
    player.results
      .squat
      ?.status ||
    null;


  closePlayerDrawer();


  showView(
    "test"
  );

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


  [

    "internalRotation",

    "externalRotation",

    "dynoInternal",

    "dynoExternal",

    "gripLeft",

    "gripRight",

    "medBallLeft",

    "medBallRight",

    "broadJump"

  ].forEach(
    key => {


      const element =
        document.getElementById(
          `${key}Value`
        );


      if (
        element
      ) {

        element.textContent =
          formatValue(
            player.results[
              key
            ]
          );

      }

    }
  );


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
    player.results
      .squat
      ?.status ||
    null;


  squatNotes.value =
    player.results
      .squat
      ?.notes ||
    "";


  updateSquatButtons();


  renderAllTimerAttempts();

}



/* =========================================================
   ADD PLAYER
========================================================= */

function openAddPlayerModal() {

  newPlayerFirstName.value =
    "";


  newPlayerLastName.value =
    "";


  newPlayerAgeGroup.value =
    "";


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
    newPlayerFirstName.value
      .trim();


  const lastName =
    newPlayerLastName.value
      .trim();


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


  savePlayerButton.disabled =
    true;


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


    const newPlayer = {

      firstName,

      lastName,

      ageGroup,


      results:
        defaultResults(),


      createdAt:
        serverTimestamp(),


      createdBy:
        auth.currentUser.uid,


      updatedAt:
        serverTimestamp(),


      updatedBy:
        auth.currentUser.uid

    };


    await setDoc(
      newRef,
      newPlayer
    );


    if (

      !players.some(
        player =>
          player.id ===
          newRef.id
      )

    ) {


      players.push(

        normalizePlayer({

          id:
            newRef.id,

          ...newPlayer

        })

      );

    }


    closeAddPlayerModal();


    renderEverything();


    openPlayerTest(
      newRef.id
    );


  } catch (error) {


    console.error(
      "Could not add player:",
      error
    );


    alert(
      "Player could not be added. Check your connection and Firebase permissions."
    );


  } finally {


    savePlayerButton.disabled =
      false;


    savePlayerButton.textContent =
      "ADD PLAYER";

  }

}



/* =========================================================
   PLAYER DRAWER
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
    players

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

            normal.includes(
              search
            ) ||

            reverse.includes(
              search
            )

          );

        }
      )

      .sort(
        (a, b) => {


          const ageDifference =

            ageNumber(
              a.ageGroup
            )

            -

            ageNumber(
              b.ageGroup
            );


          if (
            ageDifference !==
            0
          ) {

            return ageDifference;

          }


          const lastCompare =
            a.lastName.localeCompare(
              b.lastName
            );


          if (
            lastCompare !==
            0
          ) {

            return lastCompare;

          }


          return (
            a.firstName.localeCompare(
              b.firstName
            )
          );

        }
      );


  if (
    !filtered.length
  ) {


    drawerPlayerList.innerHTML = `

      <div class="empty-state">
        No players found.
      </div>

    `;


    return;

  }


  let html =
    "";


  let currentAge =
    null;


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

function openCalculator(
  card
) {

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

    isNumber(
      existing
    )

      ? String(
          existing
        )

      : "";


  calculatorLabel.textContent =
    activeCalculatorTest.label;


  calculatorUnit.textContent =
    activeCalculatorTest.unit;


  updateCalculatorDisplay();


  numberModal.classList.add(
    "show"
  );

}



function openAttemptCalculator(
  button
) {

  if (
    !getCurrentPlayer()
  ) {

    return;

  }


  activeCalculatorTest = {

    key:
      button.dataset
        .attemptTest,

    label:
      button.dataset.label,

    unit:
      button.dataset.unit,

    isAttempt:
      true

  };


  calculatorInput =
    "";


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


  activeCalculatorTest =
    null;


  calculatorInput =
    "";

}



function updateCalculatorDisplay() {

  calculatorValue.textContent =
    calculatorInput;

}



function calculatorKeyPress(
  key
) {

  if (
    key ===
    "backspace"
  ) {


    calculatorInput =
      calculatorInput.slice(
        0,
        -1
      );


    updateCalculatorDisplay();


    return;

  }


  if (
    key === "."
  ) {


    if (
      calculatorInput.includes(
        "."
      )
    ) {

      return;

    }


    calculatorInput =

      calculatorInput ===
      ""

        ? "0."

        : `${calculatorInput}.`;


    updateCalculatorDisplay();


    return;

  }


  if (
    calculatorInput.length >=
    8
  ) {

    return;

  }


  calculatorInput =

    calculatorInput ===
    "0"

      ? key

      : calculatorInput +
        key;


  updateCalculatorDisplay();

}



/* =========================================================
   SAVE RESULT
========================================================= */

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

    calculatorInput ===
      "" ||

    calculatorInput ===
      "." ||

    calculatorInput ===
      "0."

  ) {


    alert(
      "Enter a result before saving."
    );


    return;

  }


  const value =
    Number(
      calculatorInput
    );


  if (
    !Number.isFinite(
      value
    )
  ) {


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


    const key =
      activeCalculatorTest.key;


    if (
      activeCalculatorTest
        .isAttempt
    ) {


      const attempts =

        Array.isArray(
          player.results[
            key
          ]
        )

          ? [
              ...player.results[
                key
              ]
            ]

          : [];


      attempts.push(
        value
      );


      await updatePlayerFields(

        player.id,

        {
          [`results.${key}`]:
            attempts
        }

      );


      player.results[
        key
      ] = attempts;


    } else {


      await updatePlayerFields(

        player.id,

        {
          [`results.${key}`]:
            value
        }

      );


      player.results[
        key
      ] = value;

    }


    closeCalculator();


    renderEverything();


    renderTestView();


  } catch (error) {


    console.error(
      "Could not save result:",
      error
    );


    alert(
      "Result could not be saved. Check your connection."
    );


  } finally {


    calculatorSaveButton.disabled =
      false;


    calculatorSaveButton.textContent =
      "SAVE RESULT";

  }

}



/* =========================================================
   VELOCITY ATTEMPTS
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
      player.results[
        resultKey
      ]
    )

      ? player.results[
          resultKey
        ]

      : [];


  const max =
    maxAttempt(
      attempts
    );


  const average =
    averageAttempt(
      attempts
    );


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


  if (
    !attempts.length
  ) {


    container.innerHTML = `

      <div class="attempt-row">

        <span>
          No entries yet
        </span>

      </div>

    `;


    return;

  }


  const lastThree =
    attempts

      .map(
        (value, index) => ({

          value,

          originalIndex:
            index

        })
      )

      .slice(-3)

      .reverse();


  container.innerHTML =
    lastThree

      .map(
        item => `

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

        `
      )

      .join("");

}



async function deleteVelocityAttempt(
  resultKey,
  index
) {

  const player =
    getCurrentPlayer();


  if (

    !player ||

    !Array.isArray(
      player.results[
        resultKey
      ]
    )

  ) {

    return;

  }


  const attempts =
    [

      ...player.results[
        resultKey
      ]

    ];


  attempts.splice(
    index,
    1
  );


  try {


    await updatePlayerFields(

      player.id,

      {
        [`results.${resultKey}`]:
          attempts
      }

    );


    player.results[
      resultKey
    ] = attempts;


    renderEverything();


    renderTestView();


  } catch (error) {


    console.error(
      "Could not delete attempt:",
      error
    );


    alert(
      "Attempt could not be deleted."
    );

  }

}



/* =========================================================
   SQUAT
========================================================= */

function updateSquatButtons() {

  squatPassButton.classList.remove(
    "pass-selected"
  );


  squatFailButton.classList.remove(
    "fail-selected"
  );


  if (
    selectedSquatStatus ===
    "PASS"
  ) {

    squatPassButton.classList.add(
      "pass-selected"
    );

  }


  if (
    selectedSquatStatus ===
    "FAIL"
  ) {

    squatFailButton.classList.add(
      "fail-selected"
    );

  }

}



async function saveSquatStatus(
  status
) {

  const player =
    getCurrentPlayer();


  if (!player) {

    return;

  }


  try {


    await updatePlayerFields(

      player.id,

      {
        "results.squat.status":
          status
      }

    );


    player.results
      .squat
      .status =
        status;


    selectedSquatStatus =
      status;


    updateSquatButtons();


    renderPlayersTable();


    renderResultsTable();


  } catch (error) {


    console.error(
      "Could not save squat status:",
      error
    );


    alert(
      "Squat status could not be saved."
    );

  }

}



/* =========================================================
   SQUAT NOTES AUTOSAVE
========================================================= */

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


          await updatePlayerFields(

            playerId,

            {
              "results.squat.notes":
                notes
            }

          );


          const player =
            players.find(
              item =>
                item.id ===
                playerId
            );


          if (player) {

            player.results
              .squat
              .notes =
                notes;

          }


        } catch (error) {


          console.error(
            "Could not save squat notes:",
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

  attemptsElement,

  bestElement,

  resultKey

}) {


  let running =
    false;


  let startTime =
    null;


  let animationFrame =
    null;



  function updateTimer() {


    if (!running) {

      return;

    }


    const elapsed =

      (
        performance.now() -
        startTime
      )

      /

      1000;


    displayElement.textContent =
      elapsed.toFixed(2);


    animationFrame =
      requestAnimationFrame(
        updateTimer
      );

  }



  function startTimer() {


    running =
      true;


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
      )

      /

      1000;


    const finalTime =
      Number(
        elapsed.toFixed(2)
      );


    running =
      false;


    cancelAnimationFrame(
      animationFrame
    );


    animationFrame =
      null;


    buttonElement.textContent =
      "START";


    buttonElement.classList.remove(
      "running"
    );


    displayElement.textContent =
      finalTime.toFixed(2);


    const player =
      getCurrentPlayer();


    if (!player) {

      return;

    }


    const attempts =

      Array.isArray(
        player.results[
          resultKey
        ]
      )

        ? [
            ...player.results[
              resultKey
            ]
          ]

        : [];


    attempts.push(
      finalTime
    );


    try {


      await updatePlayerFields(

        player.id,

        {
          [`results.${resultKey}`]:
            attempts
        }

      );


      player.results[
        resultKey
      ] = attempts;


      renderTimerAttempts(

        attemptsElement,

        bestElement,

        resultKey

      );


      renderPlayersTable();


      renderResultsTable();


    } catch (error) {


      console.error(
        "Could not save timed attempt:",
        error
      );


      alert(
        "Timed attempt could not be saved."
      );

    }

  }



  function toggleTimer() {


    if (running) {

      stopTimer();

    } else {

      startTimer();

    }

  }



  function cancel() {


    if (
      animationFrame
    ) {

      cancelAnimationFrame(
        animationFrame
      );

    }


    animationFrame =
      null;


    running =
      false;


    startTime =
      null;


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

    async event => {


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


      const attempts =
        [

          ...player.results[
            resultKey
          ]

        ];


      attempts.splice(
        index,
        1
      );


      try {


        await updatePlayerFields(

          player.id,

          {
            [`results.${resultKey}`]:
              attempts
          }

        );


        player.results[
          resultKey
        ] = attempts;


        renderTimerAttempts(

          attemptsElement,

          bestElement,

          resultKey

        );


        renderPlayersTable();


        renderResultsTable();


      } catch (error) {


        console.error(
          "Could not delete timed attempt:",
          error
        );


        alert(
          "Attempt could not be deleted."
        );

      }

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


    container.innerHTML =
      "";


    bestElement.textContent =
      "—";


    return;

  }


  const attempts =

    Array.isArray(
      player.results[
        resultKey
      ]
    )

      ? player.results[
          resultKey
        ]

      : [];


  const best =
    bestTime(
      attempts
    );


  bestElement.textContent =

    best !== null

      ? `${best.toFixed(2)}s`

      : "—";


  if (
    !attempts.length
  ) {


    container.innerHTML = `

      <div class="attempt-row">

        <span>
          No attempts yet
        </span>

      </div>

    `;


    return;

  }


  container.innerHTML =
    attempts

      .map(
        (attempt, index) => {


          const isBest =

            best !== null &&

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
      )

      .join("");

}



/* =========================================================
   CREATE TIMERS
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
    controller =>
      controller.cancel()
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
   NAVIGATION EVENTS
========================================================= */

playersNavButton.addEventListener(
  "click",

  () =>
    showView(
      "players"
    )
);



resultsNavButton.addEventListener(
  "click",

  () =>
    showView(
      "results"
    )
);



mainResultsButton.addEventListener(
  "click",

  () =>
    showView(
      "results"
    )
);



backToPlayersButton.addEventListener(
  "click",

  () =>
    showView(
      "players"
    )
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
   TEST BUTTONS
========================================================= */

playersTableBody.addEventListener(
  "click",

  event => {


    const button =
      event.target.closest(
        ".test-button"
      );


    if (
      button
    ) {


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


    if (
      button
    ) {


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


    if (
      button
    ) {


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
  .querySelectorAll(
    ".number-test"
  )
  .forEach(
    card => {


      card.addEventListener(
        "click",

        () =>
          openCalculator(
            card
          )

      );

    }

  );



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


    deleteVelocityAttempt(

      button.dataset.test,

      Number(
        button.dataset.index
      )

    );

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
      event.key ===
      "Escape"
    ) {


      closeCalculator();

      closeAddPlayerModal();

      closePlayerDrawer();


      return;

    }


    if (

      !numberModal
        .classList
        .contains(
          "show"
        )

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


    } else if (
      event.key === "."
    ) {


      calculatorKeyPress(
        "."
      );


    } else if (
      event.key ===
      "Backspace"
    ) {


      calculatorKeyPress(
        "backspace"
      );


    } else if (
      event.key ===
      "Enter"
    ) {


      saveCalculatorResult();

    }

  }

);



/* =========================================================
   RENDER
========================================================= */

function renderEverything() {

  renderPlayersTable();

  renderResultsTable();

  renderPlayerDrawer();

}



/* =========================================================
   START
========================================================= */

showLogin();
