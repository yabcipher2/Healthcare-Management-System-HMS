// Runtime Application Configuration Context
const CONFIG = {
  API_URL: "http://localhost:5000/api",
  getHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("hms_token")}`,
  }),
};

/**
 * CORE DATA PIPELINE: Fetches active DB entries and refreshes elements
 */
async function syncDashboardPipeline() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/patients`, {
      method: "GET",
      headers: CONFIG.getHeaders(),
    });

    const payload = await response.json();
    if (!payload.success) throw new Error(payload.message);

    const activePatients = payload.data;

    // 1. Re-calculate Real-Time Performance Overview Metrics
    calculateOverviewMetrics(activePatients);

    // 2. Feed Patient Distribution Data to existing Dashboard Charts
    refreshDistributionCharts(activePatients);

    // 3. Populate Interactive Dossier Registry Table
    populateDossierTable(activePatients);
  } catch (error) {
    console.error("System synchronization pipeline suspended:", error.message);
  }
}

/**
 * METRICS WIDGET ENGINE: Aggregates real-time numbers from operational database documents
 */
function calculateOverviewMetrics(patients) {
  const nodes = {
    total: document.getElementById("total-patients-counter"),
    admitted: document.getElementById("admitted-patients-counter"),
    observation: document.getElementById("observation-patients-counter"),
    discharged: document.getElementById("discharged-patients-counter"),
  };

  // Extract totals dynamically using continuous array filters
  const counts = {
    total: patients.length,
    admitted: patients.filter((p) => p.status === "Admitted").length,
    observation: patients.filter((p) => p.status === "Under Observation")
      .length,
    discharged: patients.filter((p) => p.status === "Discharged").length,
  };

  // Match text values inline inside existing containers safely
  if (nodes.total) nodes.total.innerText = counts.total;
  if (nodes.admitted) nodes.admitted.innerText = counts.admitted;
  if (nodes.observation) nodes.observation.innerText = counts.observation;
  if (nodes.discharged) nodes.discharged.innerText = counts.discharged;
}

/**
 * VISUALIZATION LAYER: Injects distribution metrics into active UI charts
 */
function refreshDistributionCharts(patients) {
  const admitted = patients.filter((p) => p.status === "Admitted").length;
  const observation = patients.filter(
    (p) => p.status === "Under Observation",
  ).length;
  const discharged = patients.filter((p) => p.status === "Discharged").length;

  // Verifies if your Chart canvas object or instance exists in the current DOM
  if (
    window.myPatientChart &&
    typeof window.myPatientChart.update === "function"
  ) {
    // Keeps UI exactly matching by simply shifting numerical values inside data configurations
    window.myPatientChart.data.datasets[0].data = [
      admitted,
      observation,
      discharged,
    ];
    window.myPatientChart.update(); // Smooth layout redraw animation
  }
}

/**
 * REGISTRY RE-RENDER ENGINE: Injects rows natively keeping interactive capabilities
 */
function populateDossierTable(patients) {
  const container = document.getElementById("patient-table-body");
  if (!container) return;

  container.innerHTML = ""; // Flushes old layout items safely

  patients.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHTML(record.name)}</strong></td>
      <td>${escapeHTML(String(record.age))}</td>
      <td>${escapeHTML(record.gender)}</td>
      <td><span class="badge badge-${getBadgeTheme(record.status)}">${record.status}</span></td>
      <td>${escapeHTML(record.condition)}</td>
      <td>
        <button class="btn btn-sm btn-action" onclick="initializeWorkflowStateModification('${record._id}', '${record.status}')">
          Modify State
        </button>
      </td>
    `;
    container.appendChild(row);
  });
}

/**
 * SUBMIT ACTION: Commits entries directly to the cloud / database
 */
async function processRegistrationForm(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("input-patient-name").value,
    age: parseInt(document.getElementById("input-patient-age").value, 10),
    gender: document.getElementById("select-patient-gender").value,
    condition: document.getElementById("input-patient-condition").value,
    status:
      document.getElementById("select-patient-status").value ||
      "Under Observation",
  };

  try {
    const response = await fetch(`${CONFIG.API_URL}/patients`, {
      method: "POST",
      headers: CONFIG.getHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    // Reset fields using form id node matching cleanly
    document.getElementById("patient-registration-form").reset();

    // Refresh background pipeline state instantly
    await syncDashboardPipeline();
  } catch (error) {
    alert(`Pipeline Synchronization Refused: ${error.message}`);
  }
}

/**
 * INLINE WORKFLOW TOGGLE ACTION
 */
async function commitStateUpdate(patientId, nextStatus) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/patients/${patientId}`, {
      method: "PUT",
      headers: CONFIG.getHeaders(),
      body: JSON.stringify({ status: nextStatus }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    await syncDashboardPipeline(); // Silently updates overview layout metrics
  } catch (error) {
    console.error("Workflow shift failed:", error.message);
  }
}

// Utility Helper functions to protect styling structures
function getBadgeTheme(status) {
  if (status === "Admitted") return "danger";
  if (status === "Under Observation") return "warning";
  return "success";
}

function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

// Mount runtime listeners natively upon asset compilation
document.addEventListener("DOMContentLoaded", () => {
  syncDashboardPipeline();

  const formElement = document.getElementById("patient-registration-form");
  if (formElement) {
    formElement.addEventListener("submit", processRegistrationForm);
  }
});
