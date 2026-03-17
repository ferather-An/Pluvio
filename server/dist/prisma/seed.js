"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const XLSX = __importStar(require("xlsx"));
const prisma = new client_1.PrismaClient();
const DEFAULT_REFERENCE_CODE = "SEM_REFERENCIA";
function toNumber(value) {
    if (value === null || value === undefined || value === "-") {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const normalized = value.toString().trim().replace(",", ".");
    if (!normalized) {
        return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
function resolveWorkbookPath() {
    if (process.env.IDF_XLSX_PATH && fs.existsSync(process.env.IDF_XLSX_PATH)) {
        return process.env.IDF_XLSX_PATH;
    }
    const docsFolder = "Documentação";
    const candidates = [
        path.resolve(process.cwd(), "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
        path.resolve(process.cwd(), "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
        path.resolve(process.cwd(), "..", "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
        path.resolve(process.cwd(), "..", "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
        path.resolve(__dirname, "..", "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
        path.resolve(__dirname, "..", "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error("Arquivo de equacoes nao encontrado. Defina IDF_XLSX_PATH no .env.");
}
function parseConsolidated(workbook) {
    const sheetEquations = workbook.Sheets["3_Consolidado_Completo"];
    const sheetReferences = workbook.Sheets["4_Referencias"];
    if (!sheetEquations || !sheetReferences) {
        throw new Error("Arquivo consolidado invalido: abas 3_Consolidado_Completo e 4_Referencias sao obrigatorias.");
    }
    const references = new Map();
    const refRows = XLSX.utils.sheet_to_json(sheetReferences, { defval: null, range: 1 });
    for (const row of refRows) {
        const code = (row["Código"] ?? "").toString().trim();
        if (!code) {
            continue;
        }
        references.set(code, {
            code,
            titulo: (row["Título"] ?? code).toString(),
            link: row["Fonte"] ? row["Fonte"].toString() : null,
            tipoFonte: "CONSOLIDADO",
        });
    }
    const rows = XLSX.utils.sheet_to_json(sheetEquations, { defval: null, range: 2 });
    const equations = [];
    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const uf = (row.UF ?? "").toString().trim().toUpperCase();
        const municipio = (row.Municipio ?? "").toString().trim();
        const estacaoRaw = row.Estacao ? row.Estacao.toString().trim() : "";
        const estacao = estacaoRaw || municipio;
        const K = toNumber(row.K);
        const a = toNumber(row.a);
        const b = toNumber(row.b);
        const c = toNumber(row.c);
        const latitude = toNumber(row.Lat);
        const longitude = toNumber(row.Lon);
        if (!uf || !municipio || K === null || a === null || b === null || c === null || latitude === null || longitude === null) {
            continue;
        }
        const referenceCode = (row.Referencia ?? DEFAULT_REFERENCE_CODE).toString().trim() || DEFAULT_REFERENCE_CODE;
        if (!references.has(referenceCode)) {
            references.set(referenceCode, {
                code: referenceCode,
                titulo: referenceCode,
                link: null,
                tipoFonte: "CONSOLIDADO",
            });
        }
        const codeValue = row.Cod_estacao === null || row.Cod_estacao === undefined || row.Cod_estacao === "-"
            ? null
            : row.Cod_estacao.toString();
        equations.push({
            uf,
            municipio,
            estacao,
            codigoEstacao: codeValue,
            agencia: row.Agencia ? row.Agencia.toString() : null,
            sourceSheet: "Consolidado",
            equationId: `CONSOLIDADO-${uf}-${i + 4}`,
            equationVersion: "pluvio_idf_equacoes_consolidado",
            latitude,
            longitude,
            anosDados: toNumber(row.N_anos),
            faixaDuracao: row.Faixa_duracao ? row.Faixa_duracao.toString() : null,
            r2: toNumber(row.R2),
            K,
            a,
            b,
            c,
            modo: row.Modo ? row.Modo.toString() : null,
            modelo: row.Modelo ? row.Modelo.toString() : null,
            metodo: row.Metodo ? row.Metodo.toString() : null,
            referenceCode,
        });
    }
    return {
        sourceName: "pluvio_idf_equacoes_consolidado",
        references: [...references.values()],
        equations,
    };
}
function parseLegacy(workbook) {
    const standardSheet = workbook.Sheets["Standard"];
    const disaggregationSheet = workbook.Sheets["Disaggregation"];
    const referenceSheet = workbook.Sheets["Reference list"];
    if (!standardSheet || !disaggregationSheet) {
        throw new Error("As abas 'Standard' e 'Disaggregation' sao obrigatorias no arquivo de equacoes.");
    }
    const references = new Map();
    const referenceRows = referenceSheet
        ? XLSX.utils.sheet_to_json(referenceSheet, { defval: null })
        : [];
    for (const row of referenceRows) {
        const key = (row.Code ?? "").toString().trim();
        if (!key) {
            continue;
        }
        references.set(key, {
            code: key,
            titulo: row.Reference ? row.Reference.toString() : key,
            link: row.Link ? row.Link.toString() : null,
            tipoFonte: "LEGADO",
        });
    }
    const equations = [];
    const parseSheet = (sheetName, sheet) => {
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const uf = (row.State ?? "").toString().trim().toUpperCase();
            const municipio = (row.Name ?? "").toString().trim();
            const K = toNumber(row.K);
            const a = toNumber(row.a);
            const b = toNumber(row.b);
            const c = toNumber(row.c);
            const latitude = toNumber(row["Latitude (º)"]);
            const longitude = toNumber(row["Longitude (º)"]);
            if (!uf || !municipio || K === null || a === null || b === null || c === null || latitude === null || longitude === null) {
                continue;
            }
            const referenceCode = (row.Reference ?? DEFAULT_REFERENCE_CODE).toString().trim() || DEFAULT_REFERENCE_CODE;
            if (!references.has(referenceCode)) {
                references.set(referenceCode, {
                    code: referenceCode,
                    titulo: referenceCode,
                    link: null,
                    tipoFonte: "LEGADO",
                });
            }
            const codeValue = row.Code === null || row.Code === undefined || row.Code === "-" ? null : row.Code.toString();
            equations.push({
                uf,
                municipio,
                estacao: municipio,
                codigoEstacao: codeValue,
                agencia: row.Agency ? row.Agency.toString() : null,
                sourceSheet: sheetName,
                equationId: `${sheetName}-${uf}-${i + 2}`,
                equationVersion: sheetName === "Standard" ? "idf_curves_brazil_standard" : "idf_curves_brazil_disaggregation",
                latitude,
                longitude,
                anosDados: toNumber(row.Years),
                faixaDuracao: row["Duration range"] ? row["Duration range"].toString() : null,
                r2: toNumber(row.R2),
                K,
                a,
                b,
                c,
                modo: sheetName === "Standard" ? "LEGADO" : "DESAGREGACAO",
                modelo: "SHERMAN",
                metodo: sheetName === "Standard" ? "Legacy workbook" : "Legacy workbook + disaggregation",
                referenceCode,
            });
        }
    };
    parseSheet("Standard", standardSheet);
    parseSheet("Disaggregation", disaggregationSheet);
    return {
        sourceName: "idf_curves_brazil",
        references: [...references.values()],
        equations,
    };
}
function chunkArray(values, size) {
    const chunks = [];
    for (let i = 0; i < values.length; i += size) {
        chunks.push(values.slice(i, i + size));
    }
    return chunks;
}
async function main() {
    const workbookPath = resolveWorkbookPath();
    const workbook = XLSX.readFile(workbookPath, { cellDates: false });
    const hasConsolidated = Boolean(workbook.Sheets["3_Consolidado_Completo"] && workbook.Sheets["4_Referencias"]);
    const parsed = hasConsolidated ? parseConsolidated(workbook) : parseLegacy(workbook);
    if (!parsed.references.some((item) => item.code === DEFAULT_REFERENCE_CODE)) {
        parsed.references.push({
            code: DEFAULT_REFERENCE_CODE,
            titulo: "Sem referencia",
            link: null,
            tipoFonte: "SISTEMA",
        });
    }
    const coverageByReference = new Map();
    for (const equation of parsed.equations) {
        const key = equation.referenceCode || DEFAULT_REFERENCE_CODE;
        if (!coverageByReference.has(key)) {
            coverageByReference.set(key, { totalEquacoes: 0, municipios: new Map() });
        }
        const coverage = coverageByReference.get(key);
        coverage.totalEquacoes += 1;
        const municipioKey = `${equation.uf}|${equation.municipio}`;
        if (!coverage.municipios.has(municipioKey)) {
            coverage.municipios.set(municipioKey, {
                uf: equation.uf,
                municipio: equation.municipio,
                estacoes: new Set(),
            });
        }
        coverage.municipios.get(municipioKey).estacoes.add(equation.estacao);
    }
    await prisma.dataset.updateMany({
        where: {
            nome: parsed.sourceName,
            status: client_1.DatasetStatus.PUBLISHED,
        },
        data: {
            status: client_1.DatasetStatus.DEPRECATED,
        },
    });
    const dataset = await prisma.dataset.create({
        data: {
            nome: parsed.sourceName,
            descricao: `Carga automatica a partir de ${path.basename(workbookPath)}`,
            origem: workbookPath,
            versao: new Date().toISOString(),
            status: client_1.DatasetStatus.PUBLISHED,
            publicadoEm: new Date(),
        },
    });
    await prisma.idfEquation.deleteMany({
        where: {
            equationVersion: {
                in: [...new Set(parsed.equations.map((item) => item.equationVersion))],
            },
        },
    });
    for (const reference of parsed.references) {
        const coverage = coverageByReference.get(reference.code);
        const municipios = coverage
            ? [...coverage.municipios.values()]
                .map((item) => ({
                uf: item.uf,
                municipio: item.municipio,
                estacoes: [...item.estacoes].sort(),
            }))
                .sort((a, b) => `${a.uf}-${a.municipio}`.localeCompare(`${b.uf}-${b.municipio}`))
            : [];
        await prisma.reference.upsert({
            where: { code: reference.code },
            update: {
                titulo: reference.titulo,
                link: reference.link,
                tipoFonte: reference.tipoFonte,
                totalMunicipios: municipios.length,
                totalEquacoes: coverage?.totalEquacoes ?? 0,
                municipios,
            },
            create: {
                code: reference.code,
                titulo: reference.titulo,
                link: reference.link,
                tipoFonte: reference.tipoFonte,
                totalMunicipios: municipios.length,
                totalEquacoes: coverage?.totalEquacoes ?? 0,
                municipios,
            },
        });
    }
    const equationBatches = chunkArray(parsed.equations, 500);
    for (const batch of equationBatches) {
        await prisma.idfEquation.createMany({
            data: batch.map((item) => ({
                datasetId: dataset.id,
                referenceCode: item.referenceCode,
                uf: item.uf,
                municipio: item.municipio,
                estacao: item.estacao,
                codigoEstacao: item.codigoEstacao,
                agencia: item.agencia,
                sourceSheet: item.sourceSheet,
                equationId: item.equationId,
                equationVersion: item.equationVersion,
                latitude: item.latitude,
                longitude: item.longitude,
                anosDados: item.anosDados ? Math.round(item.anosDados) : null,
                faixaDuracao: item.faixaDuracao,
                r2: item.r2,
                K: item.K,
                a: item.a,
                b: item.b,
                c: item.c,
                modo: item.modo,
                modelo: item.modelo,
                metodo: item.metodo,
                status: client_1.DatasetStatus.PUBLISHED,
            })),
        });
    }
    await prisma.updateLog.create({
        data: {
            acao: "IMPORT_DATASET",
            entidade: "dataset",
            entidadeId: dataset.id,
            usuario: "seed",
            detalhes: {
                arquivo: workbookPath,
                sourceName: parsed.sourceName,
                references: parsed.references.length,
                equations: parsed.equations.length,
                status: "PUBLISHED",
            },
        },
    });
    console.log(`[seed] concluido: source=${parsed.sourceName}, referencias=${parsed.references.length}, equacoes=${parsed.equations.length}`);
}
main()
    .catch((error) => {
    console.error("[seed] erro:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map