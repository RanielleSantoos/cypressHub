# Cypress Hub · Frontend

Dashboard Angular standalone com Tailwind CSS, Angular Material e HTTP real. As versões fixadas incluem Angular 21.2.26, CLI 21.2.30, Material/CDK 21.2.14, Tailwind CSS 4.3.5, TypeScript 5.9.3 e Vitest 4.1.12. Use Node.js 24 LTS e npm 11. Validação realizada com Node.js 24.22.3 e npm 11.9.0.

## Executar no Windows

Abra esta pasta no VS Code. No Git Bash:

```bash
npm ci
npm start
```

No PowerShell:

```powershell
npm.cmd ci
npm.cmd start
```

Inicie o projeto irmão `cypress-hub-backend` na porta 3000 e abra [Cypress Hub](http://localhost:4200). O **Dashboard** apresenta a saúde da API, os specs e as telas do projeto evologCypress.

No menu lateral, use **Integrações** para importar a pasta local configurada no backend. **Casos de teste**, **Telas**, **Documentação** e **Agendamentos** trabalham sobre o catálogo do evologCypress. **Execuções** e **Relatórios** aguardam os resultados do worker Cypress.

**Casos de teste** exige um módulo e uma tela para consultar os casos. Em **Telas**, filtre por módulo e alterne entre lista e grade. Em **Agendamentos**, escolha um módulo e selecione telas entre os menus do módulo para registrar um horário.

## Configuração e testes

O build de desenvolvimento lê a URL pública de `src/environments/environment.development.ts`. O build padrão usa `/api` na mesma origem da aplicação. Em um servidor estático, configure fallback para `index.html` nas rotas Angular e encaminhamento de `/api` para o backend. O frontend não recebe segredos.

No Git Bash:

```bash
npm run build
npm test
```

No PowerShell:

```powershell
npm.cmd run build
npm.cmd test
```

O build produz `dist/cypress-hub-frontend/browser`. Os testes Angular/Vitest com jsdom simulam respostas HTTP e verificam os indicadores, o fluxo de sincronização e as sugestões de requisitos. Para o teste com API e PostgreSQL reais, consulte `docs/INTEGRACAO-EVOLOG.md` no repositório do backend.
