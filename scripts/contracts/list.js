import { fetchContracts, fetchContractById, createContract } from "./contracts.requests.js";

const state = {
  contracts: [],
  filtered: [],
  search: "",
  statusFilter: "",
  sortField: "",
  sortDir: "asc",
  page: 1,
  perPage: 8,
  loading: false,
  error: null,
};

const el = (id) => document.getElementById(id);

const makeEl = (tag, { className, textContent, dataset, title } = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  if (title) node.title = title;
  if (dataset) Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = v));
  return node;
};

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

const applyFilters = () => {
  const q = state.search.toLowerCase();
  let result = state.contracts.filter((c) => {
    const matchSearch =
      !q ||
      c.contractorName.toLowerCase().includes(q) ||
      c.document.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q);
    const matchStatus = !state.statusFilter || c.status === state.statusFilter;
    return matchSearch && matchStatus;
  });

  if (state.sortField) {
    result = [...result].sort((a, b) => {
      const va = String(a[state.sortField]).toLowerCase();
      const vb = String(b[state.sortField]).toLowerCase();
      return state.sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  state.filtered = result;
  state.page = 1;
};

const STATUS_LABELS = {
  not_sent: "Não enviado",
  awaiting_signature: "Aguardando assinatura",
  signed: "Assinado",
  cancelled: "Cancelado",
};

const STATUS_CLASS = {
  not_sent: "badge--not-sent",
  awaiting_signature: "badge--awaiting",
  signed: "badge--signed",
  cancelled: "badge--cancelled",
};

const buildAddress = (c) =>
  `${c.address}, ${c.number} — ${c.neighborhood}, ${c.city}/${c.state}`;

const renderRows = (rows) => {
  const tbody = el("table-body");
  tbody.replaceChildren(
    ...rows.map((c) => {
      const tr = makeEl("tr", { className: "table__row" });

      const tdStatus = makeEl("td", { className: "table__td" });
      tdStatus.appendChild(
        makeEl("span", {
          className: `badge ${STATUS_CLASS[c.status] ?? ""}`,
          textContent: STATUS_LABELS[c.status] ?? c.status,
        })
      );

      const btnDetails = makeEl("button", {
        className: "btn btn--icon",
        textContent: "📄",
        title: "Ver detalhes",
        dataset: { action: "details", id: c.id },
      });

      const btnPreview = makeEl("button", {
        className: "btn btn--icon",
        textContent: "👁",
        title: "Prévia",
        dataset: { action: "preview", id: c.id },
      });

      const tdActions = makeEl("td", { className: "table__td table__td--actions" });
      tdActions.append(btnDetails, btnPreview);

      tr.append(
        makeEl("td", { className: "table__td", textContent: c.model }),
        makeEl("td", { className: "table__td", textContent: c.contractorName }),
        makeEl("td", { className: "table__td", textContent: c.document }),
        makeEl("td", { className: "table__td", textContent: buildAddress(c) }),
        tdStatus,
        tdActions
      );

      return tr;
    })
  );
};

const renderPagination = () => {
  const total = state.filtered.length;
  const totalPages = Math.ceil(total / state.perPage);
  const paginationEl = el("pagination");

  if (totalPages <= 1) {
    paginationEl.hidden = true;
    return;
  }

  const start = (state.page - 1) * state.perPage + 1;
  const end = Math.min(state.page * state.perPage, total);

  el("pagination-info").textContent = `${start}–${end} de ${total}`;

  const controls = el("pagination-controls");
  controls.replaceChildren();

  const prevBtn = makeEl("button", { className: "pagination__btn", textContent: "‹" });
  prevBtn.disabled = state.page === 1;
  prevBtn.addEventListener("click", () => { state.page--; render(); });
  controls.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = makeEl("button", {
      className: `pagination__btn${i === state.page ? " pagination__btn--active" : ""}`,
      textContent: String(i),
    });
    btn.addEventListener("click", () => { state.page = i; render(); });
    controls.appendChild(btn);
  }

  const nextBtn = makeEl("button", { className: "pagination__btn", textContent: "›" });
  nextBtn.disabled = state.page === totalPages;
  nextBtn.addEventListener("click", () => { state.page++; render(); });
  controls.appendChild(nextBtn);

  paginationEl.hidden = false;
};

const setVisibility = (ids, visibleId) => {
  ids.forEach((id) => { el(id).hidden = id !== visibleId; });
};

const render = () => {
  const tableWrapper = document.querySelector(".table-wrapper");
  const total = state.filtered.length;
  const pageRows = state.filtered.slice(
    (state.page - 1) * state.perPage,
    state.page * state.perPage
  );

  if (state.loading) {
    tableWrapper.hidden = true;
    setVisibility(["state-loading", "state-empty", "state-error"], "state-loading");
    el("pagination").hidden = true;
    return;
  }

  if (state.error) {
    tableWrapper.hidden = true;
    setVisibility(["state-loading", "state-empty", "state-error"], "state-error");
    el("error-message").textContent = state.error;
    el("pagination").hidden = true;
    return;
  }

  if (total === 0) {
    tableWrapper.hidden = true;
    setVisibility(["state-loading", "state-empty", "state-error"], "state-empty");
    el("pagination").hidden = true;
    return;
  }

  setVisibility(["state-loading", "state-empty", "state-error"], null);
  tableWrapper.hidden = false;
  renderRows(pageRows);
  renderPagination();

  document.querySelectorAll(".table__th--sortable").forEach((th) => {
    th.classList.remove("table__th--asc", "table__th--desc");
    if (th.dataset.col === state.sortField) {
      th.classList.add(`table__th--${state.sortDir}`);
    }
  });
};

const openModal = (id) => { el(id).hidden = false; };
const closeModal = (id) => { el(id).hidden = true; };

const detailItem = (label, value) => {
  const item = makeEl("div", { className: "detail-grid__item" });
  item.append(
    makeEl("span", { className: "detail-grid__label", textContent: label }),
    makeEl("span", { className: "detail-grid__value", textContent: value })
  );
  return item;
};

const showDetails = (contract) => {
  const grid = el("detail-content");
  const date = new Date(contract.createdAt).toLocaleDateString("pt-BR");
  grid.replaceChildren(
    detailItem("Modelo", contract.model),
    detailItem("Contratante", contract.contractorName),
    detailItem("Documento", `${contract.documentType}: ${contract.document}`),
    detailItem("E-mail", contract.email),
    detailItem("Endereço completo", buildAddress(contract)),
    detailItem("Status", STATUS_LABELS[contract.status] ?? contract.status),
    detailItem("Data de criação", date)
  );
  openModal("modal-details");
};
