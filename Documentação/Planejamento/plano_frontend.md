# Pluvio Web 3.x — Plano de Desenvolvimento Frontend

> Stack: Next.js 14 + React 18 + Tailwind CSS + React-Leaflet + TanStack Query + Zustand

---

## Estrutura de Pastas Detalhada

```text
frontend/
  src/
    app/
      layout.tsx
      page.tsx                    ← Home / mapa principal
      idf/
        page.tsx                  ← Fluxo de cálculo IDF
        result/
          page.tsx                ← Resultado e relatório
      admin/
        layout.tsx
        page.tsx                  ← Dashboard admin
        datasets/
          page.tsx                ← Lista de datasets
          [id]/
            page.tsx              ← Detalhe/validação do dataset
        import/
          page.tsx                ← Upload XLSX/PDF
        audit/
          page.tsx                ← Histórico de atualizações
      auth/
        login/
          page.tsx
      api/
        docs/
          page.tsx                ← Redirecionamento para Swagger
    components/
      layout/
        Header.tsx
        Footer.tsx
        Sidebar.tsx
        PageContainer.tsx
      ui/
        Button.tsx
        Input.tsx
        Select.tsx
        Modal.tsx
        Badge.tsx
        Alert.tsx
        Spinner.tsx
        Table.tsx
        Tabs.tsx
        Card.tsx
      map/
        BrazilMap.tsx             ← Mapa principal com UFs
        StationMarker.tsx         ← Marcador de estação
        CoordPicker.tsx           ← Clique para selecionar coordenada
      forms/
        IDFForm.tsx               ← Formulário duração/TR/modo
        UFSelector.tsx
        MunicipioSelector.tsx
        EstacaoSelector.tsx
        CoordForm.tsx
      results/
        IDFResultCard.tsx         ← Intensidade, parâmetros, flags
        IDFTable.tsx              ← Tabela I × duração × TR
        IDFChart.tsx              ← Gráfico curvas IDF (Recharts)
        InterpolationWarning.tsx  ← Aviso de interpolação
      reports/
        ReportPreview.tsx
        ExportButtons.tsx         ← PDF e JSON
      admin/
        DatasetTable.tsx
        EquationReviewCard.tsx
        AuditTimeline.tsx
    hooks/
      useIDF.ts
      useUFs.ts
      useMunicipios.ts
      useEstacoes.ts
      useDatasets.ts
      useAuth.ts
      useReport.ts
    stores/
      idf.store.ts                ← Estado do cálculo atual (Zustand)
      auth.store.ts               ← Estado de autenticação
      map.store.ts                ← Estado do mapa (UF, ponto selecionado)
    services/
      api.client.ts               ← Axios instance com interceptors
      idf.service.ts
      admin.service.ts
      auth.service.ts
    utils/
      idf.helpers.ts              ← Formatar intensidade, montar tabela
      report.helpers.ts           ← Gerar PDF com jsPDF
      geo.helpers.ts              ← Converter coords, calcular distância
      format.helpers.ts
    types/
      idf.types.ts
      admin.types.ts
      api.types.ts
    data/
      brazil-states.geojson       ← GeoJSON UFs do Brasil
  public/
    favicon.ico
    logo.png
  .env.local
  next.config.mjs
  tailwind.config.ts
  tsconfig.json
  package.json
  Dockerfile
```

---

## FASE 0 — Setup Frontend

### Checklist

#### Inicialização
- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] Instalar dependências do `package.frontend.json`
- [ ] Configurar `next.config.mjs` com `output: standalone`
- [ ] Configurar `tailwind.config.ts` com cores e fontes do projeto
- [ ] Criar `.env.local` com `NEXT_PUBLIC_API_URL`
- [ ] Confirmar que `npm run dev` sobe sem erros

#### Estrutura base
- [ ] Criar todas as pastas da estrutura acima
- [ ] Criar `api.client.ts` com Axios + interceptor de erro
- [ ] Criar componentes UI base: `Button`, `Input`, `Select`, `Spinner`, `Alert`
- [ ] Criar `Header.tsx` e `Footer.tsx`
- [ ] Criar `PageContainer.tsx`

#### Tipagem e utilitários
- [ ] Criar `idf.types.ts` com interfaces: `IDFRequest`, `IDFResult`, `IDFEquation`
- [ ] Criar `api.types.ts` com `ApiResponse<T>`, `PaginatedResponse<T>`
- [ ] Criar `format.helpers.ts`: formatar mm/h, mm/min, números com casas decimais

---

## FASE 1 — Fluxo de Cálculo IDF (Modo Legado)

### Checklist

#### Mapa e seleção de UF
- [ ] Baixar GeoJSON das UFs do Brasil (`brazil-states.geojson`)
- [ ] Criar `BrazilMap.tsx` com React-Leaflet
- [ ] Renderizar polígonos por UF com cor de destaque ao hover
- [ ] Ao clicar em UF → atualizar `map.store` com UF selecionada
- [ ] Mostrar nome da UF no hover

#### Seleção de município e estação
- [ ] Hook `useUFs()` chama `GET /v1/ufs`
- [ ] Hook `useMunicipios(uf)` chama `GET /v1/municipios?uf=XX`
- [ ] Hook `useEstacoes(uf, municipio)` chama `GET /v1/estacoes`
- [ ] Criar `UFSelector.tsx`: dropdown ou lista lateral
- [ ] Criar `MunicipioSelector.tsx`: lista filtrável por texto
- [ ] Criar `EstacaoSelector.tsx`: lista com código e nome
- [ ] Ao selecionar estação → centralizar mapa no ponto + mostrar `StationMarker`

#### Entrada por coordenada
- [ ] Criar `CoordForm.tsx`: campos latitude e longitude com validação
- [ ] Criar `CoordPicker.tsx`: clique no mapa para preencher lat/lon
- [ ] Ao confirmar coordenada → buscar equação mais próxima

#### Formulário de cálculo
- [ ] Criar `IDFForm.tsx` com React Hook Form + Zod
- [ ] Campos: duração (min), TR (anos), modo (LEGADO/MODERNO/AUTO)
- [ ] Validação: duração entre 5 e 1440 min, TR entre 2 e 100 anos
- [ ] Botão "Calcular" chama hook `useIDF()`

#### Resultado
- [ ] Hook `useIDF()` faz `POST /v1/idf/calculate` via TanStack Query
- [ ] Criar `IDFResultCard.tsx`: exibir intensidade, K, a, b, c, tipo_equacao
- [ ] Criar `InterpolationWarning.tsx`: aviso quando `interpolada: true`
- [ ] Criar `IDFTable.tsx`: tabela I × durações padrão × TRs padrão
- [ ] Estado global em `idf.store.ts` (Zustand)

---

## FASE 2 — Gráfico e Relatório

### Checklist

#### Gráfico IDF
- [ ] Criar `IDFChart.tsx` com Recharts `LineChart`
- [ ] Curvas: uma linha por TR (2, 5, 10, 25, 50, 100 anos)
- [ ] Eixo X: duração (min), Eixo Y: intensidade (mm/h)
- [ ] Tooltip com valor ao hover
- [ ] Toggle para mostrar/ocultar TRs específicos
- [ ] Comparar Legado vs. Moderno no mesmo gráfico (quando disponível)

#### Relatório PDF
- [ ] Criar `report.helpers.ts` com jsPDF
- [ ] Estrutura do relatório:
  - [ ] Cabeçalho: título, data, localidade
  - [ ] Seção de parâmetros: K, a, b, c, método, referência, versão
  - [ ] Tabela IDF completa
  - [ ] Gráfico (captura canvas do Recharts)
  - [ ] Rodapé: aviso de interpolação (se aplicável)
- [ ] Criar `ExportButtons.tsx`: botões PDF e JSON
- [ ] Botão JSON baixa o payload completo da API

#### Página de resultado
- [ ] Rota `/idf/result`
- [ ] Criar `ReportPreview.tsx` com preview do relatório na tela
- [ ] Botão "Novo cálculo" limpa store e volta para `/idf`

---

## FASE 3 — Autenticação e Rotas Admin

### Checklist

#### Autenticação
- [ ] Criar `auth.store.ts` com Zustand: token, user, role
- [ ] Criar `auth.service.ts`: `POST /v1/auth/login`
- [ ] Hook `useAuth()`: login, logout, isAdmin, isValidador
- [ ] Página `/auth/login`: formulário de e-mail e senha
- [ ] Middleware Next.js para proteger `/admin/*`
- [ ] Refresh de token automático via Axios interceptor

#### Dashboard admin
- [ ] Página `/admin`: cards com resumo (total equações, datasets staging, última atualização)
- [ ] Link para `/admin/datasets`, `/admin/import`, `/admin/audit`

#### Importação
- [ ] Página `/admin/import`
- [ ] Upload de XLSX com drag-and-drop
- [ ] Upload de PDF com campos assistidos (K, a, b, c, localidade, referência)
- [ ] Feedback de progresso e resumo pós-importação

#### Datasets e validação
- [ ] Página `/admin/datasets`: tabela com status (staging/publicado/deprecado)
- [ ] Página `/admin/datasets/[id]`: lista de equações do dataset
- [ ] Gráfico de curva IDF pré-visualizado por equação
- [ ] Botão "Aprovar equação", "Rejeitar", "Publicar dataset"
- [ ] Confirmação modal antes de publicar

#### Auditoria
- [ ] Página `/admin/audit`: timeline de atualizações
- [ ] Filtro por UF, dataset, usuário, período
- [ ] Exportar log em CSV

---

## FASE 4 — UX, Responsividade e Acessibilidade

### Checklist

#### Responsividade
- [ ] Layout adaptado para mobile: mapa em tela cheia + formulário em sheet/drawer
- [ ] Tabela IDF com scroll horizontal em telas pequenas
- [ ] Gráfico redimensionável com `ResponsiveContainer` do Recharts

#### Estados de UI
- [ ] Loading skeleton em todas as listas
- [ ] Spinner em botão "Calcular" durante chamada
- [ ] Mensagem de erro amigável (sem jargão técnico) em falhas de API
- [ ] Toast de sucesso ao exportar relatório

#### Acessibilidade
- [ ] Labels associados a todos os inputs
- [ ] Contraste de cores ≥ AA (WCAG 2.1)
- [ ] Navegação por teclado no mapa e formulários
- [ ] `aria-live` em mensagens de resultado

---

## FASE 5 — Testes e Deploy

### Checklist

#### Testes
- [ ] Testes unitários dos hooks: `useIDF`, `useUFs`, `useMunicipios`
- [ ] Testes de componente: `IDFForm`, `IDFResultCard`, `IDFTable`
- [ ] Teste e2e com Playwright: fluxo completo seleção → cálculo → relatório
- [ ] Validação visual: comparar tabela IDF gerada vs. Plúvio 2.1 desktop

#### Deploy
- [ ] `Dockerfile.frontend` build e push
- [ ] Deploy no Vercel com variáveis de ambiente configuradas
- [ ] Confirmar `NEXT_PUBLIC_API_URL` apontando para API em produção
- [ ] Testar fluxo completo em produção

---

*Pluvio Web 3.x — Plano Frontend v1.0 — 2026*
