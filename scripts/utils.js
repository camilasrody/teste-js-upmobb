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
