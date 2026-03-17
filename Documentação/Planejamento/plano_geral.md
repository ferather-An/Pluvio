# Pluvio Web 3.x â€” Plano Geral de Desenvolvimento

> **Autor:** AndrÃ© Phillipe dos Santos Batista  
> **VersÃ£o:** 1.0 â€” 2026  
> **Objetivo:** Reescrever o PlÃºvio 2.1 como plataforma web pÃºblica com motor IDF atualizado, API REST, banco versionado e interface geogrÃ¡fica interativa.

---

## VisÃ£o Geral das Etapas

| Fase | Nome                                 | EntregÃ¡vel principal                  | Status |
| ---- | ------------------------------------ | ------------------------------------- | ------ |
| 0    | Setup e infraestrutura base          | Ambiente rodando localmente           | [~]    |
| 1    | Paridade funcional com Pluvio 2.1    | Modo legado funcionando na web        | [~]    |
| 2    | Banco de dados e importacao de dados | Equacoes migradas + pipeline XLSX     | [~]    |
| 3    | API publica v1                       | Endpoints documentados e testados     | [~]    |
| 4    | Motor moderno                        | GEV, desagregaÃ§Ã£o, interpolaÃ§Ã£o       | [ ]    |
| 5    | Frontend web completo                | Interface com mapa e relatÃ³rio        | [ ]    |
| 6    | Worker de ingestÃ£o                   | HidroWeb, INMET, CHIRPS automatizados | [ ]    |
| 7    | Admin e governanÃ§a                   | Painel de validaÃ§Ã£o e publicaÃ§Ã£o      | [ ]    |
| 8    | Testes, docs e deploy                | ProduÃ§Ã£o, OpenAPI, documentaÃ§Ã£o       | [ ]    |

---


### Legenda de Status
- [ ] nao iniciado
- [~] em andamento
- [x] concluido

### Atualizacao de Status (20/02/2026)
- Fase 0: estrutura base criada para frontend (Next.js) e backend (NestJS), com /health no backend.
- Fase 1: endpoints legados principais ativos (/v1/ufs, /v1/municipios, /v1/estacoes, /v1/idf/calculate).
- Fase 2: leitura de equacoes via IDF_Curves_Brazil.xlsx implementada (abas Standard, Disaggregation e Reference list).
- Fase 3: endpoint GET /v1/idf/equations/:id e modulo de referencias (GET /v1/references, GET /v1/references/:code).
- Pendencia atual: validacao runtime dos endpoints e inicio da camada de dataset versionado.

## FASE 0 â€” Setup e Infraestrutura Base

### Objetivo
Ter o ambiente de desenvolvimento 100% funcional antes de escrever qualquer lÃ³gica de negÃ³cio.

### Checklist

#### RepositÃ³rio e estrutura
- [ ] Criar repositÃ³rio Git (mono-repo ou multi-repo)
- [ ] Criar estrutura de pastas: `/server`, `/frontend`, `/motor`, `/docs`, `/credentials`
- [ ] Adicionar `.gitignore` global (Node, Python, .env, storage)
- [ ] Criar `README.md` raiz com visÃ£o geral do projeto

#### Docker e banco
- [ ] Copiar `docker-compose.yml` e `.env.example` para a raiz
- [ ] Criar `.env` local com as variÃ¡veis preenchidas
- [ ] Subir `docker compose up -d` e validar containers: db, redis
- [ ] Confirmar PostGIS ativo: `SELECT PostGIS_Version();`
- [ ] Testar conexÃ£o com pgAdmin ou DBeaver

#### Backend base
- [ ] Inicializar projeto NestJS: `nest new server`
- [ ] Instalar dependÃªncias do `package.backend.json`
- [ ] Configurar Prisma: `prisma init` + colar `schema.prisma`
- [ ] Rodar `prisma migrate dev --name init`
- [ ] Rodar `prisma generate`
- [ ] Confirmar tabelas criadas no banco
- [ ] Criar endpoint `/health` retornando `{ status: "ok" }`

#### Motor Python base
- [ ] Criar pasta `/motor` com `main.py`
- [ ] Instalar dependÃªncias do `requirements.motor.txt`
- [ ] Criar endpoint `/health` FastAPI retornando `{ status: "ok" }`
- [ ] Dockerizar e confirmar comunicaÃ§Ã£o API â†” Motor

#### Frontend base
- [ ] Inicializar Next.js: `npx create-next-app@latest frontend`
- [ ] Instalar dependÃªncias do `package.frontend.json`
- [ ] Configurar Tailwind CSS
- [ ] Criar pÃ¡gina inicial com tÃ­tulo "Pluvio Web 3.x"
- [ ] Confirmar comunicaÃ§Ã£o com a API via `NEXT_PUBLIC_API_URL`

---

## FASE 1 â€” Paridade Funcional com PlÃºvio 2.1 (Modo Legado)

### Objetivo
Replicar exatamente o comportamento do PlÃºvio 2.1 desktop na web, sem adicionar nenhuma funcionalidade nova ainda.

### Checklist

#### Dados legados
- [ ] Carregar equaÃ§Ãµes originais do PlÃºvio 2.1 (K, a, b, c) via seed SQL
- [ ] Cobrir estados originais: MG, SP, PR, RJ, ES, BA, TO
- [ ] Associar cada equaÃ§Ã£o a `reference_code = "FIORIO_2012"` e `modo = LEGADO`
- [ ] Validar contagem de localidades carregadas vs. original

#### Motor legado
- [ ] Implementar `legacy_calculator.py`: fÃ³rmula Sherman `I = K * TR^a / (t + b)^c`
- [ ] Validar resultado para localidade conhecida (ex.: ViÃ§osa-MG, t=60, TR=25)
- [ ] Implementar seleÃ§Ã£o de equaÃ§Ã£o: por estaÃ§Ã£o â†’ municÃ­pio â†’ UF
- [ ] Implementar aviso de interpolaÃ§Ã£o quando equaÃ§Ã£o local nÃ£o existe

#### API legado
- [ ] `GET /v1/ufs` â€” lista de UFs com equaÃ§Ãµes disponÃ­veis
- [ ] `GET /v1/municipios?uf=MG` â€” municÃ­pios/estaÃ§Ãµes por UF
- [ ] `POST /v1/idf/calculate` â€” corpo mÃ­nimo: uf, municipio, duracao, TR, modo=LEGADO
- [ ] Validar retorno: intensidade, K, a, b, c, tipo_equacao, reference_code

#### Frontend legado
- [ ] Tela de seleÃ§Ã£o de UF (lista ou mapa simples)
- [ ] Tela de seleÃ§Ã£o de municÃ­pio/estaÃ§Ã£o
- [ ] FormulÃ¡rio de cÃ¡lculo: duraÃ§Ã£o (min) e TR (anos)
- [ ] ExibiÃ§Ã£o de resultado: intensidade, K, a, b, c
- [ ] Exibir aviso quando usar interpolaÃ§Ã£o

---

## FASE 2 â€” Banco de Dados e Pipeline de ImportaÃ§Ã£o

### Objetivo
Estruturar o banco versionado e criar o pipeline que importa planilhas XLSX e PDFs tÃ©cnicos.

### Checklist

#### Banco versionado
- [ ] Confirmar tabelas: `idf_equation`, `dataset`, `reference`, `update_log`
- [ ] Implementar enum `DatasetStatus`: staging â†’ publicado â†’ deprecado
- [ ] Implementar lÃ³gica de versionamento: publicar depreca versÃ£o anterior
- [ ] Criar seed de referÃªncias bibliogrÃ¡ficas base (FIORIO_2012, NBR10844, etc.)

#### ImportaÃ§Ã£o XLSX
- [ ] Implementar `DatasetService.importXLSX(arquivo)`
- [ ] Parsear colunas: UF, municÃ­pio, estaÃ§Ã£o, K, a, b, c, duraÃ§Ã£o, TR, referÃªncia
- [ ] Tratar erros de linha (logar e continuar)
- [ ] Inserir em `idf_equation` com `status = staging`
- [ ] Retornar resumo: total importado, erros, dataset_id

#### ImportaÃ§Ã£o PDF
- [ ] Implementar `DatasetService.importPDF(arquivo)`
- [ ] Salvar PDF no storage e criar registro em `reference`
- [ ] Tela admin de cadastro manual assistido: operador preenche K, a, b, c + fonte
- [ ] Associar equaÃ§Ã£o ao PDF como referÃªncia

#### Auditoria
- [ ] Registrar cada importaÃ§Ã£o em `update_log`
- [ ] Registrar publicaÃ§Ã£o em `update_log` com usuÃ¡rio e timestamp
- [ ] Endpoint `GET /v1/admin/audit` retorna histÃ³rico paginado

---

## FASE 3 â€” API PÃºblica v1

### Objetivo
Publicar a API REST documentada, com rate limit, API key e swagger disponÃ­vel.

### Checklist

#### Endpoints pÃºblicos
- [ ] `GET /v1/ufs`
- [ ] `GET /v1/municipios?uf=XX`
- [ ] `GET /v1/estacoes?uf=XX&municipio=YYY`
- [ ] `POST /v1/idf/calculate` (modo AUTO, LEGADO ou MODERNO)
- [ ] `GET /v1/idf/equations/{id}`
- [ ] `GET /v1/references/{code}`

#### SeguranÃ§a e controle
- [ ] Implementar rate limiting via Redis + `@nestjs/throttler`
- [ ] Implementar API Key para uso externo (header `x-api-key`)
- [ ] Implementar JWT + RBAC para rotas `/admin`
- [ ] Criar papÃ©is: ADMIN, VALIDADOR, READONLY

#### DocumentaÃ§Ã£o
- [ ] Configurar Swagger (`@nestjs/swagger`) em `/api/docs`
- [ ] Documentar todos os DTOs de entrada e saÃ­da
- [ ] Documentar exemplos de payload (incluindo resposta com flags de interpolaÃ§Ã£o)
- [ ] Exportar `openapi.json` para uso em clientes externos

#### Testes da API
- [ ] Testes unitÃ¡rios do `IDFService`
- [ ] Testes e2e dos endpoints principais com Supertest
- [ ] Validar retorno de `equation_id`, `equation_version`, `reference_code` em todos os cÃ¡lculos

---

## FASE 4 â€” Motor Moderno (GEV, DesagregaÃ§Ã£o, InterpolaÃ§Ã£o)

### Objetivo
Ativar os mÃ©todos hidrolÃ³gicos modernos no motor Python.

### Checklist

#### GEV e LH-Moments
- [ ] Implementar `ajustar_gev(serie)` com SciPy `genextreme`
- [ ] Implementar `calcular_quantil_gev(params, TR)` 
- [ ] Implementar ajuste por LH-Moments como alternativa
- [ ] Validar resultados contra sÃ©ries de referÃªncia da literatura
- [ ] Comparar GEV vs. Sherman para localidades com ambas as equaÃ§Ãµes

#### DesagregaÃ§Ã£o de chuva diÃ¡ria
- [ ] Implementar mÃ©todo CETESB/Marques (coeficientes clÃ¡ssicos brasileiros)
- [ ] Implementar mÃ©todo Kimball
- [ ] Implementar mÃ©todo Knoessen
- [ ] Validar para diferentes duraÃ§Ãµes: 5, 10, 15, 30, 60, 120, 240 min

#### InterpolaÃ§Ã£o espacial
- [ ] Implementar IDW (potÃªncia 5, configurÃ¡vel por regra)
- [ ] Implementar Kriging OrdinÃ¡rio via PyKrige ou PySAL
- [ ] Buscar N estaÃ§Ãµes vizinhas dentro de raio configurÃ¡vel por UF
- [ ] Retornar flag `interpolada: true` + distÃ¢ncia mÃ©dia no resultado
- [ ] Registrar qual regra de interpolaÃ§Ã£o foi usada no payload

#### IntegraÃ§Ã£o API â†” Motor
- [ ] API NestJS chama Motor Python via HTTP interno (ou fila)
- [ ] Motor recebe request com sÃ©rie ou parÃ¢metros e retorna resultado
- [ ] Tratar timeout e fallback para modo legado se motor moderno falhar

---

## FASE 5 â€” Frontend Web Completo

### Objetivo
Interface profissional com mapa interativo, seleÃ§Ã£o geogrÃ¡fica, cÃ¡lculo e relatÃ³rio exportÃ¡vel.

### Checklist

#### Mapa e seleÃ§Ã£o geogrÃ¡fica
- [ ] Integrar React-Leaflet com camada do Brasil por UF
- [ ] Ao clicar em UF â†’ listar municÃ­pios/estaÃ§Ãµes
- [ ] Campo de busca por nome de municÃ­pio
- [ ] Campo de entrada de lat/lon + marcador no mapa
- [ ] Destacar estaÃ§Ã£o selecionada no mapa

#### FormulÃ¡rio e cÃ¡lculo
- [ ] Campos: duraÃ§Ã£o (min), TR (anos), modo (LEGADO/MODERNO/AUTO)
- [ ] ValidaÃ§Ã£o com Zod + React Hook Form
- [ ] Exibir K, a, b, c da equaÃ§Ã£o selecionada (modo legado)
- [ ] Exibir tipo de equaÃ§Ã£o: LOCAL / INTERPOLADA / EXTRAPOLADA
- [ ] Exibir aviso com distÃ¢ncia Ã  estaÃ§Ã£o mais prÃ³xima (quando interpolado)

#### Resultados e curvas
- [ ] Tabela de intensidades: I (mm/h) Ã— duraÃ§Ã£o Ã— TR
- [ ] GrÃ¡fico de curvas IDF com Recharts
- [ ] Alternar entre mm/h e mm/min
- [ ] Comparar Modo Legado vs. Moderno no mesmo grÃ¡fico (quando disponÃ­vel)

#### RelatÃ³rio exportÃ¡vel
- [ ] BotÃ£o "Exportar PDF" com jsPDF
- [ ] RelatÃ³rio contÃ©m: localidade, equaÃ§Ã£o, parÃ¢metros, tabela IDF, referÃªncia, versÃ£o
- [ ] BotÃ£o "Exportar JSON" com payload completo do cÃ¡lculo

#### UX e responsividade
- [ ] Layout responsivo (mobile e desktop)
- [ ] Loading states em todas as chamadas Ã  API
- [ ] Mensagens de erro amigÃ¡veis
- [ ] Favicon e identidade visual mÃ­nima

---

## FASE 6 â€” Worker de IngestÃ£o de Dados

### Objetivo
Automatizar a ingestÃ£o de dados de HidroWeb (ANA), INMET e CHIRPS.

### Checklist

#### HidroWeb ANA
- [ ] Implementar cliente Python para API HidroWeb
- [ ] Buscar lista de estaÃ§Ãµes pluviomÃ©tricas por UF
- [ ] Baixar sÃ©ries histÃ³ricas de precipitaÃ§Ã£o mÃ¡xima anual
- [ ] Salvar sÃ©ries brutas em storage e registrar em `dataset`
- [ ] Acionar motor para calcular equaÃ§Ãµes IDF com sÃ©ries baixadas

#### INMET
- [ ] Implementar cliente para API INMET
- [ ] Baixar dados de estaÃ§Ãµes automÃ¡ticas e convencionais
- [ ] Integrar ao pipeline de ingestÃ£o existente

#### CHIRPS (Google Earth Engine)
- [ ] Configurar autenticaÃ§Ã£o GEE com service account
- [ ] Script Python para extrair sÃ©ries CHIRPS por ponto (lat/lon)
- [ ] Validar correlaÃ§Ã£o com dados de estaÃ§Ã£o (r â‰¥ 0,83)
- [ ] Usar CHIRPS para regiÃµes sem cobertura de estaÃ§Ã£o convencional

#### Scheduler
- [ ] Configurar Celery Beat para agendamento de tarefas
- [ ] Tarefa semanal: verificar novas sÃ©ries disponÃ­veis no HidroWeb
- [ ] Tarefa mensal: atualizar CHIRPS para regiÃµes sem estaÃ§Ã£o
- [ ] Log de execuÃ§Ã£o em `update_log`

---

## FASE 7 â€” Painel Admin e GovernanÃ§a

### Objetivo
Interface administrativa para importar, validar e publicar equaÃ§Ãµes com rastreabilidade total.

### Checklist

#### AutenticaÃ§Ã£o admin
- [ ] Tela de login com JWT
- [ ] ProteÃ§Ã£o de rotas admin no frontend
- [ ] Gerenciamento de usuÃ¡rios (ADMIN pode criar VALIDADOR)

#### Painel de datasets
- [ ] Listar datasets em staging com resumo (total equaÃ§Ãµes, origem, data)
- [ ] Visualizar equaÃ§Ãµes de um dataset: tabela com K, a, b, c, localidade
- [ ] GrÃ¡fico de curva IDF prÃ©-visualizado por equaÃ§Ã£o
- [ ] Aprovar ou rejeitar equaÃ§Ã£o individual
- [ ] Publicar dataset completo (com confirmaÃ§Ã£o)

#### HistÃ³rico e auditoria
- [ ] Timeline de atualizaÃ§Ãµes por UF/municÃ­pio
- [ ] Comparar versÃ£o atual vs. anterior da equaÃ§Ã£o
- [ ] Exportar log de auditoria em CSV

---

## FASE 8 â€” Testes, DocumentaÃ§Ã£o e Deploy

### Objetivo
Garantir qualidade, documentar e colocar em produÃ§Ã£o.

### Checklist

#### Testes
- [ ] Cobertura de testes unitÃ¡rios â‰¥ 80% (backend)
- [ ] Testes e2e dos fluxos principais (cÃ¡lculo, importaÃ§Ã£o, relatÃ³rio)
- [ ] Teste de carga bÃ¡sico na API (k6 ou Artillery)
- [ ] ValidaÃ§Ã£o cruzada: resultado Pluvio Web vs. PlÃºvio 2.1 desktop (mesma localidade)

#### DocumentaÃ§Ã£o
- [ ] `README.md` completo em `/server`, `/frontend`, `/motor`
- [ ] Swagger disponÃ­vel em `/api/docs`
- [ ] DocumentaÃ§Ã£o acadÃªmica: seÃ§Ã£o de Metodologia atualizada com arquitetura final
- [ ] Changelog de versÃµes

#### Deploy
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Deploy backend + motor em Railway ou Render
- [ ] Deploy frontend em Vercel
- [ ] Banco PostgreSQL gerenciado (Supabase, Railway ou Neon)
- [ ] Redis gerenciado (Upstash)
- [ ] Configurar domÃ­nio e HTTPS
- [ ] Monitoramento bÃ¡sico (UptimeRobot ou BetterStack)

---

## DependÃªncias entre Fases

```mermaid
flowchart LR
  F0["Fase 0\nSetup"] --> F1["Fase 1\nModo Legado"]
  F0 --> F2["Fase 2\nBanco + Pipeline"]
  F1 --> F3["Fase 3\nAPI PÃºblica"]
  F2 --> F3
  F3 --> F4["Fase 4\nMotor Moderno"]
  F3 --> F5["Fase 5\nFrontend"]
  F4 --> F5
  F2 --> F6["Fase 6\nWorker IngestÃ£o"]
  F3 --> F7["Fase 7\nAdmin"]
  F5 --> F7
  F4 --> F8["Fase 8\nDeploy"]
  F5 --> F8
  F6 --> F8
  F7 --> F8
```

---

*Pluvio Web 3.x â€” Plano Geral v1.0 â€” 2026*

