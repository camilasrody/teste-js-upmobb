# Teste Frontend — Contratos

Tela administrativa de contratos

## Estrutura

```
pages/contracts/list.html     — Tela principal
scripts/contracts/list.js     — Lógica da tela
scripts/contracts/contracts.requests.js — Operações assíncronas
style/contracts.css           — Estilos
```

## Como usar

Abra `pages/contracts/list.html` diretamente no navegador (servidor local recomendado para módulos ES).

```bash
npx serve .
```

## Funcionalidades

- Listagem de contratos com busca, filtro por status, ordenação e paginação
- Criar contrato com validação de campos
- Ver detalhes do contrato
- Prévia do contrato com suporte a texto, negrito e listas
