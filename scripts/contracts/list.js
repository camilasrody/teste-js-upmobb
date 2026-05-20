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

const esc = (value) => {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(value ?? "")));
  return div.innerHTML;
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
