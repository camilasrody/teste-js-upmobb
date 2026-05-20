export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

export const onlyDigits = (value) => String(value).replace(/\D/g, "");

export const isCPF = (value) => {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const mod = (sum) => { const r = sum % 11; return r < 2 ? 0 : 11 - r; };
  const d1 = mod(d.slice(0, 9).split("").reduce((s, n, i) => s + Number(n) * (10 - i), 0));
  const d2 = mod(d.slice(0, 10).split("").reduce((s, n, i) => s + Number(n) * (11 - i), 0));
  return Number(d[9]) === d1 && Number(d[10]) === d2;
};

export const isCNPJ = (value) => {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const mod = (sum) => { const r = sum % 11; return r < 2 ? 0 : 11 - r; };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (weights) => weights.reduce((s, w, i) => s + Number(d[i]) * w, 0);
  return Number(d[12]) === mod(calc(w1)) && Number(d[13]) === mod(calc(w2));
};

export const isCEP = (value) => /^\d{5}-?\d{3}$/.test(String(value).trim());

const UF_LIST = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
]);

export const isUF = (value) => UF_LIST.has(String(value).trim().toUpperCase());

export const formatCPF = (value) => {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const formatCNPJ = (value) => {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export const formatCEP = (value) => {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

export const CONTRACT_TEMPLATE = `**CONTRATO DE PRESTAÇÃO DE SERVIÇOS**

Pelo presente instrumento, as partes abaixo identificadas:

**Contratante:** {{contractorName}}
**Documento:** {{documentType}} {{document}}
**E-mail:** {{email}}
**Endereço:** {{address}}, {{number}}, {{neighborhood}}, {{city}} - {{state}}, CEP {{zipCode}}

**Objeto do contrato:**
- Prestação de serviços conforme modelo: {{model}}
- Vigência a partir da data de assinatura

**Condições gerais:**
- O contratante declara estar ciente de todas as cláusulas
- Qualquer alteração deve ser formalizada por escrito
- Foro eleito: comarca da cidade do contratante`;
export const validateContract = (getVal, onError, onClear) => {
  let valid = true;

  const require = (field, errField, label) => {
    if (!getVal(field).trim()) {
      onError(field, errField, `${label} é obrigatório`);
      valid = false;
      return false;
    }
    onClear(field, errField);
    return true;
  };

  require("f-model", "err-model", "Modelo");
  require("f-name", "err-name", "Nome do contratante");
  require("f-neighborhood", "err-neighborhood", "Bairro");
  require("f-address", "err-address", "Endereço");
  require("f-number", "err-number", "Número");
  require("f-city", "err-city", "Cidade");

  const email = getVal("f-email").trim();
  if (!email) {
    onError("f-email", "err-email", "E-mail é obrigatório");
    valid = false;
  } else if (!isEmail(email)) {
    onError("f-email", "err-email", "E-mail inválido");
    valid = false;
  } else {
    onClear("f-email", "err-email");
  }

  const docType = getVal("f-doctype");
  if (!docType) {
    onError("f-doctype", "err-doctype", "Tipo de documento é obrigatório");
    valid = false;
  } else {
    onClear("f-doctype", "err-doctype");
  }

  const doc = getVal("f-doc").trim();
  if (!doc) {
    onError("f-doc", "err-doc", "Documento é obrigatório");
    valid = false;
  } else if (docType === "CPF" && !isCPF(doc)) {
    onError("f-doc", "err-doc", "CPF inválido");
    valid = false;
  } else if (docType === "CNPJ" && !isCNPJ(doc)) {
    onError("f-doc", "err-doc", "CNPJ inválido");
    valid = false;
  } else {
    onClear("f-doc", "err-doc");
  }

  const cep = getVal("f-zip").trim();
  if (!cep) {
    onError("f-zip", "err-zip", "CEP é obrigatório");
    valid = false;
  } else if (!isCEP(cep)) {
    onError("f-zip", "err-zip", "CEP inválido (ex: 01310-100)");
    valid = false;
  } else {
    onClear("f-zip", "err-zip");
  }

  const uf = getVal("f-state").trim();
  if (!uf) {
    onError("f-state", "err-state", "UF é obrigatória");
    valid = false;
  } else if (!isUF(uf)) {
    onError("f-state", "err-state", "UF inválida (ex: SP)");
    valid = false;
  } else {
    onClear("f-state", "err-state");
  }

  return valid;
};