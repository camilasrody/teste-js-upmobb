# Teste Frontend — Contratos

Tela administrativa de contratos
<img width="1250" height="805" alt="{3A9BB99A-0786-4988-8C32-25BF91C3353C}" src="https://github.com/user-attachments/assets/f82fc7ad-a5d2-48e1-802f-6c32a7afe668" />

## Estrutura

```
pages/contracts/list.html     — Tela principal
scripts/contracts/list.js     — Lógica da tela
scripts/contracts/contracts.requests.js — Operações assíncronas
style/contracts.css           — Estilos
```

## Como usar

Abra `pages/contracts/list` diretamente no navegador

```bash
npx serve .
```

## Funcionalidades

- Listagem de contratos com busca, filtro por status, ordenação e paginação
- Criar contrato com validação de campos
- Ver detalhes do contrato
- Prévia do contrato com suporte a texto, negrito e listas
