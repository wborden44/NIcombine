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
   PERMISSIONS
========================================================= */

const ADMIN_EMAIL =
  "wes@ninthinningbaseball.com";


const VIEW_ONLY_EMAILS = [

  "kennesaw@ninthinningbaseball.com"

];


const PLAYERS_COLLECTION =
  "players";


const RESULTS_COLLECTION =
  "results";


const MED_BALL_NOTE =
  "16U and 17U threw the 15 lb med ball. Everyone else threw the 8 lb med ball.";


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
      true,

    info:
      MED_BALL_NOTE
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
      true,

    info:
      MED_BALL_NOTE
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


let importRows =
  [];


const selectedAthleteIds =
  new Set();


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


EVENTS
  .filter(
    event =>
      event.type ===
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

    bindIndexTeamFilter();

  }
);


/* =========================================================
   ACCESS
========================================================= */

function isAdmin() {

  return (

    normalizeText(
      currentUser?.email
    )

    ===

    normalizeText(
      ADMIN_EMAIL
    )

  );

}


function isViewOnly() {

  return VIEW_ONLY_EMAILS
    .map(
      normalizeText
    )
    .includes(
      normalizeText(
        currentUser?.email
      )
    );

}


function canEdit() {

  return (

    !!currentUser

    &&

    !isViewOnly()

  );

}


function applyPermissionUI() {

  const badge =
    document.getElementById(
      "userRoleBadge"
    );


  if (
    isAdmin()
  ) {

    badge.textContent =
      "ADMIN";


    badge.className =
      "role-badge admin-role";

  }

  else if (
    isViewOnly()
  ) {

    badge.textContent =
      "VIEW ONLY";


    badge.className =
      "role-badge view-role";

  }

  else {

    badge.className =
      "role-badge hidden";

  }


  document
    .getElementById(
      "openAddPlayerButton"
    )
    ?.classList
    .toggle(
      "hidden",
      !canEdit()
    );


  document
    .getElementById(
      "uploadPlayersButton"
    )
    ?.classList
    .toggle(
      "hidden",
      !isAdmin()
    );


  document
    .getElementById(
      "deletePlayerButton"
    )
    ?.classList
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

}


/* =========================================================
   LOGIN
========================================================= */

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
            error
          );


          const invalid =
            [

              "auth/invalid-credential",

              "auth/wrong-password",

              "auth/user-not-found"

            ]
              .includes(
                error.code
              );


          showMessage(

            message,

            invalid
            ?
            "Invalid email or password."
            :
            `${error.code}: ${error.message}`,

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


      resetAllTimers();


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


    applyPermissionUI();


    await refreshData();

  }
);


/* =========================================================
   LOAD DATA
========================================================= */

async function refreshData() {

  await Promise.all(
    [

      loadAthletes(),

      loadResults()

    ]
  );


  updateTeamFilters();

  updateIndexTeamFilters();

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


/* =========================================================
   NORMALIZATION
========================================================= */

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
      button => {

        button.classList.toggle(
          "active",
          button.dataset.view ===
          viewId
        );

      }
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
   ATHLETE PAGE
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


  bindMultiFilter({

    containerId:
      "athleteTeamFilter",

    buttonId:
      "athleteTeamFilterButton",

    menuId:
      "athleteTeamFilterMenu",

    clearId:
      "clearAthleteTeamFilters",

    optionsId:
      "athleteTeamFilterOptions",

    onChange:
      () => {

        updateFilterLabel(
          "athlete"
        );

        renderAthleteTable();

      }

  });


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

        if (
          !canEdit()
        ) {

          showToast(
            "This account is view only.",
            true
          );


          return;

        }


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


/* =========================================================
   MULTI TEAM FILTER
========================================================= */

function bindMultiFilter({
  containerId,
  buttonId,
  menuId,
  clearId,
  optionsId,
  onChange
}) {

  const container =
    document.getElementById(
      containerId
    );


  const button =
    document.getElementById(
      buttonId
    );


  const menu =
    document.getElementById(
      menuId
    );


  button.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      const open =
        !menu.classList.contains(
          "hidden"
        );


      menu.classList.toggle(
        "hidden",
        open
      );


      button.setAttribute(
        "aria-expanded",
        String(
          !open
        )
      );

    }
  );


  menu.addEventListener(
    "click",
    event =>
      event.stopPropagation()
  );


  document
    .getElementById(
      clearId
    )
    .addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            `#${optionsId} input[type="checkbox"]`
          )
          .forEach(
            checkbox => {

              checkbox.checked =
                false;

            }
          );


        onChange();

      }
    );


  document.addEventListener(
    "click",
    event => {

      if (
        !container.contains(
          event.target
        )
      ) {

        menu.classList.add(
          "hidden"
        );


        button.setAttribute(
          "aria-expanded",
          "false"
        );

      }

    }
  );

}


function getSelectedTeams(
  optionsId
) {

  return [

    ...document.querySelectorAll(
      `#${optionsId} input[type="checkbox"]:checked`
    )

  ]
    .map(
      checkbox =>
        checkbox.value
    );

}


/* =========================================================
   ATHLETE TABLE
========================================================= */

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
    getSelectedTeams(
      "athleteTeamFilterOptions"
    );


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
            !selectedTeams.length

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


  [
    ...selectedAthleteIds
  ]
    .forEach(
      id => {

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
    );


  body.innerHTML =
    "";


  filtered.forEach(
    athlete => {

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
                  >

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
  );


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


/* =========================================================
   BULK PLAYER CONTROLS
========================================================= */

function selectAllVisiblePlayers() {

  if (
    !isAdmin()
  ) {

    return;

  }


  getVisibleAthletes()
    .forEach(
      athlete => {

        selectedAthleteIds.add(
          athlete.id
        );

      }
    );


  renderAthleteTable();

}


function clearPlayerSelection() {

  selectedAthleteIds.clear();


  renderAthleteTable();

}


function updateBulkSelectionControls() {

  if (
    !isAdmin()
  ) {

    return;

  }


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


      refs
        .slice(
          i,
          i +
          450
        )
        .forEach(
          ref =>
            batch.delete(
              ref
            )
        );


      await batch.commit();

    }


    if (
      selectedAthlete

      &&

      selectedAthleteIds.has(
        selectedAthlete.id
      )
    ) {

      selectedAthlete =
        null;

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
      "BULK DELETE",
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


  if (
    !canEdit()
  ) {

    showToast(
      "This account is view only.",
      true
    );


    return;

  }


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

    const existing =
      await getDoc(
        ref
      );


    if (
      existing.exists()
    ) {

      showMessage(

        message,

        "That player already exists.",

        "warning"

      );


      return;

    }


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
    )
    ||
    null;


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
      "testingPlayerTeam"
    )
    .textContent =

    selectedAthlete.teamName;


  document
    .getElementById(
      "deletePlayerButton"
    )
    .classList
    .toggle(
      "hidden",
      !isAdmin()
    );


  renderTestCards();

}


/* =========================================================
   DELETE PLAYER
========================================================= */

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


  const confirmed =
    window.confirm(

      `Delete ${player.firstName} ${player.lastName} and all saved results?\n\nThis cannot be undone.`

    );


  if (
    !confirmed
  ) {

    return;

  }


  try {

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


      refs
        .slice(
          i,
          i +
          450
        )
        .forEach(
          ref =>
            batch.delete(
              ref
            )
        );


      await batch.commit();

    }


    selectedAthlete =
      null;


    await refreshData();


    showView(
      "athletesView"
    );


    showToast(

      `${player.firstName} ${player.lastName} deleted.`

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


  EVENTS.forEach(
    event => {

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


      const infoButton =
        event.info
        ?
        `

          <button
            class="inline-info-button test-info-button"
            data-info-title="Med Ball Throw Note"
            data-info-body="${escapeHtml(
              event.info
            )}"
            type="button"
            aria-label="Med ball note"
          >
            ?
          </button>

        `
        :
        "";


      /* TIMER */

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

                    BEST
                    ${formatEventValue(
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


            ${
              canEdit()
              ?
              `

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
                  class="timer-manual-button"
                  data-event="${event.key}"
                  type="button"
                  ${
                    state.running
                    ?
                    "disabled"
                    :
                    ""
                  }
                >
                  ENTER TIME
                </button>

              `
              :
              `

                <div class="view-only-note">
                  View only — scoring controls are disabled.
                </div>

              `
            }


            ${renderAttempts(
              stats.attempts,
              event,
              5
            )}

          `;

      }


      /* SQUAT */

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
                      ||
                      "—"
                    )}

                  </span>

                `
                :
                ""
              }

            </div>


            ${
              canEdit()
              ?
              `

                <label for="squatNotes">
                  Notes
                </label>


                <textarea
                  id="squatNotes"
                  class="notes-input"
                  rows="3"
                  placeholder="Optional notes..."
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

              `
              :
              `

                <div class="view-only-note">
                  View only — scoring controls are disabled.
                </div>

              `
            }


            ${renderAttempts(
              stats.attempts,
              event,
              3
            )}

          `;

      }


      /* NORMAL EVENTS */

      else {

        card.innerHTML =
          `

            <div class="test-card-header">

              <div>

                <p class="kicker">
                  HIGHEST IS BEST
                </p>


                <div class="test-title-inline">

                  <h3>
                    ${escapeHtml(
                      event.label
                    )}
                  </h3>

                  ${infoButton}

                </div>

              </div>


              ${
                stats.best
                ?
                `

                  <span class="best-chip">

                    BEST
                    ${formatEventValue(
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


            ${
              canEdit()
              ?
              `

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

              `
              :
              `

                <div class="view-only-note">
                  View only — scoring controls are disabled.
                </div>

              `
            }


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
      ".timer-manual-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            openManualTimePad(
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


  grid
    .querySelectorAll(
      ".test-info-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            openInfoModal(
              button.dataset.infoTitle,
              button.dataset.infoBody
            )
        );

      }
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

              const display =
                event.type ===
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

                formatEventValue(
                  attempt.value,
                  event
                );


              const mayDelete =

                canEdit()

                &&

                (
                  isAdmin()

                  ||

                  attempt.enteredByUid ===
                  currentUser?.uid
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
                    mayDelete
                    ?
                    `

                      <button
                        class="delete-attempt"
                        data-result-id="${escapeHtml(
                          attempt.id
                        )}"
                        type="button"
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

  if (
    !canEdit()
  ) {

    showToast(
      "This account is view only.",
      true
    );


    return;

  }


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

      Number(
        numberPadFeet
      )

      *

      12

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


  if (
    event.type ===
    "timer"

    &&

    value <=
    0
  ) {

    showToast(
      "Enter a time greater than 0 seconds.",
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

  if (
    !canEdit()
  ) {

    showToast(
      "This account is view only.",
      true
    );


    return;

  }


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


function openManualTimePad(
  eventKey
) {

  if (
    !canEdit()
  ) {

    showToast(
      "This account is view only.",
      true
    );


    return;

  }


  const event =
    getEvent(
      eventKey
    );


  if (
    !event

    ||

    event.type !==
    "timer"

    ||

    !selectedAthlete
  ) {

    return;

  }


  if (
    timerStates[
      eventKey
    ]?.running
  ) {

    showToast(
      "Stop the timer before entering a manual time.",
      true
    );


    return;

  }


  openNumberPad(
    eventKey
  );


  document
    .getElementById(
      "numberPadStageLabel"
    )
    .textContent =
    "Enter time in seconds";


  document
    .getElementById(
      "numberPadUnit"
    )
    .textContent =
    "sec";


  document
    .getElementById(
      "saveNumberPadButton"
    )
    .textContent =
    "Save Time";

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

    ||

    !canEdit()
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

  if (
    !selectedAthlete

    ||

    !currentUser

    ||

    !canEdit()
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


        teamName:
          selectedAthlete.teamName,


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

  catch (
    error
  ) {

    showToast(
      error.message,
      true
    );

  }

}


async function deleteAttempt(
  resultId
) {

  if (
    !canEdit()
  ) {

    showToast(
      "This account is view only.",
      true
    );


    return;

  }


  const attempt =
    results.find(
      result =>
        result.id ===
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

    attempt.enteredByUid !==
    currentUser?.uid
  ) {

    showToast(
      "You can only delete an entry you recorded.",
      true
    );


    return;

  }


  if (
    !window.confirm(
      "Delete this recorded attempt?"
    )
  ) {

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
   TIMERS
========================================================= */

function toggleTimer(
  eventKey
) {

  if (
    !canEdit()
  ) {

    return;

  }


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

  if (
    !canEdit()
  ) {

    return;

  }


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

  if (
    !canEdit()
  ) {

    return;

  }


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


        state.startedAt =
          0;


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
   PLAYER INDEX FILTER
========================================================= */

function bindIndexTeamFilter() {

  bindMultiFilter({

    containerId:
      "indexTeamFilter",

    buttonId:
      "indexTeamFilterButton",

    menuId:
      "indexTeamFilterMenu",

    clearId:
      "clearIndexTeamFilters",

    optionsId:
      "indexTeamFilterOptions",

    onChange:
      () => {

        updateFilterLabel(
          "index"
        );

        renderIndexDrawer();

      }

  });

}


function updateIndexTeamFilters() {

  buildTeamCheckboxes(

    "indexTeamFilterOptions",

    getSelectedTeams(
      "indexTeamFilterOptions"
    ),

    () => {

      updateFilterLabel(
        "index"
      );

      renderIndexDrawer();

    }

  );


  updateFilterLabel(
    "index"
  );

}


function openIndexDrawer() {

  document
    .getElementById(
      "indexSearch"
    )
    .value =
    "";


  updateIndexTeamFilters();


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


  document
    .getElementById(
      "indexTeamFilterMenu"
    )
    .classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "indexTeamFilterButton"
    )
    .setAttribute(
      "aria-expanded",
      "false"
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


  const selectedTeams =
    getSelectedTeams(
      "indexTeamFilterOptions"
    );


  const filtered =
    athletes
      .filter(
        athlete => {

          const matchesSearch =

            !search

            ||

            normalizeText(

              `${athlete.firstName} ${athlete.lastName} ${athlete.teamName}`

            )
              .includes(
                search
              );


          const matchesTeam =

            !selectedTeams.length

            ||

            selectedTeams.includes(
              athlete.teamName
            );


          return (

            matchesSearch

            &&

            matchesTeam

          );

        }
      )
      .sort(
        comparePlayers
      );


  document
    .getElementById(
      "indexPlayerCount"
    )
    .textContent =

    `${filtered.length} player${
      filtered.length ===
      1
      ?
      ""
      :
      "s"
    }`;


  document
    .getElementById(
      "indexPlayerEmpty"
    )
    .classList
    .toggle(
      "hidden",
      filtered.length >
      0
    );


  const groups =
    {};


  filtered.forEach(
    athlete => {

      const team =
        athlete.teamName

        ||

        "Other";


      groups[
        team
      ] ||= [];


      groups[
        team
      ].push(
        athlete
      );

    }
  );


  container.innerHTML =

    Object
      .keys(
        groups
      )
      .sort(
        naturalSort
      )
      .map(
        team =>
          `

            <div class="index-team-group">

              <div class="index-team-heading">

                <span>
                  ${escapeHtml(
                    team
                  )}
                </span>

                <span>
                  ${groups[team].length}
                </span>

              </div>


              ${
                groups[
                  team
                ]
                  .sort(
                    comparePlayers
                  )
                  .map(
                    athlete =>
                      `

                        <button
                          class="index-player${
                            selectedAthlete?.id ===
                            athlete.id
                            ?
                            " active"
                            :
                            ""
                          }"
                          data-player-id="${escapeHtml(
                            athlete.id
                          )}"
                          type="button"
                        >

                          <span class="index-player-name">

                            ${escapeHtml(
                              athlete.lastName
                            )},
                            ${escapeHtml(
                              athlete.firstName
                            )}

                          </span>


                          <span class="index-player-team">

                            ${escapeHtml(
                              athlete.teamName
                            )}

                          </span>

                        </button>

                      `
                  )
                  .join("")
              }

            </div>

          `
      )
      .join("");


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
                  athlete.id ===
                  button.dataset.playerId
              )
              ||
              null;


            if (
              !selectedAthlete
            ) {

              return;

            }


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
      "resultsTeamFilter"
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

          ${sortArrow(
            "athlete"
          )}

        </th>


        <th
          class="sortable"
          data-sort-key="teamName"
        >

          Team

          ${sortArrow(
            "teamName"
          )}

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

                    <span class="results-heading-inline">

                      <span>

                        ${escapeHtml(
                          event.shortLabel
                          ||
                          event.label
                        )}

                        ${sortArrow(
                          event.key
                        )}

                      </span>


                      ${
                        event.info
                        ?
                        `

                          <button
                            class="inline-info-button results-header-info"
                            data-info-title="Med Ball Throw Note"
                            data-info-body="${escapeHtml(
                              event.info
                            )}"
                            type="button"
                            aria-label="Med ball note"
                          >
                            ?
                          </button>

                        `
                        :
                        ""
                      }

                    </span>

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


  const team =
    document
      .getElementById(
        "resultsTeamFilter"
      )
      .value;


  const rows =
    athletes.filter(
      athlete =>

        (
          !search

          ||

          normalizeText(

            `${athlete.firstName} ${athlete.lastName} ${athlete.teamName}`

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
        athlete =>
          `

            <tr>

              <td class="sticky-athlete">

                <button
                  class="matrix-player-link"
                  data-player-id="${escapeHtml(
                    athlete.id
                  )}"
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

                <span class="age-pill">

                  ${escapeHtml(
                    athlete.teamName
                  )}

                </span>

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


                      /* SQUAT RESULT */

                      if (
                        event.type ===
                        "passfail"
                      ) {

                        if (
                          !stats.latest
                        ) {

                          return `

                            <td>
                              —
                            </td>

                          `;

                        }


                        const notes =
                          cleanText(

                            stats.latest.notes

                            ||

                            ""

                          );


                        return `

                          <td>

                            <div class="matrix-cell-inline">

                              <span>

                                ${escapeHtml(
                                  stats.latest.assessment
                                  ||
                                  "—"
                                )}

                              </span>


                              <button
                                class="inline-info-button squat-note-info"
                                data-info-title="${escapeHtml(
                                  `${athlete.firstName} ${athlete.lastName} — Squat Notes`
                                )}"
                                data-info-body="${escapeHtml(
                                  notes
                                  ||
                                  "No coach notes were entered for this squat assessment."
                                )}"
                                type="button"
                                aria-label="View squat notes"
                              >
                                ?
                              </button>

                            </div>

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


                      return `

                        <td>

                          <strong>

                            ${formatEventValue(
                              stats.best.value,
                              event
                            )}

                          </strong>


                          ${
                            event.maxAvg
                            ?
                            `

                              <small class="matrix-sub">

                                avg
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

                              </small>

                            `
                            :
                            ""
                          }

                        </td>

                      `;

                    }
                  )
                  .join("")
              }

            </tr>

          `
      )
      .join("");


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


  [
    head,
    body
  ]
    .forEach(
      scope => {

        scope
          .querySelectorAll(
            ".results-header-info, .squat-note-info"
          )
          .forEach(
            button => {

              button.addEventListener(
                "click",
                event => {

                  event.stopPropagation();


                  openInfoModal(

                    button.dataset.infoTitle

                    ||

                    "Details",

                    button.dataset.infoBody

                    ||

                    "No notes available."

                  );

                }
              );

            }
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
      rows.length >
      0
    );

}


/* =========================================================
   RESULTS SORTING
========================================================= */

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

  const key =
    matrixSort.key;


  if (
    key ===
    "athlete"
  ) {

    const comparison =
      `${a.lastName}, ${a.firstName}`
        .localeCompare(

          `${b.lastName}, ${b.firstName}`,

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


  if (
    key ===
    "teamName"
  ) {

    const comparison =
      naturalSort(
        a.teamName,
        b.teamName
      );


    return (
      matrixSort.asc
      ?
      comparison
      :
      -comparison
    );

  }


  const event =
    getEvent(
      key
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

    &&

    bv == null
  ) {

    return comparePlayers(
      a,
      b
    );

  }


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


  return (
    matrixSort.asc
    ?
    av -
    bv
    :
    bv -
    av
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
    event.type ===
    "passfail"
  ) {

    return stats.latest
      ?
      (
        stats.latest.assessment ===
        "Pass"
        ?
        1
        :
        2
      )
      :
      null;

  }


  return stats.best
    ?
    Number(
      stats.best.value
    )
    :
    null;

}


function sortArrow(
  key
) {

  return matrixSort.key ===
    key
    ?
    (
      matrixSort.asc
      ?
      "▲"
      :
      "▼"
    )
    :
    "";

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
      last3.length
      ?
      last3.reduce(
        (
          sum,
          value
        ) =>
          sum +
          value,
        0
      )
      /
      last3.length
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

      if (
        direction ===
        "low"
      ) {

        return (

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

        );

      }


      return (

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
   FORMATTING
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
        number
        /
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


    return (

      `${feet}' ${formatNumber(
        inches
      )}"`

    );

  }


  return (

    `${formatNumber(
      number
    )}${
      event?.unit
      ?
      ` ${event.unit}`
      :
      ""
    }`

  );

}


/* =========================================================
   TEAM FILTERS
========================================================= */

function updateTeamFilters() {

  buildTeamCheckboxes(

    "athleteTeamFilterOptions",

    getSelectedTeams(
      "athleteTeamFilterOptions"
    ),

    () => {

      updateFilterLabel(
        "athlete"
      );

      renderAthleteTable();

    }

  );


  const teams =
    getTeams();


  const resultsFilter =
    document.getElementById(
      "resultsTeamFilter"
    );


  const previous =
    resultsFilter.value;


  resultsFilter.innerHTML =

    `<option value="">All Teams</option>`

    +

    teams
      .map(
        team =>
          `

            <option value="${escapeHtml(
              team
            )}">

              ${escapeHtml(
                team
              )}

            </option>

          `
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


  updateFilterLabel(
    "athlete"
  );

}


function getTeams() {

  return [

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

}


function buildTeamCheckboxes(
  optionsId,
  selectedTeams,
  onChange
) {

  const selected =
    new Set(
      selectedTeams
    );


  const options =
    document.getElementById(
      optionsId
    );


  if (
    !options
  ) {

    return;

  }


  options.innerHTML =
    getTeams()
      .map(
        team =>
          `

            <label class="filter-option">

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
              >


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
      'input[type="checkbox"]'
    )
    .forEach(
      checkbox => {

        checkbox.addEventListener(
          "change",
          onChange
        );

      }
    );

}


function updateFilterLabel(
  which
) {

  const optionsId =
    which ===
    "athlete"
    ?
    "athleteTeamFilterOptions"
    :
    "indexTeamFilterOptions";


  const labelId =
    which ===
    "athlete"
    ?
    "athleteTeamFilterLabel"
    :
    "indexTeamFilterLabel";


  const selected =
    getSelectedTeams(
      optionsId
    );


  const label =
    document.getElementById(
      labelId
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
   UPLOAD PLAYERS
========================================================= */

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
    event.target.files?.[
      0
    ];


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

    const workbook =
      window.XLSX.read(

        await file.arrayBuffer(),

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


    if (
      !sheet
    ) {

      throw new Error(
        "No worksheet found."
      );

    }


    importRows =
      buildImportRows(

        window.XLSX.utils.sheet_to_json(
          sheet,
          {

            defval:
              "",

            raw:
              false

          }
        )

      );


    renderImportPreview();

  }

  catch (
    error
  ) {

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


      const teamName =
        normalizeTeamName(

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

          row.agegroup

          ??

          row.age

          ??

          ""

        );


      const item = {

        firstName,

        lastName,

        teamName,

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

        !teamName
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
          teamName
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
          teamName
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
        row.status ===
        "new"
    );


  const duplicates =
    importRows.filter(
      row =>
        row.status ===
        "duplicate"
    );


  const invalid =
    importRows.filter(
      row =>
        row.status ===
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

    importRows
      .map(
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
                  row.teamName
                  ||
                  "—"
                )}
              </td>

              <td>

                <span class="status-pill status-${row.status}">

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

    `${newRows.length} new player${
      newRows.length ===
      1
      ?
      ""
      :
      "s"
    } ready. Existing players will not be changed.`,

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
    document.getElementById(
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
        row.status ===
        "new"
    )
  ) {

    if (
      findExistingPlayer(
        player.firstName,
        player.lastName,
        player.teamName
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
          player.teamName
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


          teamName:
            player.teamName,


          normalizedFirstName:
            normalizeText(
              player.firstName
            ),


          normalizedLastName:
            normalizeText(
              player.lastName
            ),


          normalizedTeamName:
            normalizeText(
              player.teamName
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

    catch {

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
    `First Name,Last Name,Team Name\nJohn,Smith,15U Borden`;


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


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   EXCEL EXPORT
========================================================= */

function exportResultsToExcel() {

  if (
    !window.XLSX
  ) {

    showToast(
      "Excel export library did not load.",
      true
    );


    return;

  }


  if (
    !athletes.length
  ) {

    showToast(
      "There are no athletes to export.",
      true
    );


    return;

  }


  const summaryRows =
    athletes
      .slice()
      .sort(
        comparePlayers
      )
      .map(
        athlete => {

          const row = {

            "First Name":
              athlete.firstName,

            "Last Name":
              athlete.lastName,

            "Team Name":
              athlete.teamName

          };


          EVENTS.forEach(
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

                row[
                  event.label
                ] =
                  stats.latest?.assessment
                  ||
                  "";


                row[
                  `${event.label} Notes`
                ] =
                  stats.latest?.notes
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


                if (
                  event.maxAvg
                ) {

                  row[
                    `${event.label} Avg Last 3`
                  ] =
                    stats.avgLast3 == null
                    ?
                    ""
                    :
                    formatEventValue(
                      stats.avgLast3,
                      event
                    );

                }

              }

            }
          );


          return row;

        }
      );


  const attemptRows =
    results
      .slice()
      .sort(
        (
          a,
          b
        ) =>
          getTimestampValue(
            a.createdAt
          )
          -
          getTimestampValue(
            b.createdAt
          )
      )
      .map(
        result => {

          const athlete =
            athletes.find(
              player =>
                player.id ===
                result.athleteId
            );


          const event =
            getEvent(
              result.event
            );


          return {

            "First Name":
              athlete?.firstName
              ||
              result.athleteFirstName
              ||
              "",


            "Last Name":
              athlete?.lastName
              ||
              result.athleteLastName
              ||
              "",


            "Team Name":
              athlete?.teamName
              ||
              result.teamName
              ||
              "",


            "Event":
              event?.label
              ||
              result.event
              ||
              "",


            "Value":
              event?.feetInches
              &&
              result.value != null
              ?
              formatEventValue(
                result.value,
                event
              )
              :
              (
                result.value
                ??
                ""
              ),


            "Unit":
              event?.feetInches
              ?
              "ft/in"
              :
              (
                event?.unit
                ||
                ""
              ),


            "Assessment":
              result.assessment
              ||
              "",


            "Notes":
              result.notes
              ||
              "",


            "Entered By":
              result.enteredByEmail
              ||
              "",


            "Date":
              exportDate(
                result.createdAt
              )

          };

        }
      );


  const workbook =
    window.XLSX.utils.book_new();


  window.XLSX.utils
    .book_append_sheet(

      workbook,

      window.XLSX.utils.json_to_sheet(
        summaryRows
      ),

      "Best Results"

    );


  window.XLSX.utils
    .book_append_sheet(

      workbook,

      window.XLSX.utils.json_to_sheet(
        attemptRows
      ),

      "All Attempts"

    );


  window.XLSX.writeFile(

    workbook,

    `Ninth-Inning-Combine-${new Date().toISOString().slice(0, 10)}.xlsx`

  );


  showToast(
    "Excel file exported."
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
              event.target ===
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
        event.key !==
        "Escape"
      ) {

        return;

      }


      document
        .querySelectorAll(
          ".modal-backdrop:not(.hidden)"
        )
        .forEach(
          modal => {

            closeModal(
              modal.id
            );

          }
        );


      closeIndexDrawer();

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


  document.body.classList.add(
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


  if (
    !document.querySelector(
      ".modal-backdrop:not(.hidden)"
    )
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}


function openInfoModal(
  title,
  body
) {

  document
    .getElementById(
      "infoModalTitle"
    )
    .textContent =

    title

    ||

    "Details";


  document
    .getElementById(
      "infoModalBody"
    )
    .textContent =

    body

    ||

    "No notes available.";


  openModal(
    "infoModal"
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


  if (
    timestamp.seconds
  ) {

    return timestamp.seconds *
    1000;

  }


  const value =
    new Date(
      timestamp
    )
      .getTime();


  return Number.isFinite(
    value
  )
    ?
    value
    :
    0;

}


function shortDate(
  timestamp
) {

  const milliseconds =
    getTimestampValue(
      timestamp
    );


  return milliseconds
    ?
    new Date(
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
      )
    :
    "Just now";

}


function exportDate(
  timestamp
) {

  const milliseconds =
    getTimestampValue(
      timestamp
    );


  return milliseconds
    ?
    new Date(
      milliseconds
    )
      .toLocaleString()
    :
    "";

}


function shortCoachName(
  email
) {

  return email
    ?
    String(
      email
    )
      .split(
        "@"
      )[
        0
      ]
    :
    "";

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

    a.lastName
      .localeCompare(
        b.lastName,
        undefined,
        {
          numeric:
            true
        }
      )

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

  const target =
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

      target

  );

}


function playerMatchKey(
  firstName,
  lastName,
  teamName
) {

  return [

    normalizeText(
      firstName
    ),

    normalizeText(
      lastName
    ),

    normalizeText(
      teamName
    )

  ]
    .join(
      "|"
    );

}


function playerDocumentId(
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


  const slug =

    `${normalizeText(
      firstName
    )}-${normalizeText(
      lastName
    )}-${normalizeText(
      teamName
    )}`

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

    `${slug}-${hashString(
      key
    )}`

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

    i <
    value.length;

    i++
  ) {

    hash ^=
      value.charCodeAt(
        i
      );


    hash =
      Math.imul(
        hash,
        16777619
      );

  }


  return (
    hash >>>
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
          String(
            key
          )
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
        ] =
          value;

      }
    );


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
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      3500
    );

}
