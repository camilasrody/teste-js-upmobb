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
