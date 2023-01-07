const table = document.querySelector("#reported-complaints-data-table");
const tableHeaders = document.querySelectorAll(".table__column--header");
const tbody = document.querySelector(".reports__table--rows");
const rows = tbody.getElementsByTagName("tr");
const form = document.getElementById("report-filter-form");
const filterDateFrom = document.getElementById("filter__date__from");
const filterDateTo = document.getElementById("filter__date__to");
const searchBar = document.querySelector(".input__keywordSearch");
const searchButton = document.querySelector(".keyword-search__submit");
const latestUpdateDatePara = document.querySelector(".latest__updated__date");
const url = "https://data.cityofnewyork.us/resource/5uac-w243.json";
let apiParams = {};
let apiParamsDate = {};
let apiCallString = "";
let apiCallStringDate = "";
let sortAscending = true;
let fetchData, fetchAPI, latestReportDate;
/* --------------------- Table css filter class --------------------- */

searchBar.addEventListener("focusin", () => {
  searchButton.classList.add("active");
});
searchBar.addEventListener("focusout", () => {
  searchButton.classList.remove("active");
});

const filterTable = () => {
  let userInput = searchBar.value.toUpperCase();
  for (let i = 0; i < rows.length; i++) {
    let cells = rows[i].getElementsByTagName("td");
    let showRow = false;
    for (let j = 0; j < cells.length; j++) {
      if (cells[j].textContent.toUpperCase().indexOf(userInput) > -1) {
        showRow = true;
        break;
      }
    }
  }
};

/* --------------------- rendering data from the API --------------------- */

//sets the up the row inside the table
const dataSetSkeleton = (reportData) => {
  const skeleton = `<tr class="reports__table--row fs-md-5">
  <td data-sort-type="date" data-sort-key="date_of_incident" >${
    formattedDate(reportData.date_of_incident) || "UNKNOWN"
  }</td>
  <td data-sort-type="time" data-sort-key="time_of_incident" >${
    reportData.time_of_incident || "UNKNOWN"
  }</td>
  <td data-sort-type="date" data-sort-key="date_reported_to_police" >${
    formattedDate(reportData.date_reported_to_police) || "UNKNOWN"
  }</td>
  <td data-sort-type="integer" data-sort-key="precinct" >${
    reportData.precinct || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="borough" >${
    reportData.borough || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="exact_location_of_occurance" >${
    reportData.exact_location_of_occurance.latitude
  }, ${reportData.exact_location_of_occurance.longitude}</td>
  <td data-sort-type="string" data-sort-key="level_of_offense" >${
    reportData.level_of_offense || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="description_of_offense" >${
    reportData.description_of_offense || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="transit_station_name" >${
    reportData.transit_station_name || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="suspect_age_group" >${
    reportData.suspect_age_group || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="suspect_race" >${
    reportData.suspect_race || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="suspect_sex" >${
    formattedSex(reportData.suspect_sex) || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="victim_age_group" >${
    reportData.victim_age_group || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="victim_race" >${
    reportData.victim_race || "UNKNOWN"
  }</td>
  <td data-sort-type="string" data-sort-key="victim_sex" >${
    formattedSex(reportData.victim_sex) || "UNKNOWN"
  }</td></tr>`;
  return skeleton;
};

//styles the unknown values to be almost invisible
const stylingNullValues = () => {
  for (i = 0; i < rows.length; i++) {
    let cellsInRow = rows[i].cells;
    for (j = 0; j < cellsInRow.length; j++) {
      if (cellsInRow[j].innerText === "UNKNOWN") {
        cellsInRow[j].style.opacity = "0.5";
      }
    }
  }
};

//takes the columnCodes from API Data, and turns them into readable words
//uses the output to filter columns that we are only interested in
const filteredColumns = () => {
  const columns = [
    { cmplnt_fr_dt: "date_of_incident" },
    { cmplnt_fr_tm: "time_of_incident" },
    { rpt_dt: "date_reported_to_police" },
    { addr_pct_cd: "precinct" },
    { boro_nm: "borough" },
    { lat_lon: "exact_location_of_occurance" },
    { law_cat_cd: "level_of_offense" },
    { ofns_desc: "description_of_offense" },
    { station_name: "transit_station_name" },
    { susp_age_group: "suspect_age_group" },
    { susp_race: "suspect_race" },
    { susp_sex: "suspect_sex" },
    { vic_age_group: "victim_age_group" },
    { vic_race: "victim_race" },
    { vic_sex: "victim_sex" },
  ];

  let columnsArray = [];
  columns.forEach((object) => {
    let elements = Object.entries(object).flat().join(" AS ");
    columnsArray.push(elements);
  });

  let filteredColumn = columnsArray.toString();
  return filteredColumn;
};

//formats the date into MM/DD/format ---------------
const formattedDate = (rawDate) => {
  let date = new Date(rawDate);
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  return `${month}/${day}/${year}`;
};

//Instead of showing 'M' or "f", shows 'MALE' or 'FEMALE' ---------------
const formattedSex = (rawData) => {
  if (rawData === "M") {
    return "MALE";
  } else if (rawData === "F") {
    return "FEMALE";
  } else return "UNKNOWN";
};

//sorting the tables based on columns ---------------
const sortColumns = (event) => {
  const compare = (sortAscending, compA, compB) => {
    if (sortAscending) {
      if (compA < compB) {
        return -1;
      }
      if (compA > compB) {
        return 1;
      }
    } else {
      if (compA > compB) {
        return -1;
      }
      if (compA < compB) {
        return 1;
      }
    }
  };
  const sortKey = event.target.getAttribute("data-sort");
  const rowsArray = [...rows];

  rowsArray.sort(function (a, b) {
    const cellA = a.querySelector(`td[data-sort-key="${sortKey}"]`);
    const cellB = b.querySelector(`td[data-sort-key="${sortKey}"]`);
    let valA = cellA.textContent;
    let valB = cellB.textContent;
    const sortType = cellA.getAttribute("data-sort-type");

    if (sortType === "integer") {
      let intA = parseInt(valA);
      let intB = parseInt(valB);
      let compA = intA;
      let compB = intB;
      return compare(sortAscending, compA, compB);
    } else if (sortType === "date") {
      // If the values are dates, parse them and use the parsed values for comparison
      let dateFormat = "MM/DD/YYYY";
      let dateA = new Date(valA);
      let dateB = new Date(valB);
      let compA = dateA.getTime();
      let compB = dateB.getTime();
      return compare(sortAscending, compA, compB);
    } else {
      // If the values are strings, use the original values for comparison
      let compA = valA;
      let compB = valB;
      return compare(sortAscending, compA, compB);
    }
    return 0;
  });

  sortAscending = !sortAscending;
  rowsArray.forEach((row) => {
    tbody.appendChild(row);
  });
};

//scroll to view after click ---------------
const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  section.scrollIntoView({ behavior: "smooth" });
  form.reset();
  apiCallString = "";
  apiCallStringDate = "";
  apiParams = {};
  apiParamsDate = {};
};

//filtering Table ---------------
//set the max date to today
/* use this when the max date shoudl be dynamically set to today
function updateMaxAttribute() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  filterDateFrom.setAttribute("max", formattedDate);
  filterDateTo.setAttribute("max", formattedDate);
}
*/
//filter using dates
const handleDateChange = (event) => {
  const fromDate = filterDateFrom.value;
  const toDate = filterDateTo.value;
  const dateId = event.target.id;
  const selectedDate = event.target.value;

  //stops user from entering a to date before from date
  if (toDate && fromDate > toDate) {
    alert("The 'To' date must be after the selected 'From' date");
    filterDateTo.value = "";
  } else if (fromDate) {
    filterDateTo.min = fromDate;
  }

  if (dateId === "filter__date__from") {
    apiParamsDate.cmplnt_fr_dt_from = selectedDate;
  }
  if (dateId === "filter__date__to") {
    apiParamsDate.cmplnt_fr_dt_to = selectedDate;
  }
  filterDateTo.min = "2006-01-01";
};

//filter using everything else
const handleChange = (event) => {
  const selectedValue = event.target.value;
  const selectId = event.target.id;
  const selectElements = document.querySelectorAll(".form-floating select");
  const optionValues = {};
  selectElements.forEach((selectElement) => {
    const id = selectElement.id;
    const options = selectElement.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      values.push(options[i].value.toUpperCase());
    }
    optionValues[id] = values;
  });
  if (selectId === "filter__select__offense_level") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.law_cat_cd = selectedValue)
      : "";
  } else if (selectId === "filter__select__borough") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.boro_nm = selectedValue)
      : "";
  } else if (selectId === "suspect__select__sex") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.susp_sex = selectedValue)
      : "";
  } else if (selectId === "suspect__select__age") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.susp_age_group = selectedValue)
      : "";
  } else if (selectId === "suspect__select__race") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.susp_race = selectedValue)
      : "";
  } else if (selectId === "victim__select__sex") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.vic_sex = selectedValue)
      : "";
  } else if (selectId === "victim__select__age") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.vic_age_group = selectedValue)
      : "";
  } else if (selectId === "victim__select__race") {
    optionValues[selectId].includes(selectedValue)
      ? (apiParams.vic_race = selectedValue)
      : "";
  }
};

//resets form after submit button is clicked

//executes the API call to pull all the data
async function renderAPIData() {
  for (const [key, value] of Object.entries(apiParams)) {
    if (value) {
      apiCallString += `${key}=${value}&`;
    }
  }
  for (const key in apiParamsDate) {
    if (apiParamsDate.cmplnt_fr_dt_from && !apiParamsDate.cmplnt_fr_dt_to) {
      apiCallStringDate += `$where=cmplnt_fr_dt >= '${apiParamsDate.cmplnt_fr_dt_from}'&`;

      apiParamsDate = {};
    } else if (
      !apiParamsDate.cmplnt_fr_dt_from &&
      apiParamsDate.cmplnt_fr_dt_to
    ) {
      apiCallStringDate += `$where=cmplnt_fr_dt <= '${apiParamsDate.cmplnt_fr_dt_to}'&`;

      apiParamsDate = {};
    } else if (
      apiParamsDate.cmplnt_fr_dt_from &&
      apiParamsDate.cmplnt_fr_dt_to
    ) {
      apiCallStringDate += `$where=cmplnt_fr_dt between '${apiParamsDate.cmplnt_fr_dt_from}' and '${apiParamsDate.cmplnt_fr_dt_to}'&`;
      apiParamsDate = {};
    }
  }

  let apiEndpoint = `${url}?$limit=100&$select=${filteredColumns()}&$order=date_of_incident DESC&${apiCallString}${apiCallStringDate}`;
  fetchAPI = await fetch(apiEndpoint);
  fetchData = await fetchAPI.json();

  tbody.innerHTML = fetchData.map((data) => dataSetSkeleton(data)).join("");
}

//all necessary function calls
setTimeout(() => {
  stylingNullValues();
}, 2000);
