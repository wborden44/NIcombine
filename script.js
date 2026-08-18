/* ============================================================
   NINTH INNING COMBINE TRACKER
   Firebase / Firestore Version
============================================================ */


/* ============================================================
   FIREBASE IMPORTS
============================================================ */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



/* ============================================================
   FIREBASE CONFIG

   IMPORTANT:
   REPLACE THIS ENTIRE OBJECT WITH YOUR ACTUAL
   FIREBASE CONFIG FROM:

   Firebase
   -> Project Settings
   -> General
   -> Your apps
   -> SDK setup and configuration
============================================================ */

const firebaseConfig = {
  apiKey: "PASTE_YOUR_REAL_API_KEY_HERE",
  authDomain: "PASTE_YOUR_REAL_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_REAL_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_REAL_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_REAL_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_REAL_APP_ID_HERE"
};



/* ============================================================
   INITIALIZE FIREBASE
============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);



/* ============================================================
   ADMIN ACCOUNT

   ONLY THIS EMAIL CAN IMPORT PLAYERS
============================================================ */

const ADMIN_EMAIL =
  "wes@ninthinningbaseball.com";



/* ============================================================
   COLLECTION NAMES

   YOUR EXISTING DATABASE USES "players"
   SO WE ARE USING THAT HERE.
============================================================ */

const PLAYERS_COLLECTION = "players";

const RESULTS_COLLECTION = "results";



/* ============================================================
   EVENT SETTINGS

   direction:

   high
   = highest score wins

   low
   = lowest score wins

   passfail
   = pass / fail assessment
============================================================ */

const EVENTS = [

  {
    key: "gripStrength",
    label: "Grip Strength",
    unit: "lbs",
    direction: "high",
    step: "0.1",
    placeholder: "Example: 92.5"
  },


  {
    key: "fiveTenFive",
    label: "5/10/5 Run",
    unit: "sec",
    direction: "low",
    step: "0.01",
    placeholder: "Example: 4.72"
  },


  {
    key: "tenYardShuttle",
    label: "10 Yard Shuttle",
    unit: "sec",
    direction: "low",
    step: "0.01",
    placeholder: "Example: 2.08"
  },


  {
    key: "squatAssessment",
    label: "Squat Assessment",
    unit: "",
    direction: "passfail"
  },


  {
    key: "broadJump",
    label: "Broad Jump",
    unit: "in",
    direction: "high",
    step: "0.25",
    placeholder: "Total inches"
  }

];



/* ============================================================
   APPLICATION STATE
============================================================ */

let currentUser = null;

let athletes = [];

let results = [];

let selectedAthlete = null;

let importRows = [];


let athleteSort = {
  key: "lastName",
  ascending: true
};


let resultSort = {
  key: "athlete",
  ascending: true
};



/* ============================================================
   DOM READY
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupNavigation();

    setupLogin();

    setupAthleteControls();

    setupTestingControls();

    setupResultControls();

    setupUploader();

    renderEventFilter();

    renderTestCards();

  }
);



/* ============================================================
   LOGIN SETUP
============================================================ */

function setupLogin() {

  document
    .getElementById("loginForm")
    .addEventListener(
      "submit",
      handleLogin
    );


  document
    .getElementById("logoutButton")
    .addEventListener(
      "click",
      async () => {

        await signOut(auth);

      }
    );

}



/* ============================================================
   LOGIN
============================================================ */

async function handleLogin(event) {

  event.preventDefault();


  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();


  const password =
    document
      .getElementById("loginPassword")
      .value;


  const message =
    document
      .getElementById("loginMessage");


  hideMessage(message);


  if (!email || !password) {

    showMessage(
      message,
      "Enter your email and password.",
      "error"
    );

    return;

  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  }

  catch (error) {

    console.error(
      "LOGIN ERROR:",
      error.code,
      error.message
    );


    let friendlyMessage =
      `${error.code}: ${error.message}`;


    if (
      error.code === "auth/invalid-credential"
      ||
      error.code === "auth/wrong-password"
      ||
      error.code === "auth/user-not-found"
    ) {

      friendlyMessage =
        "Invalid email or password.";

    }


    else if (
      error.code === "auth/operation-not-allowed"
    ) {

      friendlyMessage =
        "Email/password login is not enabled in Firebase Authentication.";

    }


    else if (
      error.code === "auth/invalid-api-key"
    ) {

      friendlyMessage =
        "Firebase configuration is incorrect. Check the firebaseConfig section in script.js.";

    }


    else if (
      error.code === "auth/network-request-failed"
    ) {

      friendlyMessage =
        "Network error. Check your internet connection and try again.";

    }


    showMessage(
      message,
      friendlyMessage,
      "error"
    );

  }

}



/* ============================================================
   AUTH STATE
============================================================ */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;


    if (!user) {

      document
        .getElementById("loginScreen")
        .classList
        .remove("hidden");


      document
        .getElementById("app")
        .classList
        .add("hidden");


      selectedAthlete = null;

      athletes = [];

      results = [];

      return;

    }


    document
      .getElementById("loginScreen")
      .classList
      .add("hidden");


    document
      .getElementById("app")
      .classList
      .remove("hidden");


    document
      .getElementById("loggedInEmail")
      .textContent =
      user.email || "";


    updateAdminControls();


    await refreshData();

  }
);



/* ============================================================
   ADMIN CHECK
============================================================ */

function isAdmin() {

  if (!currentUser?.email) {

    return false;

  }


  return (
    currentUser.email
      .trim()
      .toLowerCase()
    ===
    ADMIN_EMAIL.toLowerCase()
  );

}



/* ============================================================
   ADMIN CONTROLS
============================================================ */

function updateAdminControls() {

  const uploadButton =
    document
      .getElementById("uploadPlayersButton");


  const adminBadge =
    document
      .getElementById("adminBadge");


  if (isAdmin()) {

    uploadButton
      .classList
      .remove("hidden");


    adminBadge
      .classList
      .remove("hidden");

  }

  else {

    uploadButton
      .classList
      .add("hidden");


    adminBadge
      .classList
      .add("hidden");

  }

}



/* ============================================================
   REFRESH DATABASE
============================================================ */

async function refreshData() {

  await Promise.all([
    loadAthletes(),
    loadResults()
  ]);


  updateAgeFilters();

  renderAthleteTable();

  renderTestingAthletes();

  renderResults();

  updateSelectedAthlete();

}



/* ============================================================
   LOAD PLAYERS
============================================================ */

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
      snapshot.docs.map(
        document => {

          const data =
            document.data();


          return {

            id: document.id,

            ...data,

            firstName:
              cleanText(
                data.firstName
                ??
                data.first_name
                ??
                data.firstname
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
      );


    athletes.sort(
      (a, b) => {

        const last =
          a.lastName.localeCompare(
            b.lastName
          );


        if (last !== 0) {

          return last;

        }


        return a.firstName.localeCompare(
          b.firstName
        );

      }
    );

  }

  catch (error) {

    console.error(
      "Could not load players:",
      error
    );


    showToast(
      `Could not load players: ${error.message}`,
      true
    );

  }

}



/* ============================================================
   LOAD RESULTS
============================================================ */

async function loadResults() {

  try {

    const q =
      query(
        collection(
          db,
          RESULTS_COLLECTION
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    results =
      snapshot.docs.map(
        document => ({
          id: document.id,
          ...document.data()
        })
      );

  }

  catch (error) {

    console.warn(
      "Ordered results query failed. Trying fallback.",
      error
    );


    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            RESULTS_COLLECTION
          )
        );


      results =
        snapshot.docs.map(
          document => ({
            id: document.id,
            ...document.data()
          })
        );

    }

    catch (secondError) {

      console.error(
        "Could not load results:",
        secondError
      );


      showToast(
        `Could not load results: ${secondError.message}`,
        true
      );

    }

  }

}



/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

  document
    .querySelectorAll(".nav-tab")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(".nav-tab")
              .forEach(
                tab => {
                  tab.classList.remove("active");
                }
              );


            document
              .querySelectorAll(".view")
              .forEach(
                view => {
                  view.classList.remove("active");
                }
              );


            button.classList.add("active");


            document
              .getElementById(
                button.dataset.view
              )
              .classList
              .add("active");


            if (
              button.dataset.view === "resultsView"
            ) {

              renderResults();

            }

          }
        );

      }
    );

}



/* ============================================================
   TESTING CONTROLS
============================================================ */

function setupTestingControls() {

  document
    .getElementById("testingSearch")
    .addEventListener(
      "input",
      renderTestingAthletes
    );


  document
    .getElementById("testingAgeFilter")
    .addEventListener(
      "change",
      renderTestingAthletes
    );


  document
    .getElementById("changeAthleteButton")
    .addEventListener(
      "click",
      () => {

        selectedAthlete = null;

        updateSelectedAthlete();

      }
    );

}



/* ============================================================
   TESTING ATHLETE LIST
============================================================ */

function renderTestingAthletes() {

  const container =
    document
      .getElementById("testingAthleteList");


  const search =
    normalizeText(
      document
        .getElementById("testingSearch")
        .value
    );


  const age =
    normalizeAgeGroup(
      document
        .getElementById("testingAgeFilter")
        .value
    );


  let filtered =
    athletes.filter(
      athlete => {

        const searchText =
          normalizeText(
            `${athlete.firstName} ${athlete.lastName} ${athlete.ageGroup}`
          );


        const matchesSearch =
          !search
          ||
          searchText.includes(search);


        const matchesAge =
          !age
          ||
          athlete.ageGroup === age;


        return (
          matchesSearch
          &&
          matchesAge
        );

      }
    );


  filtered =
    filtered.slice(
      0,
      50
    );


  container.innerHTML = "";


  if (!filtered.length) {

    container.innerHTML =
      `
        <div class="empty-state">
          No matching athletes.
        </div>
      `;

    return;

  }


  filtered.forEach(
    athlete => {

      const button =
        document.createElement("button");


      button.type =
        "button";


      button.className =
        "athlete-pick";


      button.innerHTML =
        `
          <div>

            <strong>
              ${escapeHtml(athlete.firstName)}
              ${escapeHtml(athlete.lastName)}
            </strong>

            <small>
              ${escapeHtml(athlete.ageGroup)}
            </small>

          </div>

          <span class="arrow">
            ›
          </span>
        `;


      button.addEventListener(
        "click",
        () => {

          selectedAthlete =
            athlete;


          document
            .getElementById("testingSearch")
            .value = "";


          updateSelectedAthlete();

        }
      );


      container.appendChild(
        button
      );

    }
  );

}



/* ============================================================
   SELECTED ATHLETE
============================================================ */

function updateSelectedAthlete() {

  const selector =
    document
      .getElementById("athleteSelectorPanel");


  const selectedPanel =
    document
      .getElementById("selectedAthletePanel");


  const testGrid =
    document
      .getElementById("testGrid");


  if (!selectedAthlete) {

    selector
      .classList
      .remove("hidden");


    selectedPanel
      .classList
      .add("hidden");


    testGrid
      .classList
      .add("hidden");


    renderTestingAthletes();

    return;

  }


  selector
    .classList
    .add("hidden");


  selectedPanel
    .classList
    .remove("hidden");


  testGrid
    .classList
    .remove("hidden");


  document
    .getElementById("selectedAthleteName")
    .textContent =
    `${selectedAthlete.firstName} ${selectedAthlete.lastName}`;


  document
    .getElementById("selectedAthleteAge")
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
      .getElementById("testGrid");


  grid.innerHTML = "";


  EVENTS.forEach(
    event => {

      const card =
        document.createElement("article");


      card.className =
        "test-card";


      const attempts =
        selectedAthlete
        ?
        getAttempts(
          selectedAthlete.id,
          event.key
        )
        :
        [];


      const best =
        selectedAthlete
        ?
        getBestResult(
          selectedAthlete.id,
          event.key
        )
        :
        null;



      if (
        event.direction === "passfail"
      ) {

        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <div class="kicker">
                  ASSESSMENT
                </div>

                <h3>
                  ${escapeHtml(event.label)}
                </h3>

              </div>


              ${
                best
                ?
                `
                <span class="best-chip">
                  ${escapeHtml(
                    formatResult(
                      best,
                      event
                    )
                  )}
                </span>
                `
                :
                ""
              }

            </div>


            <div class="pass-fail-grid">

              <button
                class="assessment-button pass"
                data-event="${event.key}"
                data-assessment="Pass"
              >
                PASS
              </button>


              <button
                class="assessment-button fail"
                data-event="${event.key}"
                data-assessment="Fail"
              >
                FAIL
              </button>

            </div>


            ${renderAttemptHistory(
              attempts,
              event
            )}

          `;

      }

      else {

        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <div class="kicker">

                  ${
                    event.direction === "low"
                    ?
                    "LOWEST IS BEST"
                    :
                    "HIGHEST IS BEST"
                  }

                </div>


                <h3>
                  ${escapeHtml(event.label)}
                </h3>

              </div>


              ${
                best
                ?
                `
                <span class="best-chip">
                  ${escapeHtml(
                    formatResult(
                      best,
                      event
                    )
                  )}
                </span>
                `
                :
                ""
              }

            </div>


            <div class="result-entry-row">

              <input
                id="test-${event.key}"
                type="number"
                inputmode="decimal"
                step="${event.step}"
                placeholder="${escapeHtml(event.placeholder)}"
              />


              <span class="unit">
                ${escapeHtml(event.unit)}
              </span>


              <button
                class="button save-result-button"
                data-event="${event.key}"
              >
                Save
              </button>

            </div>


            ${renderAttemptHistory(
              attempts,
              event
            )}

          `;

      }


      grid.appendChild(
        card
      );

    }
  );



  document
    .querySelectorAll(".save-result-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            saveNumericResult(
              button.dataset.event
            );

          }
        );

      }
    );



  document
    .querySelectorAll(".assessment-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            saveAssessment(
              button.dataset.event,
              button.dataset.assessment
            );

          }
        );

      }
    );

}



/* ============================================================
   SAVE NUMERIC RESULT
============================================================ */

async function saveNumericResult(eventKey) {

  if (
    !selectedAthlete
    ||
    !currentUser
  ) {

    return;

  }


  const event =
    getEvent(eventKey);


  const input =
    document
      .getElementById(
        `test-${eventKey}`
      );


  const value =
    Number(
      input.value
    );


  if (
    !Number.isFinite(value)
  ) {

    showToast(
      "Enter a valid number.",
      true
    );


    input.focus();

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

        athleteFirstName:
          selectedAthlete.firstName,

        athleteLastName:
          selectedAthlete.lastName,

        ageGroup:
          selectedAthlete.ageGroup,

        event:
          eventKey,

        value:
          value,

        assessment:
          null,

        enteredByUid:
          currentUser.uid,

        enteredByEmail:
          currentUser.email || "",

        createdAt:
          serverTimestamp()

      }
    );


    input.value = "";


    await loadResults();


    renderTestCards();

    renderResults();


    showToast(
      `${event.label} saved.`
    );

  }

  catch (error) {

    console.error(error);


    showToast(
      `Could not save result: ${error.message}`,
      true
    );

  }

}



/* ============================================================
   SAVE PASS / FAIL
============================================================ */

async function saveAssessment(
  eventKey,
  assessment
) {

  if (
    !selectedAthlete
    ||
    !currentUser
  ) {

    return;

  }


  const event =
    getEvent(eventKey);


  try {

    await addDoc(
      collection(
        db,
        RESULTS_COLLECTION
      ),
      {

        athleteId:
          selectedAthlete.id,

        athleteFirstName:
          selectedAthlete.firstName,

        athleteLastName:
          selectedAthlete.lastName,

        ageGroup:
          selectedAthlete.ageGroup,

        event:
          eventKey,

        value:
          null,

        assessment:
          assessment,

        enteredByUid:
          currentUser.uid,

        enteredByEmail:
          currentUser.email || "",

        createdAt:
          serverTimestamp()

      }
    );


    await loadResults();


    renderTestCards();

    renderResults();


    showToast(
      `${event.label}: ${assessment}`
    );

  }

  catch (error) {

    console.error(error);


    showToast(
      `Could not save assessment: ${error.message}`,
      true
    );

  }

}



/* ============================================================
   ATTEMPTS
============================================================ */

function getAttempts(
  athleteId,
  eventKey
) {

  return results
    .filter(
      result => (
        result.athleteId === athleteId
        &&
        result.event === eventKey
      )
    )
    .sort(
      (a, b) => (
        getTimestampValue(b.createdAt)
        -
        getTimestampValue(a.createdAt)
      )
    );

}



/* ============================================================
   BEST RESULT
============================================================ */

function getBestResult(
  athleteId,
  eventKey
) {

  const event =
    getEvent(eventKey);


  const attempts =
    getAttempts(
      athleteId,
      eventKey
    );


  if (
    !event
    ||
    !attempts.length
  ) {

    return null;

  }


  if (
    event.direction === "passfail"
  ) {

    return attempts[0];

  }


  const numeric =
    attempts.filter(
      result =>
        Number.isFinite(
          Number(result.value)
        )
    );


  if (!numeric.length) {

    return null;

  }


  return numeric.reduce(
    (best, current) => {

      const bestValue =
        Number(best.value);


      const currentValue =
        Number(current.value);


      if (
        event.direction === "low"
      ) {

        return (
          currentValue < bestValue
          ?
          current
          :
          best
        );

      }


      return (
        currentValue > bestValue
        ?
        current
        :
        best
      );

    }
  );

}



/* ============================================================
   ATTEMPT DISPLAY
============================================================ */

function renderAttemptHistory(
  attempts,
  event
) {

  if (!attempts.length) {

    return `
      <div class="no-attempts">
        No entries yet.
      </div>
    `;

  }


  const best =
    selectedAthlete
    ?
    getBestResult(
      selectedAthlete.id,
      event.key
    )
    :
    null;


  return `
    <div class="attempt-history">

      <div class="attempt-title">
        All Entries
      </div>

      ${
        attempts.map(
          attempt => {

            const bestClass =
              best
              &&
              best.id === attempt.id
              ?
              "best-attempt"
              :
              "";


            return `
              <div
                class="attempt-row ${bestClass}"
              >

                <span>
                  ${escapeHtml(
                    formatResult(
                      attempt,
                      event
                    )
                  )}
                </span>

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
            `;

          }
        ).join("")
      }

    </div>
  `;

}



/* ============================================================
   ATHLETE CONTROLS
============================================================ */

function setupAthleteControls() {

  document
    .getElementById("athleteSearch")
    .addEventListener(
      "input",
      renderAthleteTable
    );


  document
    .getElementById("athleteAgeFilter")
    .addEventListener(
      "change",
      renderAthleteTable
    );


  document
    .querySelectorAll("[data-athlete-sort]")
    .forEach(
      header => {

        header.addEventListener(
          "click",
          () => {

            const key =
              header.dataset.athleteSort;


            if (
              athleteSort.key === key
            ) {

              athleteSort.ascending =
                !athleteSort.ascending;

            }

            else {

              athleteSort = {
                key,
                ascending: true
              };

            }


            renderAthleteTable();

          }
        );

      }
    );

}



/* ============================================================
   ATHLETE TABLE
============================================================ */

function renderAthleteTable() {

  const body =
    document
      .getElementById("athleteTableBody");


  const empty =
    document
      .getElementById("athleteEmpty");


  const search =
    normalizeText(
      document
        .getElementById("athleteSearch")
        .value
    );


  const age =
    normalizeAgeGroup(
      document
        .getElementById("athleteAgeFilter")
        .value
    );


  let filtered =
    athletes.filter(
      athlete => {

        const text =
          normalizeText(
            `${athlete.firstName} ${athlete.lastName} ${athlete.ageGroup}`
          );


        return (
          (
            !search
            ||
            text.includes(search)
          )
          &&
          (
            !age
            ||
            athlete.ageGroup === age
          )
        );

      }
    );


  filtered.sort(
    (a, b) => {

      const av =
        String(
          a[athleteSort.key] ?? ""
        );


      const bv =
        String(
          b[athleteSort.key] ?? ""
        );


      const comparison =
        av.localeCompare(
          bv,
          undefined,
          {
            numeric: true
          }
        );


      return athleteSort.ascending
        ?
        comparison
        :
        -comparison;

    }
  );


  body.innerHTML = "";


  filtered.forEach(
    athlete => {

      const row =
        document.createElement("tr");


      row.innerHTML =
        `

          <td>
            ${escapeHtml(athlete.firstName)}
          </td>

          <td>
            ${escapeHtml(athlete.lastName)}
          </td>

          <td>

            <span class="age-pill">
              ${escapeHtml(athlete.ageGroup)}
            </span>

          </td>

        `;


      body.appendChild(
        row
      );

    }
  );


  empty.classList.toggle(
    "hidden",
    filtered.length !== 0
  );

}



/* ============================================================
   RESULTS CONTROLS
============================================================ */

function setupResultControls() {

  document
    .getElementById("resultsSearch")
    .addEventListener(
      "input",
      renderResults
    );


  document
    .getElementById("resultsAgeFilter")
    .addEventListener(
      "change",
      renderResults
    );


  document
    .getElementById("resultsEventFilter")
    .addEventListener(
      "change",
      renderResults
    );


  document
    .querySelectorAll("[data-result-sort]")
    .forEach(
      header => {

        header.addEventListener(
          "click",
          () => {

            const key =
              header.dataset.resultSort;


            if (
              resultSort.key === key
            ) {

              resultSort.ascending =
                !resultSort.ascending;

            }

            else {

              resultSort = {
                key,
                ascending: true
              };

            }


            renderResults();

          }
        );

      }
    );

}



/* ============================================================
   RESULTS TABLE
============================================================ */

function renderResults() {

  const body =
    document
      .getElementById("resultsTableBody");


  const empty =
    document
      .getElementById("resultsEmpty");


  const search =
    normalizeText(
      document
        .getElementById("resultsSearch")
        .value
    );


  const age =
    normalizeAgeGroup(
      document
        .getElementById("resultsAgeFilter")
        .value
    );


  const eventFilter =
    document
      .getElementById("resultsEventFilter")
      .value;


  let rows =
    results.map(
      result => {

        let athlete =
          athletes.find(
            player =>
              player.id === result.athleteId
          );


        if (!athlete) {

          athlete = {
            id:
              result.athleteId,

            firstName:
              result.athleteFirstName ?? "",

            lastName:
              result.athleteLastName ?? "",

            ageGroup:
              result.ageGroup ?? ""
          };

        }


        const event =
          getEvent(
            result.event
          );


        if (!event) {

          return null;

        }


        const best =
          getBestResult(
            athlete.id,
            event.key
          );


        return {
          result,
          athlete,
          event,
          best:
            best
            &&
            best.id === result.id
        };

      }
    )
    .filter(Boolean);



  rows =
    rows.filter(
      row => {

        const text =
          normalizeText(
            `${row.athlete.firstName} ${row.athlete.lastName}`
          );


        return (
          (
            !search
            ||
            text.includes(search)
          )
          &&
          (
            !age
            ||
            normalizeAgeGroup(
              row.athlete.ageGroup
            ) === age
          )
          &&
          (
            !eventFilter
            ||
            row.event.key === eventFilter
          )
        );

      }
    );


  rows.sort(
    compareResultRows
  );


  body.innerHTML = "";


  rows.forEach(
    item => {

      const row =
        document.createElement("tr");


      if (item.best) {

        row.classList.add(
          "best-result-row"
        );

      }


      row.innerHTML =
        `

          <td>
            <strong>
              ${escapeHtml(item.athlete.firstName)}
              ${escapeHtml(item.athlete.lastName)}
            </strong>
          </td>


          <td>

            <span class="age-pill">
              ${escapeHtml(item.athlete.ageGroup)}
            </span>

          </td>


          <td>
            ${escapeHtml(item.event.label)}
          </td>


          <td>

            <span
              class="${item.best ? "best-result-value" : ""}"
            >
              ${escapeHtml(
                formatResult(
                  item.result,
                  item.event
                )
              )}
            </span>

          </td>


          <td>
            ${escapeHtml(
              shortCoachName(
                item.result.enteredByEmail ?? ""
              )
            )}
          </td>


          <td>
            ${escapeHtml(
              shortDate(
                item.result.createdAt
              )
            )}
          </td>

        `;


      body.appendChild(
        row
      );

    }
  );


  empty.classList.toggle(
    "hidden",
    rows.length !== 0
  );

}



/* ============================================================
   RESULT SORTING
============================================================ */

function compareResultRows(
  a,
  b
) {

  let av;

  let bv;


  switch (
    resultSort.key
  ) {

    case "athlete":

      av =
        `${a.athlete.lastName}, ${a.athlete.firstName}`;

      bv =
        `${b.athlete.lastName}, ${b.athlete.firstName}`;

      break;


    case "ageGroup":

      av =
        a.athlete.ageGroup;

      bv =
        b.athlete.ageGroup;

      break;


    case "event":

      av =
        a.event.label;

      bv =
        b.event.label;

      break;


    case "value":

      av =
        a.result.assessment
        ??
        a.result.value
        ??
        "";

      bv =
        b.result.assessment
        ??
        b.result.value
        ??
        "";

      break;


    case "coach":

      av =
        a.result.enteredByEmail
        ?? "";

      bv =
        b.result.enteredByEmail
        ?? "";

      break;


    case "date":

      av =
        getTimestampValue(
          a.result.createdAt
        );

      bv =
        getTimestampValue(
          b.result.createdAt
        );

      break;


    default:

      av = "";

      bv = "";

  }


  let comparison;


  if (
    typeof av === "number"
    &&
    typeof bv === "number"
  ) {

    comparison =
      av - bv;

  }

  else {

    comparison =
      String(av)
        .localeCompare(
          String(bv),
          undefined,
          {
            numeric: true
          }
        );

  }


  return resultSort.ascending
    ?
    comparison
    :
    -comparison;

}



/* ============================================================
   AGE FILTERS
============================================================ */

function updateAgeFilters() {

  const ages =
    [
      ...new Set(
        athletes
          .map(
            athlete =>
              normalizeAgeGroup(
                athlete.ageGroup
              )
          )
          .filter(Boolean)
      )
    ];


  ages.sort(
    (a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          numeric: true
        }
      )
  );


  [
    "testingAgeFilter",
    "athleteAgeFilter",
    "resultsAgeFilter"
  ].forEach(
    id => {

      const select =
        document
          .getElementById(id);


      const oldValue =
        select.value;


      select.innerHTML =
        `
          <option value="">
            All Age Groups
          </option>
        `;


      ages.forEach(
        age => {

          const option =
            document.createElement("option");


          option.value =
            age;


          option.textContent =
            age;


          select.appendChild(
            option
          );

        }
      );


      if (
        ages.includes(
          oldValue
        )
      ) {

        select.value =
          oldValue;

      }

    }
  );

}



/* ============================================================
   EVENT FILTER
============================================================ */

function renderEventFilter() {

  const select =
    document
      .getElementById("resultsEventFilter");


  EVENTS.forEach(
    event => {

      const option =
        document.createElement("option");


      option.value =
        event.key;


      option.textContent =
        event.label;


      select.appendChild(
        option
      );

    }
  );

}



/* ============================================================
   IMPORT SETUP
============================================================ */

function setupUploader() {

  const uploadButton =
    document
      .getElementById("uploadPlayersButton");


  uploadButton.addEventListener(
    "click",
    () => {

      if (!isAdmin()) {

        showToast(
          "Only Wes can import players.",
          true
        );

        return;

      }


      resetImporter();


      document
        .getElementById("uploadModal")
        .classList
        .remove("hidden");

    }
  );


  document
    .getElementById("closeUploadButton")
    .addEventListener(
      "click",
      closeUploadModal
    );


  document
    .getElementById("cancelImportButton")
    .addEventListener(
      "click",
      closeUploadModal
    );


  document
    .getElementById("playerFileInput")
    .addEventListener(
      "change",
      handleFileUpload
    );


  document
    .getElementById("importPlayersConfirmButton")
    .addEventListener(
      "click",
      importPlayers
    );


  document
    .getElementById("downloadTemplateButton")
    .addEventListener(
      "click",
      downloadTemplate
    );

}



/* ============================================================
   CLOSE IMPORT
============================================================ */

function closeUploadModal() {

  document
    .getElementById("uploadModal")
    .classList
    .add("hidden");

}



/* ============================================================
   RESET IMPORTER
============================================================ */

function resetImporter() {

  importRows = [];


  document
    .getElementById("playerFileInput")
    .value = "";


  document
    .getElementById("selectedFileName")
    .textContent =
    "No file selected.";


  document
    .getElementById("previewBody")
    .innerHTML = "";


  document
    .getElementById("previewSection")
    .classList
    .add("hidden");


  document
    .getElementById("importSummary")
    .classList
    .add("hidden");


  document
    .getElementById("importPlayersConfirmButton")
    .disabled = true;


  hideMessage(
    document
      .getElementById("importMessage")
  );

}



/* ============================================================
   READ CSV / EXCEL FILE
============================================================ */

async function handleFileUpload(
  event
) {

  if (!isAdmin()) {

    return;

  }


  const file =
    event.target.files?.[0];


  if (!file) {

    return;

  }


  document
    .getElementById("selectedFileName")
    .textContent =
    file.name;


  try {

    const buffer =
      await file.arrayBuffer();


    const workbook =
      XLSX.read(
        buffer,
        {
          type: "array"
        }
      );


    const sheetName =
      workbook.SheetNames[0];


    if (!sheetName) {

      throw new Error(
        "No worksheet found."
      );

    }


    const worksheet =
      workbook.Sheets[
        sheetName
      ];


    const rawRows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: "",
          raw: false
        }
      );


    if (!rawRows.length) {

      throw new Error(
        "The spreadsheet contains no players."
      );

    }


    importRows =
      buildImportRows(
        rawRows
      );


    renderImportPreview();

  }

  catch (error) {

    console.error(error);


    showMessage(
      document
        .getElementById("importMessage"),
      error.message
      ||
      "Could not read file.",
      "error"
    );

  }

}



/* ============================================================
   BUILD IMPORT PREVIEW
============================================================ */

function buildImportRows(
  rawRows
) {

  const seenUploadKeys =
    new Set();


  return rawRows.map(
    (rawRow, index) => {

      const row =
        normalizeSpreadsheetRow(
          rawRow
        );


      const firstName =
        cleanText(
          row["first name"]
          ??
          row["firstname"]
          ??
          row["first"]
          ??
          ""
        );


      const lastName =
        cleanText(
          row["last name"]
          ??
          row["lastname"]
          ??
          row["last"]
          ??
          ""
        );


      const ageGroup =
        normalizeAgeGroup(
          row["age group"]
          ??
          row["agegroup"]
          ??
          row["age"]
          ??
          ""
        );


      const importRow = {

        rowNumber:
          index + 2,

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

        importRow.status =
          "invalid";


        importRow.reason =
          "Missing required information";


        return importRow;

      }


      const key =
        playerMatchKey(
          firstName,
          lastName,
          ageGroup
        );


      if (
        seenUploadKeys.has(key)
      ) {

        importRow.status =
          "duplicate";


        importRow.reason =
          "Duplicate row in file";


        return importRow;

      }


      seenUploadKeys.add(
        key
      );


      if (
        existingAthleteMatch(
          firstName,
          lastName,
          ageGroup
        )
      ) {

        importRow.status =
          "duplicate";


        importRow.reason =
          "Already exists — skipped";


        return importRow;

      }


      return importRow;

    }
  );

}



/* ============================================================
   NORMALIZE SPREADSHEET HEADERS
============================================================ */

function normalizeSpreadsheetRow(
  raw
) {

  const normalized = {};


  Object.entries(
    raw
  ).forEach(
    ([key, value]) => {

      const normalizedKey =
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
          );


      normalized[
        normalizedKey
      ] = value;

    }
  );


  return normalized;

}



/* ============================================================
   IMPORT PREVIEW
============================================================ */

function renderImportPreview() {

  const body =
    document
      .getElementById("previewBody");


  const newRows =
    importRows.filter(
      row =>
        row.status === "new"
    );


  const duplicates =
    importRows.filter(
      row =>
        row.status === "duplicate"
    );


  const invalid =
    importRows.filter(
      row =>
        row.status === "invalid"
    );


  document
    .getElementById("summaryTotal")
    .textContent =
    importRows.length;


  document
    .getElementById("summaryNew")
    .textContent =
    newRows.length;


  document
    .getElementById("summaryDuplicate")
    .textContent =
    duplicates.length;


  document
    .getElementById("summaryInvalid")
    .textContent =
    invalid.length;


  document
    .getElementById("importSummary")
    .classList
    .remove("hidden");


  document
    .getElementById("previewSection")
    .classList
    .remove("hidden");


  body.innerHTML = "";


  importRows.forEach(
    row => {

      const tr =
        document.createElement("tr");


      let className =
        "status-new";


      if (
        row.status === "duplicate"
      ) {

        className =
          "status-duplicate";

      }


      if (
        row.status === "invalid"
      ) {

        className =
          "status-invalid";

      }


      tr.innerHTML =
        `

          <td>
            ${escapeHtml(
              row.firstName || "—"
            )}
          </td>

          <td>
            ${escapeHtml(
              row.lastName || "—"
            )}
          </td>

          <td>
            ${escapeHtml(
              row.ageGroup || "—"
            )}
          </td>

          <td>

            <span
              class="status-pill ${className}"
            >
              ${escapeHtml(
                row.reason
              )}
            </span>

          </td>

        `;


      body.appendChild(
        tr
      );

    }
  );


  document
    .getElementById("importPlayersConfirmButton")
    .disabled =
    newRows.length === 0;


  showMessage(
    document
      .getElementById("importMessage"),
    `${newRows.length} new player${newRows.length === 1 ? "" : "s"} ready. Existing players will not be changed.`,
    newRows.length
    ?
    "success"
    :
    "warning"
  );

}



/* ============================================================
   IMPORT PLAYERS

   EXISTING PLAYER IS NEVER UPDATED.

   MATCH:
   FIRST NAME + LAST NAME + AGE GROUP
============================================================ */

async function importPlayers() {

  if (!isAdmin()) {

    showToast(
      "Only Wes can import players.",
      true
    );

    return;

  }


  const button =
    document
      .getElementById("importPlayersConfirmButton");


  button.disabled = true;

  button.textContent =
    "Importing...";


  await loadAthletes();


  const newPlayers =
    importRows.filter(
      row =>
        row.status === "new"
    );


  let imported = 0;

  let skipped = 0;

  let failed = 0;



  for (
    const player of newPlayers
  ) {

    if (
      existingAthleteMatch(
        player.firstName,
        player.lastName,
        player.ageGroup
      )
    ) {

      skipped++;

      continue;

    }


    const documentId =
      athleteDocumentId(
        player.firstName,
        player.lastName,
        player.ageGroup
      );


    const athleteRef =
      doc(
        db,
        PLAYERS_COLLECTION,
        documentId
      );


    try {

      const existing =
        await getDoc(
          athleteRef
        );


      if (
        existing.exists()
      ) {

        skipped++;

        continue;

      }


      await setDoc(
        athleteRef,
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
            currentUser.email,

          createdAt:
            serverTimestamp()

        }
      );


      imported++;

    }

    catch (error) {

      console.error(
        "Import error:",
        player,
        error
      );


      failed++;

    }

  }



  await loadAthletes();


  updateAgeFilters();

  renderAthleteTable();

  renderTestingAthletes();



  button.textContent =
    "Import Players";


  showMessage(
    document
      .getElementById("importMessage"),
    `${imported} imported. ${skipped} duplicates skipped. ${failed} failed. Existing player data was not changed.`,
    failed
    ?
    "warning"
    :
    "success"
  );


  button.disabled = true;


  importRows =
    importRows.map(
      row => {

        if (
          row.status === "invalid"
        ) {

          return row;

        }


        if (
          existingAthleteMatch(
            row.firstName,
            row.lastName,
            row.ageGroup
          )
        ) {

          return {
            ...row,
            status: "duplicate",
            reason: "Already exists — skipped"
          };

        }


        return row;

      }
    );


  renderImportPreview();

}



/* ============================================================
   EXISTING PLAYER MATCH
============================================================ */

function existingAthleteMatch(
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


  return athletes.some(
    athlete => {

      const existing =
        playerMatchKey(
          athlete.firstName,
          athlete.lastName,
          athlete.ageGroup
        );


      return (
        existing === target
      );

    }
  );

}



/* ============================================================
   MATCH KEY
============================================================ */

function playerMatchKey(
  firstName,
  lastName,
  ageGroup
) {

  return [
    normalizeText(firstName),
    normalizeText(lastName),
    normalizeText(
      normalizeAgeGroup(ageGroup)
    )
  ].join("|");

}



/* ============================================================
   PLAYER DOCUMENT ID
============================================================ */

function athleteDocumentId(
  firstName,
  lastName,
  ageGroup
) {

  const value =
    `${normalizeText(firstName)}-${normalizeText(lastName)}-${normalizeText(ageGroup)}`;


  return value
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}



/* ============================================================
   DOWNLOAD TEMPLATE
============================================================ */

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
      ],
      [
        "Mason",
        "Jones",
        "13U"
      ]
    ]
      .map(
        row =>
          row.map(
            csvEscape
          ).join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csv],
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
    document.createElement("a");


  link.href =
    url;


  link.download =
    "combine-player-template.csv";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}



/* ============================================================
   HELPERS
============================================================ */

function getEvent(
  eventKey
) {

  return EVENTS.find(
    event =>
      event.key === eventKey
  );

}



function formatResult(
  result,
  event
) {

  if (
    event.direction === "passfail"
  ) {

    return (
      result.assessment || "—"
    );

  }


  const value =
    Number(
      result.value
    );


  if (
    !Number.isFinite(value)
  ) {

    return "—";

  }


  return (
    `${trimNumber(value)}`
    +
    (
      event.unit
      ?
      ` ${event.unit}`
      :
      ""
    )
  );

}



function trimNumber(
  value
) {

  return Number(value)
    .toLocaleString(
      undefined,
      {
        maximumFractionDigits:
          3
      }
    );

}



function cleanText(
  value
) {

  return String(
    value ?? ""
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

  let age =
    cleanText(
      value
    )
    .toUpperCase();


  age =
    age.replace(
      /^(\d{1,2})\s*[- ]?\s*U$/i,
      "$1U"
    );


  return age;

}



function shortCoachName(
  email
) {

  if (!email) {

    return "—";

  }


  return String(email)
    .split("@")[0];

}



function getTimestampValue(
  timestamp
) {

  if (!timestamp) {

    return 0;

  }


  if (
    typeof timestamp.toMillis === "function"
  ) {

    return timestamp.toMillis();

  }


  if (
    timestamp.seconds
  ) {

    return (
      timestamp.seconds * 1000
    );

  }


  const value =
    new Date(timestamp).getTime();


  return Number.isFinite(value)
    ?
    value
    :
    0;

}



function shortDate(
  timestamp
) {

  const millis =
    getTimestampValue(
      timestamp
    );


  if (!millis) {

    return "Just now";

  }


  const date =
    new Date(millis);


  return date.toLocaleString(
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



function csvEscape(
  value
) {

  return (
    `"${String(value).replace(
      /"/g,
      '""'
    )}"`
  );

}



function escapeHtml(
  value
) {

  return String(
    value ?? ""
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



/* ============================================================
   MESSAGES
============================================================ */

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



/* ============================================================
   TOAST
============================================================ */

let toastTimer;


function showToast(
  message,
  error = false
) {

  const toast =
    document
      .getElementById("toast");


  toast.textContent =
    message;


  toast.className =
    error
    ?
    "toast toast-error"
    :
    "toast";


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}
