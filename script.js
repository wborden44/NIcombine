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


      row.className =
        "athlete-row";


      row.dataset.playerId =
        athlete.id;


      row.innerHTML =
        `

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

            <span class="age-pill">

              ${escapeHtml(
                athlete.ageGroup
              )}

            </span>

          </td>

        `;


      row.addEventListener(
        "click",
        () => {

          startTesting(
            athlete.id
          );

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

      filtered.length
      >
      0

    );

}
