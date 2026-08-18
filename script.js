import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";


import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";



/* ============================================================
   FIREBASE
============================================================ */

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
  initializeApp(
    firebaseConfig
  );


const auth =
  getAuth(app);


const db =
  getFirestore(app);



/* ============================================================
   SETTINGS
============================================================ */

const ADMIN_EMAIL =
  "wes@ninthinningbaseball.com";


const PLAYERS_COLLECTION =
  "players";


const RESULTS_COLLECTION =
  "results";



/* ============================================================
   TESTS

   BROAD JUMP IS BEFORE THE TWO TIMED TESTS.
============================================================ */

const EVENTS = [

  {
    key:
      "pulldown",

    label:
      "Pulldown",

    unit:
      "mph",

    type:
      "number",

    direction:
      "high",

    maxAvg:
      true
  },


  {
    key:
      "exitVelo",

    label:
      "Exit Velo — Tee",

    unit:
      "mph",

    type:
      "number",

    direction:
      "high",

    maxAvg:
      true
  },


  {
    key:
      "internalRotation",

    label:
      "Internal Rotation",

    unit:
      "°",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "externalRotation",

    label:
      "External Rotation",

    unit:
      "°",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "dynoInternal",

    label:
      "Dyno Internal",

    unit:
      "lb",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "dynoExternal",

    label:
      "Dyno External",

    unit:
      "lb",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "gripLeft",

    label:
      "Grip Strength — Left",

    shortLabel:
      "Grip L",

    unit:
      "lb",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "gripRight",

    label:
      "Grip Strength — Right",

    shortLabel:
      "Grip R",

    unit:
      "lb",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "medBallLeft",

    label:
      "Med Ball Rotation — Left",

    shortLabel:
      "Med Ball L",

    unit:
      "in",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "medBallRight",

    label:
      "Med Ball Rotation — Right",

    shortLabel:
      "Med Ball R",

    unit:
      "in",

    type:
      "number",

    direction:
      "high"
  },


  {
    key:
      "broadJump",

    label:
      "Broad Jump",

    unit:
      "in",

    type:
      "number",

    direction:
      "high",

    wide:
      true
  },


  {
    key:
      "fiveTenFive",

    label:
      "5/10/5 Run",

    shortLabel:
      "5/10/5",

    unit:
      "sec",

    type:
      "timer",

    direction:
      "low"
  },


  {
    key:
      "tenYardShuttle",

    label:
      "10-Yard Shuttle",

    shortLabel:
      "10-Yd Shuttle",

    unit:
      "sec",

    type:
      "timer",

    direction:
      "low"
  },


  {
    key:
      "squatAssessment",

    label:
      "Squat Assessment",

    shortLabel:
      "Squat",

    unit:
      "",

    type:
      "passfail",

    direction:
      "passfail"
  }

];



/* ============================================================
   STATE
============================================================ */

let currentUser =
  null;


let athletes =
  [];


let results =
  [];


let selectedAthlete =
  null;


let importRows =
  [];


let athleteSort = {

  key:
    "lastName",

  asc:
    true

};


let matrixSort = {

  key:
    "athlete",

  asc:
    true

};


let numberPadEventKey =
  null;


let numberPadBuffer =
  "";


const timerStates =
  {};


EVENTS
  .filter(
    event =>
      event.type
      ===
      "timer"
  )
  .forEach(
    event => {

      timerStates[
        event.key
      ] = {

        running:
          false,

        startedAt:
          0,

        elapsedMs:
          0,

        intervalId:
          null

      };

    }
  );



/* ============================================================
   START
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    bindLogin();

    bindNavigation();

    bindAthletePage();

    bindTestingPage();

    bindResultsPage();

    bindModals();

    bindUploader();

    bindNumberPad();

  }
);



/* ============================================================
   LOGIN
============================================================ */

function bindLogin() {

  document
    .getElementById(
      "loginForm"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .getElementById(
              "loginEmail"
            )
            .value
            .trim();


        const password =
          document
            .getElementById(
              "loginPassword"
            )
            .value;


        const message =
          document
            .getElementById(
              "loginMessage"
            );


        hideMessage(
          message
        );


        try {

          await signInWithEmailAndPassword(

            auth,

            email,

            password

          );

        }

        catch (error) {

          console.error(

            "LOGIN ERROR",

            error.code,

            error.message

          );


          let text =
            `${error.code}: ${error.message}`;


          if (

            [
              "auth/invalid-credential",
              "auth/wrong-password",
              "auth/user-not-found"
            ]

              .includes(
                error.code
              )

          ) {

            text =
              "Invalid email or password.";

          }


          else if (

            error.code
            ===
            "auth/too-many-requests"

          ) {

            text =
              "Too many failed attempts. Wait a few minutes and try again.";

          }


          showMessage(

            message,

            text,

            "error"

          );

        }

      }
    );


  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      () =>
        signOut(auth)
    );

}



onAuthStateChanged(

  auth,

  async user => {

    currentUser =
      user;


    if (!user) {

      document
        .getElementById(
          "loginScreen"
        )
        .classList
        .remove(
          "hidden"
        );


      document
        .getElementById(
          "app"
        )
        .classList
        .add(
          "hidden"
        );


      athletes =
        [];


      results =
        [];


      selectedAthlete =
        null;


      return;

    }


    document
      .getElementById(
        "loginScreen"
      )
      .classList
      .add(
        "hidden"
      );


    document
      .getElementById(
        "app"
      )
      .classList
      .remove(
        "hidden"
      );


    document
      .getElementById(
        "loggedInEmail"
      )
      .textContent =
      user.email
      ||
      "";


    document
      .getElementById(
        "uploadPlayersButton"
      )
      .classList
      .toggle(

        "hidden",

        !isAdmin()

      );


    document
      .getElementById(
        "adminBadge"
      )
      .classList
      .toggle(

        "hidden",

        !isAdmin()

      );


    await refreshData();

  }

);



function isAdmin() {

  return (

    (
      currentUser?.email
      ||
      ""
    )

      .trim()

      .toLowerCase()

    ===

    ADMIN_EMAIL
      .toLowerCase()

  );

}



/* ============================================================
   LOAD DATA
============================================================ */

async function refreshData() {

  await Promise.all(

    [
      loadAthletes(),
      loadResults()
    ]

  );


  updateAgeFilters();

  renderAthleteTable();

  renderResultsMatrix();

  renderIndexDrawer();


  if (
    selectedAthlete
  ) {

    selectedAthlete =

      athletes.find(
        athlete =>
          athlete.id
          ===
          selectedAthlete.id
      )

      ||

      selectedAthlete;


    renderTestingPage();

  }

}



async function loadAthletes() {

  try {

    const snapshot =
      await getDocs(

        collection(

          db,

          PLAYERS_COLLECTION

        )

      );


    athletes =

      snapshot.docs

        .map(

          document =>

            normalizePlayer(

              document.id,

              document.data()

            )

        )

        .sort(
          comparePlayers
        );

  }

  catch (error) {

    console.error(

      "LOAD PLAYERS",

      error

    );


    showToast(

      `Could not load players: ${error.message}`,

      true

    );

  }

}



async function loadResults() {

  try {

    let snapshot;


    try {

      snapshot =
        await getDocs(

          query(

            collection(

              db,

              RESULTS_COLLECTION

            ),

            orderBy(

              "createdAt",

              "desc"

            )

          )

        );

    }

    catch {

      snapshot =
        await getDocs(

          collection(

            db,

            RESULTS_COLLECTION

          )

        );

    }


    results =

      snapshot.docs

        .map(

          document =>

            normalizeResult(

              document.id,

              document.data()

            )

        )

        .filter(

          result =>

            result.event

            &&

            result.athleteId

        );

  }

  catch (error) {

    console.error(

      "LOAD RESULTS",

      error

    );


    showToast(

      `Could not load results: ${error.message}`,

      true

    );

  }

}



function normalizePlayer(
  id,
  data
) {

  return {

    id,

    ...data,


    firstName:
      cleanText(

        data.firstName

        ??

        data.first_name

        ??

        data.firstname

        ??

        data.first

        ??

        ""

      ),


    lastName:
      cleanText(

        data.lastName

        ??

        data.last_name

        ??

        data.lastname

        ??

        data.last

        ??

        ""

      ),


    ageGroup:
      normalizeAgeGroup(

        data.ageGroup

        ??

        data.age_group

        ??

        data.age

        ??

        ""

      )

  };

}



function normalizeResult(
  id,
  data
) {

  const rawEvent =

    data.event

    ??

    data.eventKey

    ??

    data.test

    ??

    data.metric

    ??

    "";


  return {

    id,

    ...data,


    athleteId:

      data.athleteId

      ??

      data.playerId

      ??

      data.athlete_id

      ??

      data.player_id

      ??

      "",


    event:
      normalizeEventKey(
        rawEvent
      ),


    value:

      data.value

      ??

      data.score

      ??

      data.result

      ??

      null,


    assessment:

      data.assessment

      ??

      data.status

      ??

      null,


    notes:

      data.notes

      ??

      "",


    enteredByUid:

      data.enteredByUid

      ??

      data.entered_by_uid

      ??

      "",


    enteredByEmail:

      data.enteredByEmail

      ??

      data.entered_by_email

      ??

      "",


    createdAt:

      data.createdAt

      ??

      data.created_at

      ??

      null

  };

}



function normalizeEventKey(
  key
) {

  const aliases = {

    pulldown:
      "pulldown",


    exitVelo:
      "exitVelo",

    exit_velo:
      "exitVelo",

    exitVelocity:
      "exitVelo",


    internalRotation:
      "internalRotation",

    internal_rotation:
      "internalRotation",


    externalRotation:
      "externalRotation",

    external_rotation:
      "externalRotation",


    dynoInternal:
      "dynoInternal",

    dyno_internal:
      "dynoInternal",


    dynoExternal:
      "dynoExternal",

    dyno_external:
      "dynoExternal",


    gripLeft:
      "gripLeft",

    grip_left:
      "gripLeft",


    gripRight:
      "gripRight",

    grip_right:
      "gripRight",


    medBallLeft:
      "medBallLeft",

    med_ball_left:
      "medBallLeft",


    medBallRight:
      "medBallRight",

    med_ball_right:
      "medBallRight",


    broadJump:
      "broadJump",

    broad_jump:
      "broadJump",


    fiveTenFive:
      "fiveTenFive",

    five_ten_five:
      "fiveTenFive",


    tenYardShuttle:
      "tenYardShuttle",

    ten_yard_shuttle:
      "tenYardShuttle",


    squatAssessment:
      "squatAssessment",

    squat_assessment:
      "squatAssessment"

  };


  return (

    aliases[key]

    ||

    key

  );

}



/* ============================================================
   NAVIGATION
============================================================ */

function bindNavigation() {

  document
    .querySelectorAll(
      ".nav-tab"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            showView(
              button.dataset.view
            )
        );

      }

    );

}



function showView(
  viewId
) {

  if (
    viewId
    !==
    "testingView"
  ) {

    resetAllTimers();

  }


  document
    .querySelectorAll(
      ".view"
    )
    .forEach(

      view =>
        view.classList
          .remove(
            "active"
          )

    );


  document
    .getElementById(
      viewId
    )
    .classList
    .add(
      "active"
    );


  document
    .querySelectorAll(
      ".nav-tab"
    )
    .forEach(

      button =>
        button.classList
          .toggle(

            "active",

            button.dataset.view
            ===
            viewId

          )

    );


  if (
    viewId
    ===
    "athletesView"
  ) {

    renderAthleteTable();

  }


  if (
    viewId
    ===
    "resultsView"
  ) {

    renderResultsMatrix();

  }


  window.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });

}



/* ============================================================
   ATHLETES
============================================================ */

function bindAthletePage() {

  document
    .getElementById(
      "athleteSearch"
    )
    .addEventListener(

      "input",

      renderAthleteTable

    );


  document
    .getElementById(
      "athleteAgeFilter"
    )
    .addEventListener(

      "change",

      renderAthleteTable

    );


  document
    .getElementById(
      "openAddPlayerButton"
    )
    .addEventListener(
      "click",
      () => {

        document
          .getElementById(
            "addPlayerForm"
          )
          .reset();


        hideMessage(

          document
            .getElementById(
              "addPlayerMessage"
            )

        );


        openModal(
          "addPlayerModal"
        );

      }
    );


  document
    .getElementById(
      "addPlayerForm"
    )
    .addEventListener(

      "submit",

      addPlayer

    );


  document
    .querySelectorAll(
      "[data-athlete-sort]"
    )
    .forEach(

      header => {

        header.addEventListener(
          "click",
          () => {

            const key =
              header.dataset
                .athleteSort;


            if (
              athleteSort.key
              ===
              key
            ) {

              athleteSort.asc =
                !athleteSort.asc;

            }

            else {

              athleteSort = {

                key,

                asc:
                  true

              };

            }


            renderAthleteTable();

          }
        );

      }

    );

}



function renderAthleteTable() {

  const body =
    document
      .getElementById(
        "athleteTableBody"
      );


  const search =
    normalizeText(

      document
        .getElementById(
          "athleteSearch"
        )
        .value

    );


  const age =
    normalizeAgeGroup(

      document
        .getElementById(
          "athleteAgeFilter"
        )
        .value

    );


  let filtered =

    athletes.filter(

      athlete => {

        const haystack =
          normalizeText(

            `${athlete.firstName} ${athlete.lastName} ${athlete.ageGroup}`

          );


        return (

          (
            !search

            ||

            haystack.includes(
              search
            )
          )

          &&

          (
            !age

            ||

            athlete.ageGroup
            ===
            age
          )

        );

      }

    );


  filtered.sort(

    (a, b) => {

      const av =
        String(

          a[
            athleteSort.key
          ]

          ??

          ""

        );


      const bv =
        String(

          b[
            athleteSort.key
          ]

          ??

          ""

        );


      const comparison =
        av.localeCompare(

          bv,

          undefined,

          {
            numeric:
              true
          }

        );


      return (

        athleteSort.asc

        ?

        comparison

        :

        -comparison

      );

    }

  );


  body.innerHTML =
    "";


  filtered.forEach(

    athlete => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML =
        `

          <td>

            <button
              class="athlete-name-link"
              data-player-id="${escapeHtml(
                athlete.id
              )}"
            >

              ${escapeHtml(
                athlete.firstName
              )}

            </button>

          </td>


          <td>

            <button
              class="athlete-name-link"
              data-player-id="${escapeHtml(
                athlete.id
              )}"
            >

              ${escapeHtml(
                athlete.lastName
              )}

            </button>

          </td>


          <td>

            <span class="age-pill">

              ${escapeHtml(
                athlete.ageGroup
              )}

            </span>

          </td>

        `;


      body.appendChild(
        row
      );

    }

  );


  body
    .querySelectorAll(
      ".athlete-name-link"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            startTesting(
              button.dataset.playerId
            )
        );

      }

    );


  document
    .getElementById(
      "athleteEmpty"
    )
    .classList
    .toggle(

      "hidden",

      filtered.length
      >
      0

    );

}



/* ============================================================
   ADD PLAYER
============================================================ */

async function addPlayer(
  event
) {

  event.preventDefault();


  const message =
    document
      .getElementById(
        "addPlayerMessage"
      );


  const firstName =
    cleanText(

      document
        .getElementById(
          "newFirstName"
        )
        .value

    );


  const lastName =
    cleanText(

      document
        .getElementById(
          "newLastName"
        )
        .value

    );


  const ageGroup =
    normalizeAgeGroup(

      document
        .getElementById(
          "newAgeGroup"
        )
        .value

    );


  if (

    !firstName

    ||

    !lastName

    ||

    !ageGroup

  ) {

    showMessage(

      message,

      "First name, last name and age group are required.",

      "error"

    );


    return;

  }


  if (

    findExistingPlayer(

      firstName,

      lastName,

      ageGroup

    )

  ) {

    showMessage(

      message,

      `${firstName} ${lastName} (${ageGroup}) already exists. Nothing was changed.`,

      "warning"

    );


    return;

  }


  const ref =
    doc(

      db,

      PLAYERS_COLLECTION,

      playerDocumentId(

        firstName,

        lastName,

        ageGroup

      )

    );


  try {

    const existing =
      await getDoc(
        ref
      );


    if (
      existing.exists()
    ) {

      showMessage(

        message,

        "That player already exists. Nothing was changed.",

        "warning"

      );


      return;

    }


    await setDoc(

      ref,

      {

        firstName,

        lastName,

        ageGroup,


        normalizedFirstName:
          normalizeText(
            firstName
          ),


        normalizedLastName:
          normalizeText(
            lastName
          ),


        normalizedAgeGroup:
          normalizeText(
            ageGroup
          ),


        createdByUid:
          currentUser.uid,


        createdByEmail:
          currentUser.email
          ||
          "",


        createdAt:
          serverTimestamp()

      }

    );


    closeModal(
      "addPlayerModal"
    );


    await refreshData();


    showToast(

      `${firstName} ${lastName} added.`

    );

  }

  catch (error) {

    console.error(

      "ADD PLAYER",

      error

    );


    showMessage(

      message,

      `Could not add player: ${error.message}`,

      "error"

    );

  }

}



/* ============================================================
   TESTING
============================================================ */

function bindTestingPage() {

  document
    .getElementById(
      "backToAthletesButton"
    )
    .addEventListener(
      "click",
      () =>
        showView(
          "athletesView"
        )
    );


  document
    .getElementById(
      "openIndexButton"
    )
    .addEventListener(

      "click",

      openIndexDrawer

    );


  document
    .getElementById(
      "closeIndexButton"
    )
    .addEventListener(

      "click",

      closeIndexDrawer

    );


  document
    .getElementById(
      "indexBackdrop"
    )
    .addEventListener(

      "click",

      closeIndexDrawer

    );


  document
    .getElementById(
      "indexSearch"
    )
    .addEventListener(

      "input",

      renderIndexDrawer

    );

}



function startTesting(
  playerId
) {

  selectedAthlete =

    athletes.find(

      athlete =>
        athlete.id
        ===
        playerId

    );


  if (
    !selectedAthlete
  ) {

    return;

  }


  resetAllTimers();


  renderTestingPage();


  showView(
    "testingView"
  );

}



function renderTestingPage() {

  if (
    !selectedAthlete
  ) {

    return;

  }


  document
    .getElementById(
      "testingPlayerName"
    )
    .textContent =

    `${selectedAthlete.firstName} ${selectedAthlete.lastName}`;


  document
    .getElementById(
      "testingPlayerAge"
    )
    .textContent =

    selectedAthlete.ageGroup;


  renderTestCards();

}



/* ============================================================
   TEST CARDS
============================================================ */

function renderTestCards() {

  const grid =
    document
      .getElementById(
        "testGrid"
      );


  grid.innerHTML =
    "";


  if (
    !selectedAthlete
  ) {

    return;

  }


  EVENTS.forEach(

    event => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        `test-card test-${event.type}${event.wide ? " wide-test-card" : ""}`;


      const stats =
        getEventStats(

          selectedAthlete.id,

          event

        );



      /* TIMER */
      if (
        event.type
        ===
        "timer"
      ) {

        const state =
          timerStates[
            event.key
          ];


        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <p class="kicker">
                  LOWEST IS BEST
                </p>

                <h3>
                  ${escapeHtml(
                    event.label
                  )}
                </h3>

              </div>


              ${
                stats.best

                ?

                `
                <span class="best-chip">

                  BEST
                  ${formatNumber(
                    stats.best.value
                  )}
                  sec

                </span>
                `

                :

                ""
              }

            </div>


            <div
              id="timer-${event.key}"
              class="timer-display"
            >
              ${formatTimer(
                state.elapsedMs
              )}
            </div>


            <button
              class="timer-toggle-button ${
                state.running
                ?
                "running"
                :
                ""
              }"
              data-event="${event.key}"
            >

              ${
                state.running
                ?
                "STOP"
                :
                "START"
              }

            </button>


            <button
              class="timer-reset-button"
              data-event="${event.key}"
              ${
                state.running
                ?
                "disabled"
                :
                ""
              }
            >
              RESET
            </button>


            <p class="timer-help">

              Tap START, then tap the same button to STOP.
              Stopping saves the time automatically.

            </p>


            ${renderAttempts(
              stats.attempts,
              event,
              5
            )}

          `;

      }


      /* PASS / FAIL */
      else if (
        event.type
        ===
        "passfail"
      ) {

        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <p class="kicker">
                  PASS / FAIL
                </p>

                <h3>
                  ${escapeHtml(
                    event.label
                  )}
                </h3>

              </div>


              ${
                stats.latest

                ?

                `
                <span
                  class="best-chip ${
                    stats.latest.assessment
                    ===
                    "Fail"
                    ?
                    "fail-chip"
                    :
                    ""
                  }"
                >

                  ${escapeHtml(
                    stats.latest.assessment
                    ||
                    "—"
                  )}

                </span>
                `

                :

                ""
              }

            </div>


            <label for="squatNotes">
              Notes
            </label>


            <textarea
              id="squatNotes"
              class="notes-input"
              rows="3"
              placeholder="Optional notes…"
            ></textarea>


            <div class="pass-fail-grid">

              <button
                class="assessment-button pass"
                data-assessment="Pass"
              >
                PASS
              </button>


              <button
                class="assessment-button fail"
                data-assessment="Fail"
              >
                FAIL
              </button>

            </div>


            ${renderAttempts(
              stats.attempts,
              event,
              3
            )}

          `;

      }


      /* NUMBER */
      else {

        let summary =
          "";


        if (
          event.maxAvg
        ) {

          summary =
            `

              <div class="dual-stat">

                <div>

                  <span>
                    MAX
                  </span>

                  <strong>

                    ${
                      stats.best

                      ?

                      `${formatNumber(
                        stats.best.value
                      )} ${event.unit}`

                      :

                      "—"
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    AVG LAST 3
                  </span>

                  <strong>

                    ${
                      stats.avgLast3
                      ==
                      null

                      ?

                      "—"

                      :

                      `${formatNumber(
                        stats.avgLast3
                      )} ${event.unit}`
                    }

                  </strong>

                </div>

              </div>

            `;

        }


        else if (
          stats.best
        ) {

          summary =
            `

              <span class="best-chip">

                BEST
                ${formatNumber(
                  stats.best.value
                )}
                ${escapeHtml(
                  event.unit
                )}

              </span>

            `;

        }


        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <p class="kicker">

                  ${
                    event.direction
                    ===
                    "low"

                    ?

                    "LOWEST IS BEST"

                    :

                    "HIGHEST IS BEST"
                  }

                </p>


                <h3>
                  ${escapeHtml(
                    event.label
                  )}
                </h3>

              </div>


              ${
                event.maxAvg
                ?
                ""
                :
                summary
              }

            </div>


            ${
              event.maxAvg
              ?
              summary
              :
              ""
            }


            <button
              class="number-entry-button"
              data-event="${event.key}"
            >
              ENTER
              ${escapeHtml(
                event.unit
                  .toUpperCase()
              )}
            </button>


            ${renderAttempts(
              stats.attempts,
              event,
              3
            )}

          `;

      }


      grid.appendChild(
        card
      );

    }

  );


  grid
    .querySelectorAll(
      ".number-entry-button"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            openNumberPad(
              button.dataset.event
            )
        );

      }

    );


  grid
    .querySelectorAll(
      ".timer-toggle-button"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            toggleTimer(
              button.dataset.event
            )
        );

      }

    );


  grid
    .querySelectorAll(
      ".timer-reset-button"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            resetTimer(
              button.dataset.event
            )
        );

      }

    );


  grid
    .querySelectorAll(
      ".assessment-button"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            saveAssessment(
              button.dataset.assessment
            )
        );

      }

    );


  grid
    .querySelectorAll(
      ".delete-attempt"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            deleteAttempt(
              button.dataset.resultId
            )
        );

      }

    );

}



/* ============================================================
   ATTEMPTS
============================================================ */

function renderAttempts(

  attempts,

  event,

  limit =
    3

) {

  if (
    !attempts.length
  ) {

    return `

      <div class="attempt-empty">
        No entries yet.
      </div>

    `;

  }


  const best =

    event.type
    ===
    "passfail"

    ?

    attempts[0]

    :

    getBestAttempt(

      attempts,

      event.direction

    );


  return `

    <div class="attempts">

      <div class="attempts-title">

        ${
          event.maxAvg

          ?

          "LAST 3 ENTRIES"

          :

          "RECORDED ENTRIES"
        }

      </div>


      ${
        attempts

          .slice(
            0,
            limit
          )

          .map(

            attempt => {

              const canDelete =

                isAdmin()

                ||

                attempt.enteredByUid
                ===
                currentUser?.uid;


              const valueText =

                event.type
                ===
                "passfail"

                ?

                `${
                  attempt.assessment
                  ||
                  "—"
                }${
                  attempt.notes
                  ?
                  ` — ${attempt.notes}`
                  :
                  ""
                }`

                :

                `${formatNumber(
                  attempt.value
                )} ${event.unit}`;


              return `

                <div
                  class="attempt-row ${
                    best?.id
                    ===
                    attempt.id

                    &&

                    event.type
                    !==
                    "passfail"

                    ?

                    "best-attempt"

                    :

                    ""
                  }"
                >

                  <div>

                    <strong>

                      ${escapeHtml(
                        valueText
                      )}

                    </strong>


                    <small>

                      ${escapeHtml(
                        shortDate(
                          attempt.createdAt
                        )
                      )}

                      ${
                        attempt.enteredByEmail

                        ?

                        ` • ${escapeHtml(
                          shortCoachName(
                            attempt.enteredByEmail
                          )
                        )}`

                        :

                        ""
                      }

                    </small>

                  </div>


                  ${
                    canDelete

                    ?

                    `
                    <button
                      class="delete-attempt"
                      data-result-id="${escapeHtml(
                        attempt.id
                      )}"
                      title="Delete mistaken entry"
                    >
                      ×
                    </button>
                    `

                    :

                    ""
                  }

                </div>

              `;

            }

          )

          .join("")
      }

    </div>

  `;

}



/* ============================================================
   KEYPAD
============================================================ */

function openNumberPad(
  eventKey
) {

  const event =
    getEvent(
      eventKey
    );


  if (

    !event

    ||

    !selectedAthlete

  ) {

    return;

  }


  numberPadEventKey =
    eventKey;


  numberPadBuffer =
    "";


  document
    .getElementById(
      "numberPadPlayer"
    )
    .textContent =

    `${selectedAthlete.firstName} ${selectedAthlete.lastName}`;


  document
    .getElementById(
      "numberPadTitle"
    )
    .textContent =

    event.label;


  document
    .getElementById(
      "numberPadUnit"
    )
    .textContent =

    event.unit;


  updateNumberPadDisplay();


  openModal(
    "numberPadModal"
  );

}



function bindNumberPad() {

  document
    .getElementById(
      "numberPadKeys"
    )
    .addEventListener(

      "click",

      event => {

        const button =
          event.target
            .closest(
              "button[data-key]"
            );


        if (
          !button
        ) {

          return;

        }


        const key =
          button.dataset.key;


        if (
          key
          ===
          "back"
        ) {

          numberPadBuffer =
            numberPadBuffer.slice(
              0,
              -1
            );

        }


        else if (
          key
          ===
          "."
        ) {

          if (
            !numberPadBuffer.includes(
              "."
            )
          ) {

            numberPadBuffer +=

              numberPadBuffer

              ?

              "."

              :

              "0.";

          }

        }


        else if (
          numberPadBuffer.length
          <
          8
        ) {

          numberPadBuffer +=
            key;

        }


        updateNumberPadDisplay();

      }

    );


  document
    .getElementById(
      "saveNumberPadButton"
    )
    .addEventListener(
      "click",
      async () => {

        const value =
          Number(
            numberPadBuffer
          );


        if (

          !Number.isFinite(
            value
          )

          ||

          numberPadBuffer
          ===
          ""

        ) {

          showToast(

            "Enter a valid number.",

            true

          );


          return;

        }


        const eventKey =
          numberPadEventKey;


        closeModal(
          "numberPadModal"
        );


        await saveNumericResult(

          eventKey,

          value

        );

      }
    );

}



function updateNumberPadDisplay() {

  document
    .getElementById(
      "numberPadDisplay"
    )
    .textContent =

    numberPadBuffer

    ||

    "—";

}



/* ============================================================
   SAVE RESULT
============================================================ */

async function saveNumericResult(

  eventKey,

  value

) {

  if (

    !selectedAthlete

    ||

    !currentUser

  ) {

    return;

  }


  try {

    await addDoc(

      collection(

        db,

        RESULTS_COLLECTION

      ),

      {

        athleteId:
          selectedAthlete.id,


        playerId:
          selectedAthlete.id,


        athleteFirstName:
          selectedAthlete.firstName,


        athleteLastName:
          selectedAthlete.lastName,


        ageGroup:
          selectedAthlete.ageGroup,


        event:
          eventKey,


        value,


        assessment:
          null,


        notes:
          "",


        enteredByUid:
          currentUser.uid,


        enteredByEmail:
          currentUser.email
          ||
          "",


        createdAt:
          serverTimestamp()

      }

    );


    await loadResults();


    renderTestCards();

    renderResultsMatrix();


    const event =
      getEvent(
        eventKey
      );


    showToast(

      `${event.label}: ${formatNumber(
        value
      )} ${event.unit} saved.`

    );

  }

  catch (error) {

    console.error(

      "SAVE RESULT",

      error

    );


    showToast(

      `Could not save result: ${error.message}`,

      true

    );

  }

}



/* ============================================================
   SQUAT
============================================================ */

async function saveAssessment(
  assessment
) {

  if (

    !selectedAthlete

    ||

    !currentUser

  ) {

    return;

  }


  const notes =
    cleanText(

      document
        .getElementById(
          "squatNotes"
        )
        ?.value

      ||

      ""

    );


  try {

    await addDoc(

      collection(

        db,

        RESULTS_COLLECTION

      ),

      {

        athleteId:
          selectedAthlete.id,


        playerId:
          selectedAthlete.id,


        athleteFirstName:
          selectedAthlete.firstName,


        athleteLastName:
          selectedAthlete.lastName,


        ageGroup:
          selectedAthlete.ageGroup,


        event:
          "squatAssessment",


        value:
          null,


        assessment,


        notes,


        enteredByUid:
          currentUser.uid,


        enteredByEmail:
          currentUser.email
          ||
          "",


        createdAt:
          serverTimestamp()

      }

    );


    await loadResults();


    renderTestCards();

    renderResultsMatrix();


    showToast(

      `Squat Assessment: ${assessment}`

    );

  }

  catch (error) {

    console.error(

      "SAVE SQUAT",

      error

    );


    showToast(

      `Could not save assessment: ${error.message}`,

      true

    );

  }

}



/* ============================================================
   DELETE MISTAKEN ENTRY
============================================================ */

async function deleteAttempt(
  resultId
) {

  const attempt =
    results.find(

      result =>
        result.id
        ===
        resultId

    );


  if (
    !attempt
  ) {

    return;

  }


  if (

    !isAdmin()

    &&

    attempt.enteredByUid
    !==
    currentUser?.uid

  ) {

    showToast(

      "You can only delete an entry you recorded.",

      true

    );


    return;

  }


  try {

    await deleteDoc(

      doc(

        db,

        RESULTS_COLLECTION,

        resultId

      )

    );


    await loadResults();


    renderTestCards();

    renderResultsMatrix();


    showToast(
      "Entry deleted."
    );

  }

  catch (error) {

    console.error(

      "DELETE RESULT",

      error

    );


    showToast(

      `Could not delete entry: ${error.message}`,

      true

    );

  }

}



/* ============================================================
   TIMER

   SAME BUTTON STARTS AND STOPS.
============================================================ */

function toggleTimer(
  eventKey
) {

  const state =
    timerStates[
      eventKey
    ];


  if (
    !state
  ) {

    return;

  }


  if (
    state.running
  ) {

    stopTimer(
      eventKey
    );

  }

  else {

    startTimer(
      eventKey
    );

  }

}



function startTimer(
  eventKey
) {

  const state =
    timerStates[
      eventKey
    ];


  if (

    !state

    ||

    state.running

  ) {

    return;

  }


  state.elapsedMs =
    0;


  state.startedAt =
    performance.now();


  state.running =
    true;


  clearInterval(
    state.intervalId
  );


  renderTestCards();


  state.intervalId =
    setInterval(

      () => {

        state.elapsedMs =

          performance.now()

          -

          state.startedAt;


        const display =
          document
            .getElementById(
              `timer-${eventKey}`
            );


        if (
          display
        ) {

          display.textContent =
            formatTimer(
              state.elapsedMs
            );

        }

      },

      10

    );

}



async function stopTimer(
  eventKey
) {

  const state =
    timerStates[
      eventKey
    ];


  if (

    !state

    ||

    !state.running

  ) {

    return;

  }


  state.elapsedMs =

    performance.now()

    -

    state.startedAt;


  state.running =
    false;


  clearInterval(
    state.intervalId
  );


  state.intervalId =
    null;


  const seconds =

    Math.round(

      (
        state.elapsedMs
        /
        1000
      )

      *

      100

    )

    /

    100;


  state.elapsedMs =
    0;


  await saveNumericResult(

    eventKey,

    seconds

  );

}



function resetTimer(
  eventKey
) {

  const state =
    timerStates[
      eventKey
    ];


  if (

    !state

    ||

    state.running

  ) {

    return;

  }


  clearInterval(
    state.intervalId
  );


  state.startedAt =
    0;


  state.elapsedMs =
    0;


  state.intervalId =
    null;


  renderTestCards();

}



function resetAllTimers() {

  Object.keys(
    timerStates
  )
    .forEach(

      eventKey => {

        const state =
          timerStates[
            eventKey
          ];


        clearInterval(
          state.intervalId
        );


        Object.assign(

          state,

          {

            running:
              false,

            startedAt:
              0,

            elapsedMs:
              0,

            intervalId:
              null

          }

        );

      }

    );

}



function formatTimer(
  milliseconds
) {

  return (

    milliseconds
    /
    1000

  )
    .toFixed(2);

}



/* ============================================================
   INDEX
============================================================ */

function openIndexDrawer() {

  document
    .getElementById(
      "indexSearch"
    )
    .value =
    "";


  renderIndexDrawer();


  document
    .getElementById(
      "playerIndexDrawer"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "indexBackdrop"
    )
    .classList
    .remove(
      "hidden"
    );

}



function closeIndexDrawer() {

  document
    .getElementById(
      "playerIndexDrawer"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "indexBackdrop"
    )
    .classList
    .add(
      "hidden"
    );

}



function renderIndexDrawer() {

  const container =
    document
      .getElementById(
        "indexPlayerList"
      );


  if (
    !container
  ) {

    return;

  }


  const search =
    normalizeText(

      document
        .getElementById(
          "indexSearch"
        )
        ?.value

      ||

      ""

    );


  const filtered =

    athletes.filter(

      athlete =>

        !search

        ||

        normalizeText(

          `${athlete.firstName} ${athlete.lastName} ${athlete.ageGroup}`

        )
          .includes(
            search
          )

    );


  const groups =
    {};


  filtered.forEach(

    athlete => {

      const age =
        athlete.ageGroup

        ||

        "Other";


      if (
        !groups[age]
      ) {

        groups[age] =
          [];

      }


      groups[age]
        .push(
          athlete
        );

    }

  );


  container.innerHTML =
    "";


  Object
    .keys(groups)
    .sort(
      naturalSort
    )
    .forEach(

      age => {

        const section =
          document.createElement(
            "div"
          );


        section.className =
          "index-group";


        const players =

          groups[age]
            .sort(
              comparePlayers
            );


        section.innerHTML =

          `<h3>${escapeHtml(
            age
          )}</h3>`

          +

          players.map(

            player =>
              `

                <button
                  class="index-player ${
                    selectedAthlete?.id
                    ===
                    player.id

                    ?

                    "active"

                    :

                    ""
                  }"
                  data-player-id="${escapeHtml(
                    player.id
                  )}"
                >

                  <span>

                    ${escapeHtml(
                      player.lastName
                    )},
                    ${escapeHtml(
                      player.firstName
                    )}

                  </span>

                  <span>
                    ›
                  </span>

                </button>

              `

          )
            .join("");


        container.appendChild(
          section
        );

      }

    );


  container
    .querySelectorAll(
      ".index-player"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () => {

            selectedAthlete =

              athletes.find(

                athlete =>
                  athlete.id
                  ===
                  button.dataset.playerId

              );


            resetAllTimers();


            renderTestingPage();


            closeIndexDrawer();


            window.scrollTo({

              top:
                0,

              behavior:
                "smooth"

            });

          }
        );

      }

    );

}



/* ============================================================
   RESULTS MATRIX
============================================================ */

function bindResultsPage() {

  document
    .getElementById(
      "resultsSearch"
    )
    .addEventListener(

      "input",

      renderResultsMatrix

    );


  document
    .getElementById(
      "resultsAgeFilter"
    )
    .addEventListener(

      "change",

      renderResultsMatrix

    );

}



function renderResultsMatrix() {

  const head =
    document
      .getElementById(
        "resultsMatrixHead"
      );


  const body =
    document
      .getElementById(
        "resultsMatrixBody"
      );


  if (

    !head

    ||

    !body

  ) {

    return;

  }


  head.innerHTML =
    `

      <tr>

        <th
          class="sticky-athlete sortable"
          data-sort-key="athlete"
        >

          Athlete
          ${sortArrow(
            "athlete"
          )}

        </th>


        <th
          class="sortable"
          data-sort-key="ageGroup"
        >

          Age
          ${sortArrow(
            "ageGroup"
          )}

        </th>


        ${
          EVENTS.map(

            event =>
              `

                <th
                  class="sortable event-heading"
                  data-sort-key="${event.key}"
                >

                  ${escapeHtml(
                    event.shortLabel
                    ||
                    event.label
                  )}

                  ${sortArrow(
                    event.key
                  )}

                </th>

              `

          )
            .join("")
        }

      </tr>

    `;


  head
    .querySelectorAll(
      "[data-sort-key]"
    )
    .forEach(

      header => {

        header.addEventListener(
          "click",
          () =>
            setMatrixSort(
              header.dataset.sortKey
            )
        );

      }

    );


  const search =
    normalizeText(

      document
        .getElementById(
          "resultsSearch"
        )
        .value

    );


  const age =
    normalizeAgeGroup(

      document
        .getElementById(
          "resultsAgeFilter"
        )
        .value

    );


  let rows =

    athletes.filter(

      athlete => {

        return (

          (
            !search

            ||

            normalizeText(

              `${athlete.firstName} ${athlete.lastName}`

            )
              .includes(
                search
              )
          )

          &&

          (
            !age

            ||

            athlete.ageGroup
            ===
            age
          )

        );

      }

    );


  rows.sort(
    compareMatrixPlayers
  );


  body.innerHTML =
    "";


  rows.forEach(

    athlete => {

      const cells =

        EVENTS.map(

          event => {

            const stats =
              getEventStats(

                athlete.id,

                event

              );


            if (
              event.type
              ===
              "passfail"
            ) {

              return `

                <td>

                  ${
                    stats.latest

                    ?

                    escapeHtml(
                      stats.latest.assessment
                      ||
                      "—"
                    )

                    :

                    "—"
                  }

                </td>

              `;

            }


            if (
              !stats.best
            ) {

              return `

                <td>
                  —
                </td>

              `;

            }


            if (
              event.maxAvg
            ) {

              return `

                <td>

                  <strong>

                    ${formatNumber(
                      stats.best.value
                    )}

                  </strong>


                  <small class="matrix-sub">

                    avg

                    ${
                      stats.avgLast3
                      ==
                      null

                      ?

                      "—"

                      :

                      formatNumber(
                        stats.avgLast3
                      )
                    }

                  </small>

                </td>

              `;

            }


            return `

              <td>

                <strong>

                  ${formatNumber(
                    stats.best.value
                  )}

                </strong>

              </td>

            `;

          }

        )
          .join("");


      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML =
        `

          <td class="sticky-athlete">

            <button
              class="matrix-player-link"
              data-player-id="${escapeHtml(
                athlete.id
              )}"
            >

              ${escapeHtml(
                athlete.lastName
              )},
              ${escapeHtml(
                athlete.firstName
              )}

            </button>

          </td>


          <td>

            <span class="age-pill">

              ${escapeHtml(
                athlete.ageGroup
              )}

            </span>

          </td>


          ${cells}

        `;


      body.appendChild(
        row
      );

    }

  );


  body
    .querySelectorAll(
      ".matrix-player-link"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            startTesting(
              button.dataset.playerId
            )
        );

      }

    );


  document
    .getElementById(
      "resultsEmpty"
    )
    .classList
    .toggle(

      "hidden",

      rows.length
      >
      0

    );

}



function setMatrixSort(
  key
) {

  if (
    matrixSort.key
    ===
    key
  ) {

    matrixSort.asc =
      !matrixSort.asc;

  }

  else {

    const event =
      getEvent(
        key
      );


    let asc =
      true;


    if (
      event?.direction
      ===
      "high"
    ) {

      asc =
        false;

    }


    if (
      event?.direction
      ===
      "low"
    ) {

      asc =
        true;

    }


    matrixSort = {

      key,

      asc

    };

  }


  renderResultsMatrix();

}



function compareMatrixPlayers(
  a,
  b
) {

  const key =
    matrixSort.key;


  let av;

  let bv;


  if (
    key
    ===
    "athlete"
  ) {

    av =
      `${a.lastName}, ${a.firstName}`;


    bv =
      `${b.lastName}, ${b.firstName}`;

  }


  else if (
    key
    ===
    "ageGroup"
  ) {

    av =
      a.ageGroup;


    bv =
      b.ageGroup;

  }


  else {

    const event =
      getEvent(
        key
      );


    av =
      getSortValue(

        a.id,

        event

      );


    bv =
      getSortValue(

        b.id,

        event

      );


    if (

      av
      ==
      null

      &&

      bv
      ==
      null

    ) {

      return comparePlayers(
        a,
        b
      );

    }


    if (
      av
      ==
      null
    ) {

      return 1;

    }


    if (
      bv
      ==
      null
    ) {

      return -1;

    }


    if (

      typeof av
      ===
      "number"

      &&

      typeof bv
      ===
      "number"

    ) {

      return (

        matrixSort.asc

        ?

        av - bv

        :

        bv - av

      );

    }

  }


  const comparison =

    String(
      av
      ??
      ""
    )

      .localeCompare(

        String(
          bv
          ??
          ""
        ),

        undefined,

        {
          numeric:
            true
        }

      );


  return (

    matrixSort.asc

    ?

    comparison

    :

    -comparison

  );

}



function getSortValue(

  playerId,

  event

) {

  if (
    !event
  ) {

    return null;

  }


  const stats =
    getEventStats(

      playerId,

      event

    );


  if (
    event.type
    ===
    "passfail"
  ) {

    if (
      !stats.latest
    ) {

      return null;

    }


    return (

      stats.latest.assessment
      ===
      "Pass"

      ?

      1

      :

      2

    );

  }


  return (

    stats.best

    ?

    Number(
      stats.best.value
    )

    :

    null

  );

}



function sortArrow(
  key
) {

  if (
    matrixSort.key
    !==
    key
  ) {

    return "";

  }


  return (

    matrixSort.asc

    ?

    "▲"

    :

    "▼"

  );

}



/* ============================================================
   EVENT STATS
============================================================ */

function getEventStats(

  playerId,

  event

) {

  const attempts =

    results

      .filter(

        result =>

          result.athleteId
          ===
          playerId

          &&

          result.event
          ===
          event.key

      )

      .sort(

        (a, b) =>

          getTimestampValue(
            b.createdAt
          )

          -

          getTimestampValue(
            a.createdAt
          )

      );


  if (
    event.type
    ===
    "passfail"
  ) {

    return {

      attempts,

      latest:
        attempts[0]
        ||
        null,

      best:
        null,

      avgLast3:
        null

    };

  }


  const numeric =

    attempts.filter(

      result =>

        Number.isFinite(

          Number(
            result.value
          )

        )

    );


  const best =
    getBestAttempt(

      numeric,

      event.direction

    );


  const last3 =

    numeric

      .slice(
        0,
        3
      )

      .map(
        result =>
          Number(
            result.value
          )
      );


  const avgLast3 =

    last3.length

    ?

    last3.reduce(

      (
        sum,
        number
      ) =>
        sum
        +
        number,

      0

    )

    /
    last3.length

    :

    null;


  return {

    attempts:
      numeric,

    latest:
      numeric[0]
      ||
      null,

    best,

    avgLast3

  };

}



function getBestAttempt(

  attempts,

  direction

) {

  if (
    !attempts.length
  ) {

    return null;

  }


  return attempts.reduce(

    (
      best,
      current
    ) => {

      const bestValue =
        Number(
          best.value
        );


      const currentValue =
        Number(
          current.value
        );


      if (
        direction
        ===
        "low"
      ) {

        return (

          currentValue
          <
          bestValue

          ?

          current

          :

          best

        );

      }


      return (

        currentValue
        >
        bestValue

        ?

        current

        :

        best

      );

    }

  );

}



/* ============================================================
   UPLOAD
============================================================ */

function bindUploader() {

  document
    .getElementById(
      "uploadPlayersButton"
    )
    .addEventListener(
      "click",
      () => {

        if (
          !isAdmin()
        ) {

          return;

        }


        resetImporter();


        openModal(
          "uploadModal"
        );

      }
    );


  document
    .getElementById(
      "playerFileInput"
    )
    .addEventListener(

      "change",

      handleFileUpload

    );


  document
    .getElementById(
      "importPlayersConfirmButton"
    )
    .addEventListener(

      "click",

      importPlayers

    );


  document
    .getElementById(
      "downloadTemplateButton"
    )
    .addEventListener(

      "click",

      downloadTemplate

    );

}



async function handleFileUpload(
  event
) {

  if (
    !isAdmin()
  ) {

    return;

  }


  const file =
    event.target
      .files?.[0];


  if (
    !file
  ) {

    return;

  }


  document
    .getElementById(
      "selectedFileName"
    )
    .textContent =
    file.name;


  try {

    const buffer =
      await file.arrayBuffer();


    const workbook =
      window.XLSX.read(

        buffer,

        {
          type:
            "array"
        }

      );


    const worksheet =

      workbook.Sheets[
        workbook.SheetNames[0]
      ];


    if (
      !worksheet
    ) {

      throw new Error(
        "No worksheet found."
      );

    }


    const rawRows =

      window.XLSX.utils
        .sheet_to_json(

          worksheet,

          {

            defval:
              "",

            raw:
              false

          }

        );


    if (
      !rawRows.length
    ) {

      throw new Error(
        "The file contains no player rows."
      );

    }


    importRows =
      buildImportRows(
        rawRows
      );


    renderImportPreview();

  }

  catch (error) {

    console.error(

      "READ IMPORT",

      error

    );


    showMessage(

      document
        .getElementById(
          "importMessage"
        ),

      error.message
      ||
      "Could not read file.",

      "error"

    );

  }

}



function buildImportRows(
  rawRows
) {

  const seen =
    new Set();


  return rawRows.map(

    raw => {

      const row =
        normalizeSpreadsheetRow(
          raw
        );


      const firstName =
        cleanText(

          row[
            "first name"
          ]

          ??

          row.firstname

          ??

          row.first

          ??

          ""

        );


      const lastName =
        cleanText(

          row[
            "last name"
          ]

          ??

          row.lastname

          ??

          row.last

          ??

          ""

        );


      const ageGroup =
        normalizeAgeGroup(

          row[
            "age group"
          ]

          ??

          row.agegroup

          ??

          row.age

          ??

          ""

        );


      const item = {

        firstName,

        lastName,

        ageGroup,

        status:
          "new",

        reason:
          "Ready to import"

      };


      if (

        !firstName

        ||

        !lastName

        ||

        !ageGroup

      ) {

        return {

          ...item,

          status:
            "invalid",

          reason:
            "Missing required information"

        };

      }


      const key =
        playerMatchKey(

          firstName,

          lastName,

          ageGroup

        );


      if (
        seen.has(
          key
        )
      ) {

        return {

          ...item,

          status:
            "duplicate",

          reason:
            "Duplicate row in file"

        };

      }


      seen.add(
        key
      );


      if (

        findExistingPlayer(

          firstName,

          lastName,

          ageGroup

        )

      ) {

        return {

          ...item,

          status:
            "duplicate",

          reason:
            "Already exists — skipped"

        };

      }


      return item;

    }

  );

}



function renderImportPreview() {

  const newRows =
    importRows.filter(

      row =>
        row.status
        ===
        "new"

    );


  const duplicates =
    importRows.filter(

      row =>
        row.status
        ===
        "duplicate"

    );


  const invalid =
    importRows.filter(

      row =>
        row.status
        ===
        "invalid"

    );


  document
    .getElementById(
      "summaryTotal"
    )
    .textContent =
    importRows.length;


  document
    .getElementById(
      "summaryNew"
    )
    .textContent =
    newRows.length;


  document
    .getElementById(
      "summaryDuplicate"
    )
    .textContent =
    duplicates.length;


  document
    .getElementById(
      "summaryInvalid"
    )
    .textContent =
    invalid.length;


  document
    .getElementById(
      "importSummary"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "previewSection"
    )
    .classList
    .remove(
      "hidden"
    );


  document
    .getElementById(
      "previewBody"
    )
    .innerHTML =

    importRows.map(

      row =>
        `

          <tr>

            <td>
              ${escapeHtml(
                row.firstName
                ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                row.lastName
                ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                row.ageGroup
                ||
                "—"
              )}
            </td>

            <td>

              <span
                class="status-pill status-${row.status}"
              >

                ${escapeHtml(
                  row.reason
                )}

              </span>

            </td>

          </tr>

        `

    )
      .join("");


  document
    .getElementById(
      "importPlayersConfirmButton"
    )
    .disabled =

    !newRows.length;


  showMessage(

    document
      .getElementById(
        "importMessage"
      ),

    `${newRows.length} new player${newRows.length === 1 ? "" : "s"} ready. Existing players will not be changed.`,

    newRows.length

    ?

    "success"

    :

    "warning"

  );

}



async function importPlayers() {

  if (
    !isAdmin()
  ) {

    return;

  }


  const button =
    document
      .getElementById(
        "importPlayersConfirmButton"
      );


  button.disabled =
    true;


  button.textContent =
    "Importing…";


  await loadAthletes();


  let imported =
    0;


  let skipped =
    0;


  let failed =
    0;


  for (

    const player

    of

    importRows.filter(

      row =>
        row.status
        ===
        "new"

    )

  ) {

    if (

      findExistingPlayer(

        player.firstName,

        player.lastName,

        player.ageGroup

      )

    ) {

      skipped++;

      continue;

    }


    const ref =
      doc(

        db,

        PLAYERS_COLLECTION,

        playerDocumentId(

          player.firstName,

          player.lastName,

          player.ageGroup

        )

      );


    try {

      const existing =
        await getDoc(
          ref
        );


      if (
        existing.exists()
      ) {

        skipped++;

        continue;

      }


      await setDoc(

        ref,

        {

          firstName:
            player.firstName,


          lastName:
            player.lastName,


          ageGroup:
            player.ageGroup,


          normalizedFirstName:
            normalizeText(
              player.firstName
            ),


          normalizedLastName:
            normalizeText(
              player.lastName
            ),


          normalizedAgeGroup:
            normalizeText(
              player.ageGroup
            ),


          createdByUid:
            currentUser.uid,


          createdByEmail:
            currentUser.email
            ||
            "",


          createdAt:
            serverTimestamp()

        }

      );


      imported++;

    }

    catch (error) {

      console.error(

        "IMPORT PLAYER",

        player,

        error

      );


      failed++;

    }

  }


  await refreshData();


  button.textContent =
    "Import Players";


  button.disabled =
    true;


  showMessage(

    document
      .getElementById(
        "importMessage"
      ),

    `${imported} imported. ${skipped} duplicates skipped. ${failed} failed. Existing player data was not changed.`,

    failed

    ?

    "warning"

    :

    "success"

  );

}



function resetImporter() {

  importRows =
    [];


  document
    .getElementById(
      "playerFileInput"
    )
    .value =
    "";


  document
    .getElementById(
      "selectedFileName"
    )
    .textContent =
    "No file selected.";


  document
    .getElementById(
      "previewBody"
    )
    .innerHTML =
    "";


  document
    .getElementById(
      "previewSection"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "importSummary"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "importPlayersConfirmButton"
    )
    .disabled =
    true;


  document
    .getElementById(
      "importPlayersConfirmButton"
    )
    .textContent =
    "Import Players";


  hideMessage(

    document
      .getElementById(
        "importMessage"
      )

  );

}



function downloadTemplate() {

  const csv =

    [
      [
        "First Name",
        "Last Name",
        "Age Group"
      ],

      [
        "John",
        "Smith",
        "14U"
      ]
    ]

      .map(

        row =>
          row
            .map(
              csvEscape
            )
            .join(",")

      )

      .join("\n");


  const blob =
    new Blob(

      [
        csv
      ],

      {
        type:
          "text/csv;charset=utf-8"
      }

    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "combine-player-template.csv";


  document.body
    .appendChild(
      link
    );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}



/* ============================================================
   MODALS
============================================================ */

function bindModals() {

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(

      button => {

        button.addEventListener(
          "click",
          () =>
            closeModal(
              button.dataset.close
            )
        );

      }

    );


  document
    .querySelectorAll(
      ".modal-backdrop"
    )
    .forEach(

      backdrop => {

        backdrop.addEventListener(
          "click",
          event => {

            if (
              event.target
              ===
              backdrop
            ) {

              closeModal(
                backdrop.id
              );

            }

          }
        );

      }

    );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key
        ===
        "Escape"
      ) {

        document
          .querySelectorAll(
            ".modal-backdrop:not(.hidden)"
          )
          .forEach(

            modal =>
              closeModal(
                modal.id
              )

          );


        closeIndexDrawer();

      }

    }
  );

}



function openModal(
  id
) {

  document
    .getElementById(
      id
    )
    .classList
    .remove(
      "hidden"
    );


  document.body
    .classList
    .add(
      "modal-open"
    );

}



function closeModal(
  id
) {

  document
    .getElementById(
      id
    )
    .classList
    .add(
      "hidden"
    );


  document.body
    .classList
    .remove(
      "modal-open"
    );

}



/* ============================================================
   HELPERS
============================================================ */

function getEvent(
  key
) {

  return EVENTS.find(

    event =>
      event.key
      ===
      key

  );

}



function getTimestampValue(
  timestamp
) {

  if (
    !timestamp
  ) {

    return 0;

  }


  if (
    typeof timestamp.toMillis
    ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  if (
    timestamp.seconds
  ) {

    return (

      timestamp.seconds
      *
      1000

    );

  }


  const value =
    new Date(
      timestamp
    )
      .getTime();


  return (

    Number.isFinite(
      value
    )

    ?

    value

    :

    0

  );

}



function shortDate(
  timestamp
) {

  const milliseconds =
    getTimestampValue(
      timestamp
    );


  if (
    !milliseconds
  ) {

    return "Just now";

  }


  return new Date(
    milliseconds
  )
    .toLocaleString(

      [],

      {

        month:
          "short",

        day:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"

      }

    );

}



function shortCoachName(
  email
) {

  return (

    email

    ?

    String(email)
      .split("@")[0]

    :

    ""

  );

}



function formatNumber(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "—";

  }


  return number
    .toLocaleString(

      undefined,

      {

        maximumFractionDigits:
          2

      }

    );

}



function cleanText(
  value
) {

  return String(
    value
    ??
    ""
  )

    .trim()

    .replace(
      /\s+/g,
      " "
    );

}



function normalizeText(
  value
) {

  return cleanText(
    value
  )
    .toLowerCase();

}



function normalizeAgeGroup(
  value
) {

  return cleanText(
    value
  )

    .toUpperCase()

    .replace(
      /^(\d{1,2})\s*[- ]?\s*U$/i,
      "$1U"
    );

}



function comparePlayers(
  a,
  b
) {

  const last =
    a.lastName
      .localeCompare(

        b.lastName,

        undefined,

        {
          numeric:
            true
        }

      );


  return (

    last

    ||

    a.firstName
      .localeCompare(

        b.firstName,

        undefined,

        {
          numeric:
            true
        }

      )

  );

}



function naturalSort(
  a,
  b
) {

  return String(a)
    .localeCompare(

      String(b),

      undefined,

      {
        numeric:
          true
      }

    );

}



function findExistingPlayer(

  firstName,

  lastName,

  ageGroup

) {

  const target =
    playerMatchKey(

      firstName,

      lastName,

      ageGroup

    );


  return athletes.find(

    athlete =>

      playerMatchKey(

        athlete.firstName,

        athlete.lastName,

        athlete.ageGroup

      )

      ===
      target

  );

}



function playerMatchKey(

  firstName,

  lastName,

  ageGroup

) {

  return [

    normalizeText(
      firstName
    ),

    normalizeText(
      lastName
    ),

    normalizeText(

      normalizeAgeGroup(
        ageGroup
      )

    )

  ]
    .join("|");

}



function playerDocumentId(

  firstName,

  lastName,

  ageGroup

) {

  const key =
    playerMatchKey(

      firstName,

      lastName,

      ageGroup

    );


  const slug =

    `${normalizeText(firstName)}-${normalizeText(lastName)}-${normalizeText(ageGroup)}`

      .replace(
        /[^a-z0-9]+/g,
        "-"
      )

      .replace(
        /^-+|-+$/g,
        ""
      )

      .slice(
        0,
        80
      );


  return (

    `${slug}-${hashString(key)}`

  );

}



function hashString(
  value
) {

  let hash =
    2166136261;


  for (

    let i =
      0;

    i
    <
    value.length;

    i++

  ) {

    hash ^=
      value.charCodeAt(i);


    hash =
      Math.imul(

        hash,

        16777619

      );

  }


  return (

    hash
    >>>
    0

  )
    .toString(
      36
    );

}



function normalizeSpreadsheetRow(
  raw
) {

  const output =
    {};


  Object
    .entries(
      raw
      ||
      {}
    )
    .forEach(

      (
        [
          key,
          value
        ]
      ) => {

        output[

          String(key)

            .trim()

            .toLowerCase()

            .replace(
              /[_-]+/g,
              " "
            )

            .replace(
              /\s+/g,
              " "
            )

        ] = value;

      }

    );


  return output;

}



function updateAgeFilters() {

  const ages =

    [
      ...new Set(

        athletes

          .map(
            athlete =>
              athlete.ageGroup
          )

          .filter(
            Boolean
          )

      )
    ]

      .sort(
        naturalSort
      );


  [
    "athleteAgeFilter",
    "resultsAgeFilter"
  ]
    .forEach(

      id => {

        const select =
          document
            .getElementById(
              id
            );


        const previous =
          select.value;


        select.innerHTML =

          `<option value="">All Age Groups</option>`

          +

          ages.map(

            age =>
              `

                <option value="${escapeHtml(
                  age
                )}">

                  ${escapeHtml(
                    age
                  )}

                </option>

              `

          )
            .join("");


        if (
          ages.includes(
            previous
          )
        ) {

          select.value =
            previous;

        }

      }

    );

}



function csvEscape(
  value
) {

  return (

    `"${String(
      value
      ??
      ""
    )
      .replace(
        /"/g,
        '""'
      )}"`

  );

}



function escapeHtml(
  value
) {

  return String(
    value
    ??
    ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}



function showMessage(

  element,

  text,

  type

) {

  element.textContent =
    text;


  element.className =
    `message message-${type}`;

}



function hideMessage(
  element
) {

  element.textContent =
    "";


  element.className =
    "message hidden";

}



let toastTimer;


function showToast(

  text,

  isError =
    false

) {

  const toast =
    document
      .getElementById(
        "toast"
      );


  toast.textContent =
    text;


  toast.className =

    `toast${
      isError
      ?
      " toast-error"
      :
      ""
    }`;


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(

      () =>
        toast.classList
          .add(
            "hidden"
          ),

      3500

    );

}
