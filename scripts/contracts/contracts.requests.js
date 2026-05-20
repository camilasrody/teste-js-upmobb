import CONTRACTS_MOCK from "./contracts.mock.js";

const SIMULATED_DELAY = 600;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let store = [...CONTRACTS_MOCK];

export const fetchContracts = async () => {
  await delay(SIMULATED_DELAY);
  if (Math.random() < 0.05) throw new Error("Falha ao carregar contratos.");
  return [...store];
};

export const fetchContractById = async (id) => {
  await delay(300);
  const contract = store.find((c) => c.id === id);
  if (!contract) throw new Error("Contrato não encontrado.");
  return { ...contract };
};

export const createContract = async (data) => {
  await delay(SIMULATED_DELAY);
  if (Math.random() < 0.05) throw new Error("Falha ao salvar contrato.");
  const newContract = {
    ...data,
    id: String(Date.now()),
    status: "not_sent",
    createdAt: new Date().toISOString(),
  };
  store = [newContract, ...store];
  return { ...newContract };
};
