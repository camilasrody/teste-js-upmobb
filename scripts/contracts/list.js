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
  `${esc(c.address)}, ${esc(c.number)} — ${esc(c.neighborhood)}, ${esc(c.city)}/${esc(c.state)}`;

const renderRows = (rows) => {
  const tbody = el("table-body");
  tbody.innerHTML = rows
    .map(
      (c) => `
      <tr class="table__row">
        <td class="table__td">${esc(c.model)}</td>
        <td class="table__td">${esc(c.contractorName)}</td>
        <td class="table__td">${esc(c.document)}</td>
        <td class="table__td">${buildAddress(c)}</td>
        <td class="table__td">
          <span class="badge ${STATUS_CLASS[c.status] ?? ""}">${esc(STATUS_LABELS[c.status] ?? c.status)}</span>
        </td>
        <td class="table__td table__td--actions">
          <button class="btn btn--icon" data-action="details" data-id="${esc(c.id)}" title="Ver detalhes">&#128196;</button>
          <button class="btn btn--icon" data-action="preview" data-id="${esc(c.id)}" title="Prévia">&#128065;</button>
        </td>
      </tr>`
    )
    .join("");
};
