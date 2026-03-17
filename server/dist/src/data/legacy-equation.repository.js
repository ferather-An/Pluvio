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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LegacyEquationRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyEquationRepository = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const XLSX = __importStar(require("xlsx"));
let LegacyEquationRepository = LegacyEquationRepository_1 = class LegacyEquationRepository {
    constructor() {
        this.logger = new common_1.Logger(LegacyEquationRepository_1.name);
        const data = this.loadFromWorkbook();
        this.equations = data.equations;
        this.references = data.references;
        const bySource = this.equations.reduce((acc, item) => {
            acc[item.sourceSheet] = (acc[item.sourceSheet] ?? 0) + 1;
            return acc;
        }, {});
        this.logger.log(`Equacoes carregadas: total=${this.equations.length}, fontes=${JSON.stringify(bySource)}, referencias=${this.references.size}`);
    }
    listUFs() {
        return [...new Set(this.equations.map((item) => item.uf))].sort();
    }
    listMunicipios(uf) {
        const ufValue = uf.toUpperCase();
        return [
            ...new Set(this.equations.filter((item) => item.uf === ufValue).map((item) => item.municipio)),
        ].sort();
    }
    listEstacoes(uf, municipio) {
        const ufNorm = uf ? uf.toUpperCase() : null;
        const municipioNorm = municipio ? this.normalizeText(municipio) : null;
        return this.equations.filter((item) => {
            const ufOk = ufNorm ? item.uf === ufNorm : true;
            const municipioOk = municipioNorm ? this.normalizeText(item.municipio) === municipioNorm : true;
            return ufOk && municipioOk;
        });
    }
    listReferences() {
        return [...this.references.values()].sort((a, b) => a.code.localeCompare(b.code));
    }
    findReferenceByCode(code) {
        return this.references.get(code.trim()) ?? null;
    }
    findById(id) {
        return this.equations.find((item) => item.id === id) ?? null;
    }
    findBestMatch(input) {
        const ufValue = input.uf.toUpperCase();
        const inMunicipio = input.municipio ? this.normalizeText(input.municipio) : null;
        const inEstacao = input.estacao ? this.normalizeText(input.estacao) : null;
        const preferredSheets = input.preferredSheets ?? ["Consolidado", "Standard", "Disaggregation"];
        const requestedMode = (input.modo ?? "AUTO").toUpperCase();
        const ordered = [...this.equations].sort((a, b) => {
            const aPriority = preferredSheets.indexOf(a.sourceSheet);
            const bPriority = preferredSheets.indexOf(b.sourceSheet);
            const aRank = aPriority < 0 ? 999 : aPriority;
            const bRank = bPriority < 0 ? 999 : bPriority;
            if (aRank !== bRank) {
                return aRank - bRank;
            }
            const aModeRank = this.getModeRank(a.modo, requestedMode);
            const bModeRank = this.getModeRank(b.modo, requestedMode);
            if (aModeRank !== bModeRank) {
                return aModeRank - bModeRank;
            }
            return b.years - a.years;
        });
        if (inEstacao) {
            const byStation = ordered.find((item) => item.uf === ufValue && this.normalizeText(item.estacao) === inEstacao);
            if (byStation) {
                return byStation;
            }
        }
        if (inMunicipio) {
            const byMunicipio = ordered.find((item) => item.uf === ufValue && this.normalizeText(item.municipio) === inMunicipio);
            if (byMunicipio) {
                return byMunicipio;
            }
        }
        return ordered.find((item) => item.uf === ufValue) ?? null;
    }
    getModeRank(modeValue, requestedMode) {
        const mode = (modeValue ?? "").toUpperCase();
        if (requestedMode === "LEGADO") {
            return mode === "LEGADO" ? 0 : 1;
        }
        if (requestedMode === "MODERNO") {
            return mode === "MODERNO" ? 0 : 1;
        }
        if (mode === "MODERNO") {
            return 0;
        }
        if (mode === "LEGADO") {
            return 1;
        }
        return 2;
    }
    loadFromWorkbook() {
        const workbookPath = this.resolveWorkbookPath();
        const workbook = XLSX.readFile(workbookPath, { cellDates: false });
        const consolidatedSheet = workbook.Sheets["3_Consolidado_Completo"];
        const consolidatedRefSheet = workbook.Sheets["4_Referencias"];
        if (consolidatedSheet && consolidatedRefSheet) {
            return this.loadConsolidated(workbook);
        }
        return this.loadLegacyWorkbook(workbook);
    }
    loadConsolidated(workbook) {
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
                title: row["Título"] ? row["Título"].toString() : null,
                link: row["Fonte"] ? row["Fonte"].toString() : null,
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
            const K = this.toNumber(row.K);
            const a = this.toNumber(row.a);
            const b = this.toNumber(row.b);
            const c = this.toNumber(row.c);
            const latitude = this.toNumber(row.Lat);
            const longitude = this.toNumber(row.Lon);
            if (!uf || !municipio || K === null || a === null || b === null || c === null || latitude === null || longitude === null) {
                continue;
            }
            const referenceCode = (row.Referencia ?? "SEM_REFERENCIA").toString().trim();
            const referenceMeta = references.get(referenceCode);
            const codeValue = row.Cod_estacao === null || row.Cod_estacao === undefined || row.Cod_estacao === "-"
                ? null
                : row.Cod_estacao.toString();
            equations.push({
                id: `CONSOLIDADO-${uf}-${i + 4}`,
                sourceSheet: "Consolidado",
                uf,
                agency: row.Agencia ? row.Agencia.toString() : null,
                code: codeValue,
                municipio,
                estacao,
                latitude,
                longitude,
                years: this.toNumber(row.N_anos) ?? 0,
                K,
                a,
                b,
                c,
                r2: this.toNumber(row.R2),
                durationRange: row.Faixa_duracao ? row.Faixa_duracao.toString() : null,
                referenceCode,
                referenceTitle: referenceMeta?.title ?? null,
                referenceLink: referenceMeta?.link ?? null,
                disaggregationCoefficients: null,
                disaggregationReferenceCode: null,
                disaggregationReferenceTitle: null,
                disaggregationReferenceLink: null,
                equationVersion: "pluvio_idf_equacoes_consolidado",
                modo: row.Modo ? row.Modo.toString() : null,
                modelo: row.Modelo ? row.Modelo.toString() : null,
                metodo: row.Metodo ? row.Metodo.toString() : null,
            });
        }
        return { equations, references };
    }
    loadLegacyWorkbook(workbook) {
        const standardSheet = workbook.Sheets["Standard"];
        const disaggregationSheet = workbook.Sheets["Disaggregation"];
        const referenceSheet = workbook.Sheets["Reference list"];
        if (!standardSheet || !disaggregationSheet) {
            throw new Error("As abas 'Standard' e 'Disaggregation' sao obrigatorias no arquivo de equacoes.");
        }
        const referenceRows = referenceSheet
            ? XLSX.utils.sheet_to_json(referenceSheet, { defval: null })
            : [];
        const references = new Map();
        for (const row of referenceRows) {
            const key = (row.Code ?? "").toString().trim();
            if (!key) {
                continue;
            }
            references.set(key, {
                code: key,
                title: row.Reference ? row.Reference.toString() : null,
                link: row.Link ? row.Link.toString() : null,
            });
        }
        const equations = [];
        equations.push(...this.parseLegacySheet("Standard", standardSheet, references));
        equations.push(...this.parseLegacySheet("Disaggregation", disaggregationSheet, references));
        return { equations, references };
    }
    parseLegacySheet(sourceSheet, worksheet, references) {
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        const equations = [];
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const uf = (row.State ?? "").toString().trim().toUpperCase();
            const municipio = (row.Name ?? "").toString().trim();
            const K = this.toNumber(row.K);
            const a = this.toNumber(row.a);
            const b = this.toNumber(row.b);
            const c = this.toNumber(row.c);
            const latitude = this.toNumber(row["Latitude (º)"]);
            const longitude = this.toNumber(row["Longitude (º)"]);
            if (!uf || !municipio || K === null || a === null || b === null || c === null || latitude === null || longitude === null) {
                continue;
            }
            const referenceCode = (row.Reference ?? "SEM_REFERENCIA").toString().trim();
            const referenceMeta = references.get(referenceCode);
            const disaggregationReferenceCode = row["Disaggregation reference"]
                ? row["Disaggregation reference"].toString().trim()
                : null;
            const disaggregationMeta = disaggregationReferenceCode
                ? references.get(disaggregationReferenceCode)
                : null;
            const codeValue = row.Code === null || row.Code === undefined || row.Code === "-" ? null : row.Code.toString();
            equations.push({
                id: `${sourceSheet}-${uf}-${i + 2}`,
                sourceSheet,
                uf,
                agency: row.Agency ? row.Agency.toString() : null,
                code: codeValue,
                municipio,
                estacao: municipio,
                latitude,
                longitude,
                years: this.toNumber(row.Years) ?? 0,
                K,
                a,
                b,
                c,
                r2: this.toNumber(row.R2),
                durationRange: row["Duration range"] ? row["Duration range"].toString() : null,
                referenceCode,
                referenceTitle: referenceMeta?.title ?? null,
                referenceLink: referenceMeta?.link ?? null,
                disaggregationCoefficients: row["Disaggregation coefficients"]
                    ? row["Disaggregation coefficients"].toString()
                    : null,
                disaggregationReferenceCode,
                disaggregationReferenceTitle: disaggregationMeta?.title ?? null,
                disaggregationReferenceLink: disaggregationMeta?.link ?? null,
                equationVersion: sourceSheet === "Standard"
                    ? "idf_curves_brazil_standard"
                    : "idf_curves_brazil_disaggregation",
                modo: sourceSheet === "Standard" ? "LEGADO" : "DESAGREGACAO",
                modelo: "SHERMAN",
                metodo: sourceSheet === "Standard" ? "Legacy workbook" : "Legacy workbook + disaggregation",
            });
        }
        return equations;
    }
    resolveWorkbookPath() {
        if (process.env.IDF_XLSX_PATH && fs.existsSync(process.env.IDF_XLSX_PATH)) {
            return process.env.IDF_XLSX_PATH;
        }
        const docsFolder = "Documentação";
        const candidates = [
            path.resolve(process.cwd(), "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
            path.resolve(process.cwd(), "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
            path.resolve(process.cwd(), "..", "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
            path.resolve(process.cwd(), "..", "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
            path.resolve(__dirname, "..", "..", "..", "..", docsFolder, "Relatórios", "pluvio_idf_equacoes_consolidado.xlsx"),
            path.resolve(__dirname, "..", "..", "..", "..", docsFolder, "Equações", "IDF_Curves_Brazil.xlsx"),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        throw new Error("Arquivo de equacoes nao encontrado. Defina IDF_XLSX_PATH no .env.");
    }
    toNumber(value) {
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
    normalizeText(value) {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
};
exports.LegacyEquationRepository = LegacyEquationRepository;
exports.LegacyEquationRepository = LegacyEquationRepository = LegacyEquationRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LegacyEquationRepository);
//# sourceMappingURL=legacy-equation.repository.js.map