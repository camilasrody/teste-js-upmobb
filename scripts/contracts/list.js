import { fetchContracts, fetchContractById, createContract } from "./contracts.requests.js";
import { isEmail, isCPF, isCNPJ, isCEP, isUF, formatCPF, formatCNPJ, formatCEP, CONTRACT_TEMPLATE } from "../utils.js";

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

const setFieldError = (inputId, errId, message) => {
  el(inputId).classList.add("input--error");
  el(errId).textContent = message;
};

const clearFieldError = (inputId, errId) => {
  el(inputId).classList.remove("input--error");
  el(errId).textContent = "";
};

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

const parsePreview = (text) => {
  const fragment = document.createDocumentFragment();
  const lines = text.split("\n");
  let ul = null;

  lines.forEach((line) => {
    if (line.startsWith("- ")) {
      if (!ul) {
        ul = document.createElement("ul");
        fragment.appendChild(ul);
      }
      const li = document.createElement("li");
      li.textContent = line.slice(2);
      ul.appendChild(li);
    } else {
      ul = null;
      const p = document.createElement("p");
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      parts.forEach((part) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const strong = document.createElement("strong");
          strong.textContent = part.slice(2, -2);
          p.appendChild(strong);
        } else {
          p.appendChild(document.createTextNode(part));
        }
      });
      fragment.appendChild(p);
    }
  });

  return fragment;
};

const showPreview = (contract) => {
  const filled = CONTRACT_TEMPLATE.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => contract[key] ?? ""
  );
  const container = el("preview-content");
  container.replaceChildren(parsePreview(filled));
  openModal("modal-preview");
};

const validateForm = () => {
  let valid = true;

  const require = (inputId, errId, label) => {
    if (!el(inputId).value.trim()) {
      setFieldError(inputId, errId, `${label} é obrigatório`);
      valid = false;
      return false;
    }
    clearFieldError(inputId, errId);
    return true;
  };

  require("f-model", "err-model", "Modelo");
  require("f-name", "err-name", "Nome do contratante");
  require("f-neighborhood", "err-neighborhood", "Bairro");
  require("f-address", "err-address", "Endereço");
  require("f-number", "err-number", "Número");
  require("f-city", "err-city", "Cidade");

  const email = el("f-email").value.trim();
  if (!email) {
    setFieldError("f-email", "err-email", "E-mail é obrigatório");
    valid = false;
  } else if (!isEmail(email)) {
    setFieldError("f-email", "err-email", "E-mail inválido");
    valid = false;
  } else {
    clearFieldError("f-email", "err-email");
  }

  const docType = el("f-doctype").value;
  if (!docType) {
    setFieldError("f-doctype", "err-doctype", "Tipo de documento é obrigatório");
    valid = false;
  } else {
    clearFieldError("f-doctype", "err-doctype");
  }

  const doc = el("f-doc").value.trim();
  if (!doc) {
    setFieldError("f-doc", "err-doc", "Documento é obrigatório");
    valid = false;
  } else if (docType === "CPF" && !isCPF(doc)) {
    setFieldError("f-doc", "err-doc", "CPF inválido");
    valid = false;
  } else if (docType === "CNPJ" && !isCNPJ(doc)) {
    setFieldError("f-doc", "err-doc", "CNPJ inválido");
    valid = false;
  } else {
    clearFieldError("f-doc", "err-doc");
  }

  const cep = el("f-zip").value.trim();
  if (!cep) {
    setFieldError("f-zip", "err-zip", "CEP é obrigatório");
    valid = false;
  } else if (!isCEP(cep)) {
    setFieldError("f-zip", "err-zip", "CEP inválido (ex: 01310-100)");
    valid = false;
  } else {
    clearFieldError("f-zip", "err-zip");
  }

  const uf = el("f-state").value.trim();
  if (!uf) {
    setFieldError("f-state", "err-state", "UF é obrigatória");
    valid = false;
  } else if (!isUF(uf)) {
    setFieldError("f-state", "err-state", "UF inválida (ex: SP)");
    valid = false;
  } else {
    clearFieldError("f-state", "err-state");
  }

  return valid;
};

const clearForm = () => {
  [
    ["f-model", "err-model"],
    ["f-name", "err-name"],
    ["f-email", "err-email"],
    ["f-doctype", "err-doctype"],
    ["f-doc", "err-doc"],
    ["f-zip", "err-zip"],
    ["f-address", "err-address"],
    ["f-number", "err-number"],
    ["f-neighborhood", "err-neighborhood"],
    ["f-city", "err-city"],
    ["f-state", "err-state"],
  ].forEach(([inputId, errId]) => clearFieldError(inputId, errId));
};

const handleFormSubmit = async () => {
  if (!validateForm()) return;

  const submitBtn = el("btn-submit-form");
  submitBtn.disabled = true;
  submitBtn.textContent = "Salvando...";

  const data = {
    model:          el("f-model").value.trim(),
    contractorName: el("f-name").value.trim(),
    email:          el("f-email").value.trim(),
    documentType:   el("f-doctype").value.trim(),
    document:       el("f-doc").value.trim(),
    zipCode:        el("f-zip").value.trim(),
    address:        el("f-address").value.trim(),
    number:         el("f-number").value.trim(),
    neighborhood:   el("f-neighborhood").value.trim(),
    city:           el("f-city").value.trim(),
    state:          el("f-state").value.trim().toUpperCase(),
  };

  try {
    const created = await createContract(data);
    state.contracts.unshift(created);
    applyFilters();
    render();
    closeModal("modal-form");
    clearForm();
    showToast("Contrato criado com sucesso!");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Salvar";
  }
};

const bindToolbar = () => {
  el("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    applyFilters();
    render();
  });

  el("filter-status").addEventListener("change", (e) => {
    state.statusFilter = e.target.value;
    applyFilters();
    render();
  });

  el("sort-field").addEventListener("change", (e) => {
    state.sortField = e.target.value;
    applyFilters();
    render();
  });

  el("sort-dir").addEventListener("change", (e) => {
    state.sortDir = e.target.value;
    applyFilters();
    render();
  });
};

const bindTableActions = () => {
  el("table-body").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, id } = btn.dataset;
    btn.disabled = true;

    try {
      const contract = await fetchContractById(id);
      if (action === "details") showDetails(contract);
      if (action === "preview") showPreview(contract);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
};

const bindModals = () => {
  document.addEventListener("click", (e) => {
    const closeTarget = e.target.closest("[data-close]");
    if (closeTarget) {
      closeModal(closeTarget.dataset.close);
      return;
    }

    if (e.target.classList.contains("modal-backdrop")) {
      closeModal(e.target.id);
    }
  });

  el("btn-new-contract").addEventListener("click", () => {
    clearForm();
    openModal("modal-form");
  });

  el("btn-submit-form").addEventListener("click", handleFormSubmit);

  el("f-zip").addEventListener("input", (e) => {
    const formatted = formatCEP(e.target.value);
    e.target.value = formatted;
  });

  const applyDocMask = () => {
    const docType = el("f-doctype").value;
    const input = el("f-doc");
    if (docType === "CPF") {
      input.placeholder = "000.000.000-00";
      input.maxLength = 14;
      input.value = formatCPF(input.value);
    } else if (docType === "CNPJ") {
      input.placeholder = "00.000.000/0000-00";
      input.maxLength = 18;
      input.value = formatCNPJ(input.value);
    } else {
      input.placeholder = "";
      input.maxLength = 20;
    }
  };

  el("f-doctype").addEventListener("change", () => {
    el("f-doc").value = "";
    applyDocMask();
  });

  el("f-doc").addEventListener("input", (e) => {
    const docType = el("f-doctype").value;
    if (docType === "CPF") e.target.value = formatCPF(e.target.value);
    else if (docType === "CNPJ") e.target.value = formatCNPJ(e.target.value);
  });
};

const loadContracts = async () => {
  state.loading = true;
  state.error = null;
  render();

  try {
    state.contracts = await fetchContracts();
    applyFilters();
  } catch (err) {
    state.error = err.message;
  } finally {
    state.loading = false;
    render();
  }
};

const init = () => {
  bindToolbar();
  bindTableActions();
  bindModals();
  el("btn-retry").addEventListener("click", loadContracts);
  loadContracts();
};

document.addEventListener("DOMContentLoaded", init);
