import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

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
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


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
  initializeApp(
    firebaseConfig
  );


const auth =
  getAuth(
    app
  );


const db =
  getFirestore(
    app
  );


/* =========================================================
   SETTINGS
========================================================= */

const ADMIN_EMAIL =
  "wes@ninthinningbaseball.com";


const PLAYERS_COLLECTION =
  "players";


const RESULTS_COLLECTION =
  "results";


/* =========================================================
   EVENTS
========================================================= */

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

    shortLabel:
      "Exit Velo",

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
      "high",

    feetInches:
      true
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
      "high",

    feetInches:
      true
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

    feetInches:
      true
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
  }

];


/* =========================================================
   STATE
========================================================= */

let currentUser =
  null;


let athletes =
  [];


let results =
  [];


let selectedAthlete =
  null;


const selectedAthleteIds =
  new Set();


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


let numberPadStage =
  "number";


let numberPadFeet =
  null;


const timerStates =
  {};


for (
  const event
  of
  EVENTS.filter(
    event =>
      event.type ===
      "timer"
  )
) {

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


/* =========================================================
   STARTUP
========================================================= */

window.addEventListener(
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


/* =========================================================
   LOGIN
========================================================= */

function bindLogin() {

  const form =
    document.getElementById(
      "loginForm"
    );


  form.addEventListener(
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
        document.getElementById(
          "loginMessage"
        );


      const button =
        document.getElementById(
          "loginButton"
        );


      hideMessage(
        message
      );


      button.disabled =
        true;


      button.textContent =
        "Signing In…";


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      }

      catch (
        error
      ) {

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
          ].includes(
            error.code
          )
        ) {

          text =
            "Invalid email or password.";

        }


        if (
          error.code ===
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

      finally {

        button.disabled =
          false;


        button.textContent =
          "Sign In";

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
        signOut(
          auth
        )
    );

}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (
      !user
    ) {

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


      selectedAthleteIds.clear();


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


    document
      .getElementById(
        "deletePlayerButton"
      )
      .classList
      .toggle(
        "hidden",
        !isAdmin()
      );


    [
      "selectVisiblePlayersButton",
      "clearPlayerSelectionButton",
      "deleteSelectedPlayersButton",
      "athleteSelectHeader"
    ]
      .forEach(
        id => {

          document
            .getElementById(
              id
            )
            ?.classList
            .toggle(
              "hidden",
              !isAdmin()
            );

        }
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


/* =========================================================
   DATA
========================================================= */

async function refreshData() {

  await Promise.all(
    [
      loadAthletes(),
      loadResults()
    ]
  );


  updateTeamFilters();

  renderAthleteTable();

  renderResultsMatrix();

  renderIndexDrawer();


  if (
    selectedAthlete
  ) {

    selectedAthlete =
      athletes.find(
        athlete =>
          athlete.id ===
          selectedAthlete.id
      )
      ||
      null;


    if (
      selectedAthlete
    ) {

      renderTestingPage();

    }

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

  catch (
    error
  ) {

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

  catch (
    error
  ) {

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
        data.firstName ??
        data.first_name ??
        data.firstname ??
        data.first ??
        ""
      ),


    lastName:
      cleanText(
        data.lastName ??
        data.last_name ??
        data.lastname ??
        data.last ??
        ""
      ),


    teamName:
      normalizeTeamName(
        data.teamName ??
        data.team_name ??
        data.team ??
        data.ageGroup ??
        data.age_group ??
        data.age ??
        ""
      )

  };

}


function normalizeResult(
  id,
  data
) {

  return {

    id,

    ...data,


    athleteId:
      data.athleteId ??
      data.playerId ??
      data.athlete_id ??
      data.player_id ??
      "",


    event:
      normalizeEventKey(
        data.event ??
        data.eventKey ??
        data.test ??
        data.metric ??
        ""
      ),


    value:
      data.value ??
      data.score ??
      data.result ??
      null,


    assessment:
      data.assessment ??
      data.status ??
      null,


    notes:
      data.notes ??
      "",


    teamName:
      normalizeTeamName(
        data.teamName ??
        data.team_name ??
        data.ageGroup ??
        data.age_group ??
        ""
      ),


    enteredByUid:
      data.enteredByUid ??
      data.entered_by_uid ??
      "",


    enteredByEmail:
      data.enteredByEmail ??
      data.entered_by_email ??
      "",


    createdAt:
      data.createdAt ??
      data.created_at ??
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

    squatAssessment:
      "squatAssessment",

    squat_assessment:
      "squatAssessment",

    fiveTenFive:
      "fiveTenFive",

    five_ten_five:
      "fiveTenFive",

    tenYardShuttle:
      "tenYardShuttle",

    ten_yard_shuttle:
      "tenYardShuttle"

  };


  return (
    aliases[
      key
    ]
    ||
    key
  );

}


/* =========================================================
   NAVIGATION
========================================================= */

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
    viewId !==
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
        view.classList.remove(
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
        button.classList.toggle(
          "active",
          button.dataset.view ===
          viewId
        )
    );


  if (
    viewId ===
    "athletesView"
  ) {

    renderAthleteTable();

  }


  if (
    viewId ===
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


/* =========================================================
   ATHLETES
========================================================= */

function bindAthletePage() {

  document
    .getElementById(
      "athleteSearch"
    )
    .addEventListener(
      "input",
      renderAthleteTable
    );


  const filter =
    document.getElementById(
      "athleteAgeFilter"
    );


  const filterButton =
    document.getElementById(
      "athleteAgeFilterButton"
    );


  const filterMenu =
    document.getElementById(
      "athleteAgeFilterMenu"
    );


  filterButton
    .addEventListener(
      "click",
      event => {

        event.stopPropagation();


        const isOpen =
          !filterMenu
            .classList
            .contains(
              "hidden"
            );


        filterMenu
          .classList
          .toggle(
            "hidden",
            isOpen
          );


        filterButton
          .setAttribute(
            "aria-expanded",
            String(
              !isOpen
            )
          );

      }
    );


  filterMenu
    .addEventListener(
      "click",
      event =>
        event.stopPropagation()
    );


  document
    .getElementById(
      "clearAthleteAgeFilters"
    )
    .addEventListener(
      "click",
      () => {

        filter
          .querySelectorAll(
            'input[type="checkbox"]'
          )
          .forEach(
            checkbox => {

              checkbox.checked =
                false;

            }
          );


        updateTeamFilterLabel();

        renderAthleteTable();

      }
    );


  document.addEventListener(
    "click",
    event => {

      if (
        !filter.contains(
          event.target
        )
      ) {

        filterMenu
          .classList
          .add(
            "hidden"
          );


        filterButton
          .setAttribute(
            "aria-expanded",
            "false"
          );

      }

    }
  );


  document
    .getElementById(
      "selectVisiblePlayersButton"
    )
    .addEventListener(
      "click",
      selectAllVisiblePlayers
    );


  document
    .getElementById(
      "clearPlayerSelectionButton"
    )
    .addEventListener(
      "click",
      clearPlayerSelection
    );


  document
    .getElementById(
      "deleteSelectedPlayersButton"
    )
    .addEventListener(
      "click",
      deleteSelectedPlayers
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
              header.dataset.athleteSort;


            if (
              athleteSort.key ===
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


function getVisibleAthletes() {

  const search =
    normalizeText(
      document
        .getElementById(
          "athleteSearch"
        )
        .value
    );


  const selectedTeams =
    getSelectedTeams();


  const filtered =
    athletes.filter(
      athlete => {

        const text =
          normalizeText(
            `${athlete.firstName} ${athlete.lastName} ${athlete.teamName}`
          );


        return (

          (
            !search
            ||
            text.includes(
              search
            )
          )

          &&

          (
            selectedTeams.length ===
            0
            ||
            selectedTeams.includes(
              athlete.teamName
            )
          )

        );

      }
    );


  filtered.sort(
    (
      a,
      b
    ) => {

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


  return filtered;

}


function renderAthleteTable() {

  const body =
    document.getElementById(
      "athleteTableBody"
    );


  const filtered =
    getVisibleAthletes();


  const validIds =
    new Set(
      athletes.map(
        athlete =>
          athlete.id
      )
    );


  for (
    const id
    of
    Array.from(
      selectedAthleteIds
    )
  ) {

    if (
      !validIds.has(
        id
      )
    ) {

      selectedAthleteIds.delete(
        id
      );

    }

  }


  body.innerHTML =
    "";


  for (
    const athlete
    of
    filtered
  ) {

    const row =
      document.createElement(
        "tr"
      );


    row.className =
      `athlete-row${
        selectedAthleteIds.has(
          athlete.id
        )
        ?
        " athlete-row-selected"
        :
        ""
      }`;


    row.tabIndex =
      0;


    row.innerHTML =
      `

        ${
          isAdmin()
          ?
          `

            <td class="athlete-select-cell">

              <label class="athlete-select-label">

                <input
                  class="athlete-select-checkbox"
                  type="checkbox"
                  data-player-id="${escapeHtml(
                    athlete.id
                  )}"
                  ${
                    selectedAthleteIds.has(
                      athlete.id
                    )
                    ?
                    "checked"
                    :
                    ""
                  }
                />

              </label>

            </td>

          `
          :
          ""
        }


        <td>

          <strong>
            ${escapeHtml(
              athlete.firstName
            )}
          </strong>

        </td>


        <td>

          <strong>
            ${escapeHtml(
              athlete.lastName
            )}
          </strong>

        </td>


        <td>

          <span class="age-pill team-pill">
            ${escapeHtml(
              athlete.teamName
            )}
          </span>

        </td>

      `;


    row.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            ".athlete-select-cell"
          )
        ) {

          return;

        }


        startTesting(
          athlete.id
        );

      }
    );


    const checkbox =
      row.querySelector(
        ".athlete-select-checkbox"
      );


    checkbox
      ?.addEventListener(
        "click",
        event =>
          event.stopPropagation()
      );


    checkbox
      ?.addEventListener(
        "change",
        () => {

          if (
            checkbox.checked
          ) {

            selectedAthleteIds.add(
              athlete.id
            );

          }

          else {

            selectedAthleteIds.delete(
              athlete.id
            );

          }


          row.classList.toggle(
            "athlete-row-selected",
            checkbox.checked
          );


          updateBulkSelectionControls();

        }
      );


    body.appendChild(
      row
    );

  }


  document
    .getElementById(
      "athleteEmpty"
    )
    .classList
    .toggle(
      "hidden",
      filtered.length >
      0
    );


  updateBulkSelectionControls();

}


function selectAllVisiblePlayers() {

  if (
    !isAdmin()
  ) {

    return;

  }


  for (
    const athlete
    of
    getVisibleAthletes()
  ) {

    selectedAthleteIds.add(
      athlete.id
    );

  }


  renderAthleteTable();

}


function clearPlayerSelection() {

  selectedAthleteIds.clear();


  renderAthleteTable();

}


function updateBulkSelectionControls() {

  const count =
    selectedAthleteIds.size;


  const visibleCount =
    getVisibleAthletes().length;


  const deleteButton =
    document.getElementById(
      "deleteSelectedPlayersButton"
    );


  const clearButton =
    document.getElementById(
      "clearPlayerSelectionButton"
    );


  const selectButton =
    document.getElementById(
      "selectVisiblePlayersButton"
    );


  deleteButton.textContent =
    `Delete Selected (${count})`;


  deleteButton.disabled =
    count ===
    0;


  clearButton.disabled =
    count ===
    0;


  selectButton.textContent =
    visibleCount
    ?
    `Select All Visible (${visibleCount})`
    :
    "Select All Visible";


  selectButton.disabled =
    visibleCount ===
    0;

}


async function deleteSelectedPlayers() {

  if (
    !isAdmin()
  ) {

    return;

  }


  const selectedPlayers =
    athletes.filter(
      athlete =>
        selectedAthleteIds.has(
          athlete.id
        )
    );


  if (
    !selectedPlayers.length
  ) {

    return;

  }


  const selectedResults =
    results.filter(
      result =>
        selectedAthleteIds.has(
          result.athleteId
        )
    );


  const confirmed =
    window.confirm(
      `WARNING\n\nDelete ${selectedPlayers.length} players and ${selectedResults.length} saved results?\n\nThis cannot be undone.`
    );


  if (
    !confirmed
  ) {

    return;

  }


  const typed =
    window.prompt(
      `Type DELETE ${selectedPlayers.length} to confirm.`
    );


  if (
    typed?.trim() !==
    `DELETE ${selectedPlayers.length}`
  ) {

    showToast(
      "Bulk delete cancelled.",
      true
    );


    return;

  }


  try {

    const refs =
      [

        ...selectedResults.map(
          result =>
            doc(
              db,
              RESULTS_COLLECTION,
              result.id
            )
        ),


        ...selectedPlayers.map(
          player =>
            doc(
              db,
              PLAYERS_COLLECTION,
              player.id
            )
        )

      ];


    for (
      let i =
        0;

      i <
      refs.length;

      i +=
        450
    ) {

      const batch =
        writeBatch(
          db
        );


      for (
        const ref
        of
        refs.slice(
          i,
          i +
          450
        )
      ) {

        batch.delete(
          ref
        );

      }


      await batch.commit();

    }


    selectedAthleteIds.clear();


    await refreshData();


    showToast(
      `${selectedPlayers.length} players deleted.`
    );

  }

  catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      `Could not delete players: ${error.message}`,
      true
    );

  }

}


/* =========================================================
   ADD PLAYER
========================================================= */

async function addPlayer(
  event
) {

  event.preventDefault();


  const message =
    document.getElementById(
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


  const teamName =
    normalizeTeamName(
      document
        .getElementById(
          "newTeamName"
        )
        .value
    );


  if (
    !firstName
    ||
    !lastName
    ||
    !teamName
  ) {

    showMessage(
      message,
      "First name, last name and team name are required.",
      "error"
    );


    return;

  }


  if (
    findExistingPlayer(
      firstName,
      lastName,
      teamName
    )
  ) {

    showMessage(
      message,
      "That player already exists.",
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
        teamName
      )
    );


  try {

    await setDoc(
      ref,
      {

        firstName,

        lastName,

        teamName,


        normalizedFirstName:
          normalizeText(
            firstName
          ),


        normalizedLastName:
          normalizeText(
            lastName
          ),


        normalizedTeamName:
          normalizeText(
            teamName
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

  catch (
    error
  ) {

    showMessage(
      message,
      error.message,
      "error"
    );

  }

}


/* =========================================================
   TESTING
========================================================= */

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


  document
    .getElementById(
      "deletePlayerButton"
    )
    .addEventListener(
      "click",
      deleteSelectedPlayer
    );

}


function startTesting(
  playerId
) {

  selectedAthlete =
    athletes.find(
      athlete =>
        athlete.id ===
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
    selectedAthlete.teamName;


  renderTestCards();

}


async function deleteSelectedPlayer() {

  if (
    !isAdmin()
    ||
    !selectedAthlete
  ) {

    return;

  }


  const player =
    selectedAthlete;


  if (
    !window.confirm(
      `Delete ${player.firstName} ${player.lastName} and all saved results?`
    )
  ) {

    return;

  }


  const playerResults =
    results.filter(
      result =>
        result.athleteId ===
        player.id
    );


  const refs =
    [

      ...playerResults.map(
        result =>
          doc(
            db,
            RESULTS_COLLECTION,
            result.id
          )
      ),


      doc(
        db,
        PLAYERS_COLLECTION,
        player.id
      )

    ];


  try {

    for (
      let i =
        0;

      i <
      refs.length;

      i +=
        450
    ) {

      const batch =
        writeBatch(
          db
        );


      for (
        const ref
        of
        refs.slice(
          i,
          i +
          450
        )
      ) {

        batch.delete(
          ref
        );

      }


      await batch.commit();

    }


    selectedAthlete =
      null;


    await refreshData();


    showView(
      "athletesView"
    );

  }

  catch (
    error
  ) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   TEST CARDS
========================================================= */

function renderTestCards() {

  const grid =
    document.getElementById(
      "testGrid"
    );


  grid.innerHTML =
    "";


  if (
    !selectedAthlete
  ) {

    return;

  }


  for (
    const event
    of
    EVENTS
  ) {

    const stats =
      getEventStats(
        selectedAthlete.id,
        event
      );


    const card =
      document.createElement(
        "article"
      );


    card.className =
      "test-card";


    if (
      event.type ===
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
                  BEST ${formatEventValue(
                    stats.best.value,
                    event
                  )}
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
            class="timer-toggle-button${
              state.running
              ?
              " running"
              :
              ""
            }"
            data-event="${event.key}"
            type="button"
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
            type="button"
          >
            RESET
          </button>


          ${renderAttempts(
            stats.attempts,
            event,
            5
          )}

        `;

    }


    else if (
      event.type ===
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
                <span class="best-chip">
                  ${escapeHtml(
                    stats.latest.assessment
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
          ></textarea>


          <div class="pass-fail-grid">

            <button
              class="assessment-button pass"
              data-assessment="Pass"
              type="button"
            >
              PASS
            </button>


            <button
              class="assessment-button fail"
              data-assessment="Fail"
              type="button"
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


    else {

      card.innerHTML =
        `

          <div class="test-card-header">

            <div>

              <p class="kicker">
                HIGHEST IS BEST
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
                  BEST ${formatEventValue(
                    stats.best.value,
                    event
                  )}
                </span>
              `
              :
              ""
            }

          </div>


          ${
            event.maxAvg
            ?
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
                      formatEventValue(
                        stats.best.value,
                        event
                      )
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
                      stats.avgLast3 == null
                      ?
                      "—"
                      :
                      formatEventValue(
                        stats.avgLast3,
                        event
                      )
                    }
                  </strong>

                </div>

              </div>

            `
            :
            ""
          }


          <button
            class="number-entry-button"
            data-event="${event.key}"
            type="button"
          >
            ${
              event.feetInches
              ?
              "ENTER DISTANCE"
              :
              `ENTER ${escapeHtml(
                event.unit.toUpperCase()
              )}`
            }
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


  grid
    .querySelectorAll(
      ".number-entry-button"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            openNumberPad(
              button.dataset.event
            )
        )
    );


  grid
    .querySelectorAll(
      ".timer-toggle-button"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            toggleTimer(
              button.dataset.event
            )
        )
    );


  grid
    .querySelectorAll(
      ".timer-reset-button"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            resetTimer(
              button.dataset.event
            )
        )
    );


  grid
    .querySelectorAll(
      ".assessment-button"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            saveAssessment(
              button.dataset.assessment
            )
        )
    );


  grid
    .querySelectorAll(
      ".delete-attempt"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            deleteAttempt(
              button.dataset.resultId
            )
        )
    );

}


/* =========================================================
   ATTEMPTS
========================================================= */

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
    event.type ===
    "passfail"

    ?

    attempts[
      0
    ]

    :

    getBestAttempt(
      attempts,
      event.direction
    );


  return `

    <div class="attempts">

      <div class="attempts-title">
        RECORDED ENTRIES
      </div>


      ${
        attempts
          .slice(
            0,
            limit
          )
          .map(
            attempt => {

              const display =
                event.type ===
                "passfail"

                ?

                `${attempt.assessment || "—"}${
                  attempt.notes
                  ?
                  ` — ${attempt.notes}`
                  :
                  ""
                }`

                :

                formatEventValue(
                  attempt.value,
                  event
                );


              return `

                <div
                  class="attempt-row${
                    best?.id ===
                    attempt.id
                    &&
                    event.type !==
                    "passfail"
                    ?
                    " best-attempt"
                    :
                    ""
                  }"
                >

                  <div>

                    <strong>
                      ${escapeHtml(
                        display
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        shortDate(
                          attempt.createdAt
                        )
                      )}
                    </small>

                  </div>


                  <button
                    class="delete-attempt"
                    data-result-id="${escapeHtml(
                      attempt.id
                    )}"
                    type="button"
                  >
                    ×
                  </button>

                </div>

              `;

            }
          )
          .join("")
      }

    </div>

  `;

}


/* =========================================================
   NUMBER PAD
========================================================= */

function bindNumberPad() {

  document
    .getElementById(
      "numberPadKeys"
    )
    .addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
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
          key ===
          "back"
        ) {

          numberPadBuffer =
            numberPadBuffer.slice(
              0,
              -1
            );

        }


        else if (
          key ===
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
          numberPadBuffer.length <
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
      saveNumberPadValue
    );

}


async function saveNumberPadValue() {

  const event =
    getEvent(
      numberPadEventKey
    );


  if (
    !event
  ) {

    return;

  }


  if (
    event.feetInches
  ) {

    if (
      numberPadStage ===
      "feet"
    ) {

      const feet =
        Number(
          numberPadBuffer
        );


      if (
        !Number.isFinite(
          feet
        )
        ||
        feet <
        0
        ||
        numberPadBuffer ===
        ""
      ) {

        showToast(
          "Enter the feet measurement.",
          true
        );


        return;

      }


      numberPadFeet =
        feet;


      numberPadStage =
        "inches";


      numberPadBuffer =
        "";


      document
        .getElementById(
          "numberPadStageLabel"
        )
        .textContent =
        "Now enter inches";


      document
        .getElementById(
          "numberPadUnit"
        )
        .textContent =
        "in";


      document
        .getElementById(
          "distanceFeetPreview"
        )
        .textContent =
        formatNumber(
          feet
        );


      document
        .getElementById(
          "saveNumberPadButton"
        )
        .textContent =
        "Save Distance";


      updateNumberPadDisplay();


      return;

    }


    const inches =
      Number(
        numberPadBuffer
      );


    if (
      !Number.isFinite(
        inches
      )
      ||
      inches <
      0
      ||
      inches >=
      12
      ||
      numberPadBuffer ===
      ""
    ) {

      showToast(
        "Inches must be between 0 and 11.99.",
        true
      );


      return;

    }


    const totalInches =
      (
        Number(
          numberPadFeet
        )
        *
        12
      )
      +
      inches;


    const eventKey =
      numberPadEventKey;


    closeModal(
      "numberPadModal"
    );


    resetNumberPadState();


    await saveNumericResult(
      eventKey,
      totalInches
    );


    return;

  }


  const value =
    Number(
      numberPadBuffer
    );


  if (
    !Number.isFinite(
      value
    )
    ||
    numberPadBuffer ===
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


  resetNumberPadState();


  await saveNumericResult(
    eventKey,
    value
  );

}


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


  numberPadFeet =
    null;


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


  if (
    event.feetInches
  ) {

    numberPadStage =
      "feet";


    document
      .getElementById(
        "numberPadStageLabel"
      )
      .textContent =
      "Enter feet first";


    document
      .getElementById(
        "numberPadUnit"
      )
      .textContent =
      "ft";


    document
      .getElementById(
        "distanceProgress"
      )
      .classList
      .remove(
        "hidden"
      );


    document
      .getElementById(
        "distanceFeetPreview"
      )
      .textContent =
      "—";


    document
      .getElementById(
        "distanceInchesPreview"
      )
      .textContent =
      "—";


    document
      .getElementById(
        "saveNumberPadButton"
      )
      .textContent =
      "Next: Inches";

  }

  else {

    numberPadStage =
      "number";


    document
      .getElementById(
        "numberPadStageLabel"
      )
      .textContent =
      "";


    document
      .getElementById(
        "numberPadUnit"
      )
      .textContent =
      event.unit;


    document
      .getElementById(
        "distanceProgress"
      )
      .classList
      .add(
        "hidden"
      );


    document
      .getElementById(
        "saveNumberPadButton"
      )
      .textContent =
      "Save Entry";

  }


  updateNumberPadDisplay();


  openModal(
    "numberPadModal"
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


  const event =
    getEvent(
      numberPadEventKey
    );


  if (
    event?.feetInches
    &&
    numberPadStage ===
    "inches"
  ) {

    document
      .getElementById(
        "distanceInchesPreview"
      )
      .textContent =
      numberPadBuffer
      ||
      "—";

  }

}


function resetNumberPadState() {

  numberPadEventKey =
    null;


  numberPadBuffer =
    "";


  numberPadStage =
    "number";


  numberPadFeet =
    null;


  document
    .getElementById(
      "numberPadStageLabel"
    )
    .textContent =
    "";


  document
    .getElementById(
      "distanceProgress"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "saveNumberPadButton"
    )
    .textContent =
    "Save Entry";

}


/* =========================================================
   SAVE RESULTS
========================================================= */

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


        teamName:
          selectedAthlete.teamName,


        event:
          eventKey,


        value,


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
      `${event.label}: ${formatEventValue(
        value,
        event
      )} saved.`
    );

  }

  catch (
    error
  ) {

    showToast(
      error.message,
      true
    );

  }

}


async function saveAssessment(
  assessment
) {

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


      teamName:
        selectedAthlete.teamName,


      event:
        "squatAssessment",


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

}


async function deleteAttempt(
  resultId
) {

  if (
    !window.confirm(
      "Delete this recorded attempt?"
    )
  ) {

    return;

  }


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

}


/* =========================================================
   TIMERS
========================================================= */

function toggleTimer(
  eventKey
) {

  const state =
    timerStates[
      eventKey
    ];


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


  state.elapsedMs =
    0;


  state.startedAt =
    performance.now();


  state.running =
    true;


  renderTestCards();


  state.intervalId =
    setInterval(
      () => {

        state.elapsedMs =
          performance.now()
          -
          state.startedAt;


        const display =
          document.getElementById(
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


  clearInterval(
    state.intervalId
  );


  state.running =
    false;


  state.elapsedMs =
    0;


  renderTestCards();

}


function resetAllTimers() {

  Object
    .values(
      timerStates
    )
    .forEach(
      state => {

        clearInterval(
          state.intervalId
        );


        state.running =
          false;


        state.elapsedMs =
          0;


        state.intervalId =
          null;

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
    .toFixed(
      2
    );

}


/* =========================================================
   RESULTS
========================================================= */

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


  document
    .getElementById(
      "exportResultsButton"
    )
    .addEventListener(
      "click",
      exportResultsToExcel
    );

}


function renderResultsMatrix() {

  const head =
    document.getElementById(
      "resultsMatrixHead"
    );


  const body =
    document.getElementById(
      "resultsMatrixBody"
    );


  head.innerHTML =
    `

      <tr>

        <th
          class="sticky-athlete sortable"
          data-sort-key="athlete"
        >
          Athlete
        </th>

        <th
          class="sortable"
          data-sort-key="teamName"
        >
          Team
        </th>

        ${
          EVENTS
            .map(
              event =>
                `

                  <th
                    class="sortable"
                    data-sort-key="${event.key}"
                  >
                    ${escapeHtml(
                      event.shortLabel
                      ||
                      event.label
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
      th =>
        th.addEventListener(
          "click",
          () =>
            setMatrixSort(
              th.dataset.sortKey
            )
        )
    );


  const search =
    normalizeText(
      document
        .getElementById(
          "resultsSearch"
        )
        .value
    );


  const team =
    document
      .getElementById(
        "resultsAgeFilter"
      )
      .value;


  let rows =
    athletes.filter(
      athlete =>

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
          !team
          ||
          athlete.teamName ===
          team
        )

    );


  rows.sort(
    compareMatrixPlayers
  );


  body.innerHTML =
    rows
      .map(
        athlete => {

          return `

            <tr>

              <td class="sticky-athlete">

                <button
                  class="matrix-player-link"
                  data-player-id="${athlete.id}"
                  type="button"
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
                ${escapeHtml(
                  athlete.teamName
                )}
              </td>


              ${
                EVENTS
                  .map(
                    event => {

                      const stats =
                        getEventStats(
                          athlete.id,
                          event
                        );


                      if (
                        event.type ===
                        "passfail"
                      ) {

                        return `
                          <td>
                            ${
                              stats.latest?.assessment
                              ||
                              "—"
                            }
                          </td>
                        `;

                      }


                      return `
                        <td>
                          ${
                            stats.best
                            ?
                            formatEventValue(
                              stats.best.value,
                              event
                            )
                            :
                            "—"
                          }
                        </td>
                      `;

                    }
                  )
                  .join("")
              }

            </tr>

          `;

        }
      )
      .join("");


  body
    .querySelectorAll(
      ".matrix-player-link"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            startTesting(
              button.dataset.playerId
            )
        )
    );

}


function setMatrixSort(
  key
) {

  if (
    matrixSort.key ===
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


    matrixSort = {

      key,

      asc:
        event?.direction ===
        "high"
        ?
        false
        :
        true

    };

  }


  renderResultsMatrix();

}


function compareMatrixPlayers(
  a,
  b
) {

  if (
    matrixSort.key ===
    "athlete"
  ) {

    const av =
      `${a.lastName}, ${a.firstName}`;


    const bv =
      `${b.lastName}, ${b.firstName}`;


    return matrixSort.asc
      ?
      av.localeCompare(
        bv
      )
      :
      bv.localeCompare(
        av
      );

  }


  if (
    matrixSort.key ===
    "teamName"
  ) {

    return matrixSort.asc
      ?
      a.teamName.localeCompare(
        b.teamName
      )
      :
      b.teamName.localeCompare(
        a.teamName
      );

  }


  const event =
    getEvent(
      matrixSort.key
    );


  const av =
    getSortValue(
      a.id,
      event
    );


  const bv =
    getSortValue(
      b.id,
      event
    );


  if (
    av == null
  ) {

    return 1;

  }


  if (
    bv == null
  ) {

    return -1;

  }


  return matrixSort.asc
    ?
    av -
    bv
    :
    bv -
    av;

}


function getSortValue(
  playerId,
  event
) {

  const stats =
    getEventStats(
      playerId,
      event
    );


  if (
    event.type ===
    "passfail"
  ) {

    return stats.latest?.assessment ===
      "Pass"
      ?
      1
      :
      2;

  }


  return stats.best
    ?
    Number(
      stats.best.value
    )
    :
    null;

}


/* =========================================================
   STATS
========================================================= */

function getEventStats(
  playerId,
  event
) {

  const attempts =
    results
      .filter(
        result =>
          result.athleteId ===
          playerId
          &&
          result.event ===
          event.key
      )
      .sort(
        (
          a,
          b
        ) =>
          getTimestampValue(
            b.createdAt
          )
          -
          getTimestampValue(
            a.createdAt
          )
      );


  if (
    event.type ===
    "passfail"
  ) {

    return {

      attempts,

      latest:
        attempts[
          0
        ]
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


  const values =
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


  return {

    attempts:
      numeric,


    latest:
      numeric[
        0
      ]
      ||
      null,


    best,


    avgLast3:
      values.length
      ?
      values.reduce(
        (
          total,
          value
        ) =>
          total +
          value,
        0
      )
      /
      values.length
      :
      null

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

      return direction ===
        "low"

        ?

        (
          Number(
            current.value
          )
          <
          Number(
            best.value
          )
          ?
          current
          :
          best
        )

        :

        (
          Number(
            current.value
          )
          >
          Number(
            best.value
          )
          ?
          current
          :
          best
        );

    }
  );

}


/* =========================================================
   FORMAT EVENT VALUES
========================================================= */

function formatEventValue(
  value,
  event
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


  if (
    event?.feetInches
  ) {

    let feet =
      Math.floor(
        number /
        12
      );


    let inches =
      Math.round(
        (
          number
          -
          feet *
          12
        )
        *
        100
      )
      /
      100;


    if (
      inches >=
      12
    ) {

      feet +=
        1;


      inches =
        0;

    }


    return `${feet}' ${formatNumber(
      inches
    )}"`;

  }


  return `${formatNumber(
    number
  )}${event?.unit ? ` ${event.unit}` : ""}`;

}


/* =========================================================
   TEAM FILTER
========================================================= */

function updateTeamFilters() {

  const teams =
    [
      ...new Set(
        athletes
          .map(
            athlete =>
              athlete.teamName
          )
          .filter(
            Boolean
          )
      )
    ]
      .sort(
        naturalSort
      );


  const options =
    document.getElementById(
      "athleteAgeFilterOptions"
    );


  const selected =
    new Set(
      getSelectedTeams()
    );


  options.innerHTML =
    teams
      .map(
        team =>
          `

            <label class="age-filter-option">

              <input
                type="checkbox"
                value="${escapeHtml(
                  team
                )}"
                ${
                  selected.has(
                    team
                  )
                  ?
                  "checked"
                  :
                  ""
                }
              />

              <span>
                ${escapeHtml(
                  team
                )}
              </span>

            </label>

          `
      )
      .join("");


  options
    .querySelectorAll(
      "input"
    )
    .forEach(
      checkbox =>
        checkbox.addEventListener(
          "change",
          () => {

            updateTeamFilterLabel();

            renderAthleteTable();

          }
        )
    );


  const resultsFilter =
    document.getElementById(
      "resultsAgeFilter"
    );


  const previous =
    resultsFilter.value;


  resultsFilter.innerHTML =
    `<option value="">All Teams</option>`
    +
    teams
      .map(
        team =>
          `<option value="${escapeHtml(
            team
          )}">${escapeHtml(
            team
          )}</option>`
      )
      .join("");


  if (
    teams.includes(
      previous
    )
  ) {

    resultsFilter.value =
      previous;

  }


  updateTeamFilterLabel();

}


function getSelectedTeams() {

  return [
    ...document
      .querySelectorAll(
        '#athleteAgeFilterOptions input[type="checkbox"]:checked'
      )
  ]
    .map(
      checkbox =>
        checkbox.value
    );

}


function updateTeamFilterLabel() {

  const selected =
    getSelectedTeams();


  const label =
    document.getElementById(
      "athleteAgeFilterLabel"
    );


  if (
    !selected.length
  ) {

    label.textContent =
      "All Teams";

  }

  else if (
    selected.length <=
    2
  ) {

    label.textContent =
      selected.join(
        ", "
      );

  }

  else {

    label.textContent =
      `${selected.length} Teams`;

  }

}


/* =========================================================
   PLAYER INDEX
========================================================= */

function openIndexDrawer() {

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
    document.getElementById(
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
          `${athlete.firstName} ${athlete.lastName} ${athlete.teamName}`
        )
          .includes(
            search
          )
    );


  container.innerHTML =
    filtered
      .map(
        athlete =>
          `

            <button
              class="index-player"
              data-player-id="${athlete.id}"
              type="button"
            >

              <span>
                ${escapeHtml(
                  athlete.lastName
                )},
                ${escapeHtml(
                  athlete.firstName
                )}
              </span>

              <span>
                ${escapeHtml(
                  athlete.teamName
                )}
              </span>

            </button>

          `
      )
      .join("");


  container
    .querySelectorAll(
      ".index-player"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () => {

            startTesting(
              button.dataset.playerId
            );


            closeIndexDrawer();

          }
        )
    );

}


/* =========================================================
   IMPORT
========================================================= */

function bindUploader() {

  document
    .getElementById(
      "uploadPlayersButton"
    )
    .addEventListener(
      "click",
      () => {

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

  const file =
    event.target.files?.[
      0
    ];


  if (
    !file
  ) {

    return;

  }


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


  const sheet =
    workbook.Sheets[
      workbook.SheetNames[
        0
      ]
    ];


  const rows =
    window.XLSX.utils
      .sheet_to_json(
        sheet,
        {
          defval:
            ""
        }
      );


  importRows =
    buildImportRows(
      rows
    );


  renderImportPreview();

}


function buildImportRows(
  rows
) {

  return rows.map(
    raw => {

      const row =
        normalizeSpreadsheetRow(
          raw
        );


      return {

        firstName:
          cleanText(
            row[
              "first name"
            ]
            ??
            row.firstname
            ??
            ""
          ),


        lastName:
          cleanText(
            row[
              "last name"
            ]
            ??
            row.lastname
            ??
            ""
          ),


        teamName:
          cleanText(
            row[
              "team name"
            ]
            ??
            row.teamname
            ??
            row.team
            ??
            row[
              "age group"
            ]
            ??
            ""
          )

      };

    }
  );

}


function renderImportPreview() {

  const body =
    document.getElementById(
      "previewBody"
    );


  body.innerHTML =
    importRows
      .map(
        row =>
          `

            <tr>

              <td>
                ${escapeHtml(
                  row.firstName
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.lastName
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.teamName
                )}
              </td>

              <td>
                Ready
              </td>

            </tr>

          `
      )
      .join("");


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
      "importPlayersConfirmButton"
    )
    .disabled =
    false;

}


async function importPlayers() {

  let imported =
    0;


  for (
    const player
    of
    importRows
  ) {

    if (
      !player.firstName
      ||
      !player.lastName
      ||
      !player.teamName
    ) {

      continue;

    }


    if (
      findExistingPlayer(
        player.firstName,
        player.lastName,
        player.teamName
      )
    ) {

      continue;

    }


    const ref =
      doc(
        db,
        PLAYERS_COLLECTION,
        playerDocumentId(
          player.firstName,
          player.lastName,
          player.teamName
        )
      );


    await setDoc(
      ref,
      {

        firstName:
          player.firstName,


        lastName:
          player.lastName,


        teamName:
          player.teamName,


        createdAt:
          serverTimestamp()

      }
    );


    imported++;

  }


  await refreshData();


  closeModal(
    "uploadModal"
  );


  showToast(
    `${imported} players imported.`
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
      "importPlayersConfirmButton"
    )
    .disabled =
    true;

}


function downloadTemplate() {

  const csv =
    `First Name,Last Name,Team Name\nJohn,Smith,15U Borden`;


  const blob =
    new Blob(
      [
        csv
      ],
      {
        type:
          "text/csv"
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


  link.click();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   EXPORT
========================================================= */

function exportResultsToExcel() {

  const rows =
    athletes.map(
      athlete => {

        const row = {

          "First Name":
            athlete.firstName,


          "Last Name":
            athlete.lastName,


          "Team Name":
            athlete.teamName

        };


        for (
          const event
          of
          EVENTS
        ) {

          const stats =
            getEventStats(
              athlete.id,
              event
            );


          if (
            event.type ===
            "passfail"
          ) {

            row[
              event.label
            ] =
              stats.latest?.assessment
              ||
              "";

          }

          else {

            row[
              event.label
            ] =
              stats.best
              ?
              formatEventValue(
                stats.best.value,
                event
              )
              :
              "";

          }

        }


        return row;

      }
    );


  const sheet =
    window.XLSX.utils
      .json_to_sheet(
        rows
      );


  const workbook =
    window.XLSX.utils
      .book_new();


  window.XLSX.utils
    .book_append_sheet(
      workbook,
      sheet,
      "Results"
    );


  window.XLSX.writeFile(
    workbook,
    "Ninth-Inning-Combine.xlsx"
  );

}


/* =========================================================
   MODALS
========================================================= */

function bindModals() {

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(
      button =>
        button.addEventListener(
          "click",
          () =>
            closeModal(
              button.dataset.close
            )
        )
    );


  document
    .querySelectorAll(
      ".modal-backdrop"
    )
    .forEach(
      backdrop =>
        backdrop.addEventListener(
          "click",
          event => {

            if (
              event.target ===
              backdrop
            ) {

              closeModal(
                backdrop.id
              );

            }

          }
        )
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

}


/* =========================================================
   HELPERS
========================================================= */

function getEvent(
  key
) {

  return EVENTS.find(
    event =>
      event.key ===
      key
  );

}


function formatNumber(
  value
) {

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ?
    number.toLocaleString(
      undefined,
      {
        maximumFractionDigits:
          2
      }
    )
    :
    "—";

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
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  return timestamp.seconds
    ?
    timestamp.seconds *
    1000
    :
    0;

}


function shortDate(
  timestamp
) {

  const value =
    getTimestampValue(
      timestamp
    );


  if (
    !value
  ) {

    return "Just now";

  }


  return new Date(
    value
  )
    .toLocaleString();

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


function normalizeTeamName(
  value
) {

  return cleanText(
    value
  );

}


function comparePlayers(
  a,
  b
) {

  return (
    a.lastName.localeCompare(
      b.lastName
    )
    ||
    a.firstName.localeCompare(
      b.firstName
    )
  );

}


function naturalSort(
  a,
  b
) {

  return String(
    a
  )
    .localeCompare(
      String(
        b
      ),
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
  teamName
) {

  const key =
    playerMatchKey(
      firstName,
      lastName,
      teamName
    );


  return athletes.find(
    athlete =>
      playerMatchKey(
        athlete.firstName,
        athlete.lastName,
        athlete.teamName
      )
      ===
      key
  );

}


function playerMatchKey(
  firstName,
  lastName,
  teamName
) {

  return `${normalizeText(
    firstName
  )}|${normalizeText(
    lastName
  )}|${normalizeText(
    teamName
  )}`;

}


function playerDocumentId(
  firstName,
  lastName,
  teamName
) {

  const base =
    `${firstName}-${lastName}-${teamName}`
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      );


  return `${base}-${Date.now()}`;

}


function normalizeSpreadsheetRow(
  raw
) {

  const output =
    {};


  for (
    const [
      key,
      value
    ]
    of
    Object.entries(
      raw
    )
  ) {

    output[
      String(
        key
      )
        .trim()
        .toLowerCase()
    ] =
      value;

  }


  return output;

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
    document.getElementById(
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
        toast.classList.add(
          "hidden"
        ),
      3500
    );

}
