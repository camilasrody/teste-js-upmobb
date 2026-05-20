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
