const storageKey = "proptech-suite-state";

const defaultState = {
  listings: [
    {
      id: "L-1001",
      name: "Maple Ridge Townhome",
      address: "2403 Maple Ridge Dr, Austin",
      status: "Occupied",
      rent: 2150,
      occupancy: 100,
    },
    {
      id: "L-1002",
      name: "Harborline Lofts",
      address: "88 Dockside Ave, Tampa",
      status: "Available",
      rent: 1850,
      occupancy: 0,
    },
    {
      id: "L-1003",
      name: "Cedar Court Duplex",
      address: "14 Cedar Ct, Raleigh",
      status: "Occupied",
      rent: 1325,
      occupancy: 100,
    },
  ],
  rents: [
    {
      id: "R-201",
      property: "Maple Ridge Townhome",
      tenant: "Maya Alvarez",
      amount: 2150,
      due: "Sep 05",
      status: "Due",
    },
    {
      id: "R-202",
      property: "Harborline Lofts",
      tenant: "Vacant",
      amount: 0,
      due: "--",
      status: "Vacant",
    },
    {
      id: "R-203",
      property: "Cedar Court Duplex",
      tenant: "Chris Douglas",
      amount: 1325,
      due: "Sep 08",
      status: "Paid",
    },
  ],
  maintenance: [
    {
      id: "M-77",
      property: "Maple Ridge Townhome",
      issue: "AC making loud noise",
      priority: "High",
      status: "Open",
      eta: "Sep 03",
    },
    {
      id: "M-78",
      property: "Cedar Court Duplex",
      issue: "Leaky faucet in kitchen",
      priority: "Medium",
      status: "Scheduled",
      eta: "Sep 04",
    },
  ],
};

const state = loadState();

const navButtons = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const listingCards = document.getElementById("listing-cards");
const rentTable = document.getElementById("rent-table");
const maintenanceTable = document.getElementById("maintenance-table");
const analyticsGrid = document.getElementById("analytics-grid");
const heroMetrics = document.getElementById("hero-metrics");
const maintenancePreview = document.getElementById("maintenance-preview");
const rentPreview = document.getElementById("rent-preview");
const openMaintenancePill = document.getElementById("open-maintenance-pill");
const rentDuePill = document.getElementById("rent-due-pill");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("modal-form");

initNav();
initActions();
renderAll();

function initNav() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      setActiveView(view);
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    if (!button.classList.contains("nav-item")) {
      button.addEventListener("click", () => {
        const view = button.dataset.view;
        setActiveView(view);
      });
    }
  });
}

function initActions() {
  document.getElementById("add-listing").addEventListener("click", () => {
    openModal(buildListingForm(), "Add listing");
  });

  document.getElementById("new-request").addEventListener("click", () => {
    openModal(buildMaintenanceForm(), "New maintenance request");
  });

  document.getElementById("quick-add").addEventListener("click", () => {
    openModal(buildQuickAddForm(), "Quick add");
  });

  document.getElementById("close-modal").addEventListener("click", closeModal);

  document.getElementById("mark-all-paid").addEventListener("click", () => {
    state.rents = state.rents.map((rent) => {
      if (rent.status === "Due") {
        return { ...rent, status: "Paid" };
      }
      return rent;
    });
    saveState();
    renderAll();
  });

  document.getElementById("send-reminders").addEventListener("click", () => {
    alert("Reminders sent to tenants with due balances.");
  });

  document.getElementById("refresh-analytics").addEventListener("click", () => {
    renderAnalytics();
  });

  document.getElementById("export").addEventListener("click", () => {
    alert("Report exported as HarborKey-Portfolio.pdf");
  });
}

function setActiveView(viewName) {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

function renderAll() {
  renderListings();
  renderRent();
  renderMaintenance();
  renderAnalytics();
  renderDashboard();
}

function renderListings() {
  listingCards.innerHTML = "";
  state.listings.forEach((listing) => {
    const card = document.createElement("div");
    card.className = "card clickable";

    const statusClass = listing.status === "Available" ? "warning" : "success";

    card.innerHTML = `
      <h3>${listing.name}</h3>
      <p>${listing.address}</p>
      <div class="status ${statusClass}">${listing.status}</div>
      <p>Monthly rent: $${listing.rent}</p>
    `;

    listingCards.appendChild(card);
    card.addEventListener("click", () => {
      openInfo(
        `
          <p><strong>Address:</strong> ${listing.address}</p>
          <p><strong>Status:</strong> ${listing.status}</p>
          <p><strong>Monthly rent:</strong> $${listing.rent}</p>
        `,
        listing.name
      );
    });
  });
}

function renderRent() {
  rentTable.innerHTML = buildTableHeader([
    "Property",
    "Tenant",
    "Amount",
    "Status",
  ]);

  state.rents.forEach((rent) => {
    const row = document.createElement("div");
    row.className = "row clickable";

    const statusClass =
      rent.status === "Paid"
        ? "success"
        : rent.status === "Due"
        ? "warning"
        : "danger";

    row.innerHTML = `
      <div>
        <strong>${rent.property}</strong>
        <p class="muted">Due ${rent.due}</p>
      </div>
      <div>${rent.tenant}</div>
      <div>$${rent.amount}</div>
      <div class="row-actions">
        <span class="status ${statusClass}">${rent.status}</span>
        ${
          rent.status === "Due"
            ? `<button class="ghost" data-action="collect" data-id="${rent.id}">Collect</button>`
            : ""
        }
      </div>
    `;

    rentTable.appendChild(row);
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      openInfo(
        `
          <p><strong>Tenant:</strong> ${rent.tenant}</p>
          <p><strong>Amount:</strong> $${rent.amount}</p>
          <p><strong>Due:</strong> ${rent.due}</p>
          <p><strong>Status:</strong> ${rent.status}</p>
        `,
        rent.property
      );
    });
  });

  rentTable.querySelectorAll("[data-action='collect']").forEach((button) => {
    button.addEventListener("click", () => {
      const rentId = button.dataset.id;
      updateRentStatus(rentId, "Paid");
    });
  });
}

function renderMaintenance() {
  maintenanceTable.innerHTML = buildTableHeader([
    "Property",
    "Issue",
    "Priority",
    "Status",
  ]);

  state.maintenance.forEach((ticket) => {
    const row = document.createElement("div");
    row.className = "row clickable";

    const statusClass =
      ticket.status === "Open"
        ? "danger"
        : ticket.status === "Scheduled"
        ? "warning"
        : "success";

    row.innerHTML = `
      <div>
        <strong>${ticket.property}</strong>
        <p class="muted">ETA ${ticket.eta}</p>
      </div>
      <div>${ticket.issue}</div>
      <div>${ticket.priority}</div>
      <div class="row-actions">
        <span class="status ${statusClass}">${ticket.status}</span>
        <button class="ghost" data-action="advance" data-id="${ticket.id}">Advance</button>
      </div>
    `;

    maintenanceTable.appendChild(row);
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      openInfo(
        `
          <p><strong>Issue:</strong> ${ticket.issue}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>ETA:</strong> ${ticket.eta}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
        `,
        ticket.property
      );
    });
  });

  maintenanceTable.querySelectorAll("[data-action='advance']").forEach((button) => {
    button.addEventListener("click", () => {
      const ticketId = button.dataset.id;
      advanceMaintenance(ticketId);
    });
  });
}

function renderAnalytics() {
  analyticsGrid.innerHTML = "";

  const occupancy = Math.round(
    (state.listings.filter((listing) => listing.status === "Occupied")
      .length /
      Math.max(state.listings.length, 1)) *
      100
  );

  const collected = state.rents
    .filter((rent) => rent.status === "Paid")
    .reduce((sum, rent) => sum + rent.amount, 0);

  const due = state.rents
    .filter((rent) => rent.status === "Due")
    .reduce((sum, rent) => sum + rent.amount, 0);

  const openTickets = state.maintenance.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const charts = [
    {
      title: "Occupancy",
      value: `${occupancy}%`,
      percent: occupancy,
    },
    {
      title: "Rent collected",
      value: `$${collected}`,
      percent: Math.min(100, (collected / Math.max(collected + due, 1)) * 100),
    },
    {
      title: "Open maintenance",
      value: `${openTickets} tickets`,
      percent: Math.min(100, openTickets * 20),
    },
    {
      title: "Portfolio health",
      value: `${Math.max(70, 100 - openTickets * 8)}%`,
      percent: Math.max(70, 100 - openTickets * 8),
    },
  ];

  charts.forEach((chart) => {
    const card = document.createElement("div");
    card.className = "chart";
    card.innerHTML = `
      <div>
        <h3>${chart.title}</h3>
        <p>${chart.value}</p>
      </div>
      <div class="chart-bar"><span style="width:${chart.percent}%;"></span></div>
    `;
    analyticsGrid.appendChild(card);
  });
}

function renderDashboard() {
  const openCount = state.maintenance.filter(
    (ticket) => ticket.status === "Open"
  ).length;
  const dueCount = state.rents.filter((rent) => rent.status === "Due").length;
  const occupiedCount = state.listings.filter(
    (listing) => listing.status === "Occupied"
  ).length;

  heroMetrics.innerHTML = `
    <div class="metric-card">
      <h3>Occupied units</h3>
      <p>${occupiedCount}/${state.listings.length}</p>
    </div>
    <div class="metric-card">
      <h3>Open maintenance</h3>
      <p>${openCount}</p>
    </div>
    <div class="metric-card">
      <h3>Rent due</h3>
      <p>${dueCount}</p>
    </div>
  `;

  openMaintenancePill.textContent = `${openCount} open`;
  rentDuePill.textContent = `${dueCount} due`;

  maintenancePreview.innerHTML = buildPreview(state.maintenance, (ticket) => {
    return `${ticket.property} - ${ticket.issue}`;
  });

  rentPreview.innerHTML = buildPreview(state.rents, (rent) => {
    return `${rent.property} - $${rent.amount}`;
  });
}

function buildTableHeader(labels) {
  const header = document.createElement("div");
  header.className = "row row-header";
  header.innerHTML = labels.map((label) => `<div>${label}</div>`).join("");
  return header.outerHTML;
}

function buildPreview(items, formatItem) {
  if (!items.length) {
    return "<p class=\"muted\">No updates yet.</p>";
  }

  const max = Math.min(items.length, 3);
  return `
    <div class="preview-list">
      ${items.slice(0, max).map((item) => `<p>${formatItem(item)}</p>`).join("")}
    </div>
  `;
}

function updateRentStatus(rentId, status) {
  state.rents = state.rents.map((rent) =>
    rent.id === rentId ? { ...rent, status } : rent
  );
  saveState();
  renderAll();
}

function advanceMaintenance(ticketId) {
  state.maintenance = state.maintenance.map((ticket) => {
    if (ticket.id !== ticketId) {
      return ticket;
    }

    if (ticket.status === "Open") {
      return { ...ticket, status: "Scheduled" };
    }

    if (ticket.status === "Scheduled") {
      return { ...ticket, status: "Completed" };
    }

    return ticket;
  });
  saveState();
  renderAll();
}

function openModal(formHtml, title) {
  modalTitle.textContent = title;
  modalForm.innerHTML = formHtml;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  modalForm.addEventListener("submit", handleModalSubmit, { once: true });

  const quickType = modalForm.querySelector("#quick-type");
  if (quickType) {
    setQuickFields(quickType.value);
  }
}

function openInfo(contentHtml, title) {
  modalTitle.textContent = title;
  modalForm.innerHTML = contentHtml;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  modalForm.innerHTML = "";
}

function handleModalSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const type = formData.get("type") || event.target.dataset.type;

  if (type === "listing") {
    state.listings.unshift({
      id: `L-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: formData.get("name"),
      address: formData.get("address"),
      status: formData.get("status"),
      rent: Number(formData.get("rent")),
      occupancy: formData.get("status") === "Occupied" ? 100 : 0,
    });
  }

  if (type === "rent") {
    state.rents.unshift({
      id: `R-${Math.floor(Math.random() * 900 + 100)}`,
      property: formData.get("property"),
      tenant: formData.get("tenant"),
      amount: Number(formData.get("amount")),
      due: formData.get("due"),
      status: "Due",
    });
  }

  if (type === "maintenance") {
    state.maintenance.unshift({
      id: `M-${Math.floor(Math.random() * 90 + 10)}`,
      property: formData.get("property"),
      issue: formData.get("issue"),
      priority: formData.get("priority"),
      status: "Open",
      eta: formData.get("eta"),
    });
  }

  saveState();
  renderAll();
  closeModal();
}

function buildListingForm() {
  return `
    <input type="hidden" name="type" value="listing" />
    <label>
      Listing name
      <input name="name" required />
    </label>
    <label>
      Address
      <input name="address" required />
    </label>
    <label>
      Status
      <select name="status">
        <option>Occupied</option>
        <option>Available</option>
      </select>
    </label>
    <label>
      Monthly rent
      <input name="rent" type="number" min="0" required />
    </label>
    <button class="primary" type="submit">Add listing</button>
  `;
}

function buildMaintenanceForm() {
  return `
    <input type="hidden" name="type" value="maintenance" />
    <label>
      Property
      <input name="property" required />
    </label>
    <label>
      Issue
      <textarea name="issue" required></textarea>
    </label>
    <label>
      Priority
      <select name="priority">
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
    </label>
    <label>
      ETA
      <input name="eta" placeholder="Sep 10" />
    </label>
    <button class="primary" type="submit">Create request</button>
  `;
}

function buildQuickAddForm() {
  return `
    <label>
      Add type
      <select name="type" id="quick-type">
        <option value="listing">Listing</option>
        <option value="rent">Rent</option>
        <option value="maintenance">Maintenance</option>
      </select>
    </label>
    <div id="quick-fields"></div>
    <button class="primary" type="submit">Save</button>
  `;
}

modalForm.addEventListener("change", (event) => {
  if (event.target.id !== "quick-type") {
    return;
  }

  setQuickFields(event.target.value);
});

function setQuickFields(type) {
  const fields = document.getElementById("quick-fields");
  if (!fields) {
    return;
  }

  if (type === "listing") {
    fields.innerHTML = `
      <label>
        Listing name
        <input name="name" required />
      </label>
      <label>
        Address
        <input name="address" required />
      </label>
      <label>
        Monthly rent
        <input name="rent" type="number" min="0" required />
      </label>
      <input type="hidden" name="status" value="Available" />
    `;
  }

  if (type === "rent") {
    fields.innerHTML = `
      <label>
        Property
        <input name="property" required />
      </label>
      <label>
        Tenant
        <input name="tenant" required />
      </label>
      <label>
        Amount
        <input name="amount" type="number" min="0" required />
      </label>
      <label>
        Due date
        <input name="due" placeholder="Sep 15" />
      </label>
    `;
  }

  if (type === "maintenance") {
    fields.innerHTML = `
      <label>
        Property
        <input name="property" required />
      </label>
      <label>
        Issue
        <textarea name="issue" required></textarea>
      </label>
      <label>
        Priority
        <select name="priority">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </label>
      <label>
        ETA
        <input name="eta" placeholder="Sep 11" />
      </label>
    `;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch (error) {
    return structuredClone(defaultState);
  }
}
