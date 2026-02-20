import { Injectable, Logger } from "@nestjs/common";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

export type LegacyEquation = {
  id: string;
  sourceSheet: "Standard" | "Disaggregation";
  uf: string;
  agency: string | null;
  code: string | null;
  municipio: string;
  estacao: string;
  latitude: number;
  longitude: number;
  years: number;
  K: number;
  a: number;
  b: number;
  c: number;
  r2: number | null;
  durationRange: string | null;
  referenceCode: string;
  referenceTitle: string | null;
  referenceLink: string | null;
  disaggregationCoefficients: string | null;
  disaggregationReferenceCode: string | null;
  disaggregationReferenceTitle: string | null;
  disaggregationReferenceLink: string | null;
  equationVersion: string;
};

type RowEquation = {
  State?: string;
  Agency?: string;
  Code?: string | number;
  Name?: string;
  "Latitude (º)"?: string | number;
  "Longitude (º)"?: string | number;
  Years?: string | number;
  K?: string | number;
  a?: string | number;
  b?: string | number;
  c?: string | number;
  R2?: string | number;
  "Duration range"?: string;
  Reference?: string;
  "Disaggregation coefficients"?: string;
  "Disaggregation reference"?: string;
};

type RowReference = {
  Code?: string;
  Reference?: string;
  Link?: string;
};

@Injectable()
export class LegacyEquationRepository {
  private readonly logger = new Logger(LegacyEquationRepository.name);
  private readonly equations: LegacyEquation[];

  constructor() {
    this.equations = this.loadFromWorkbook();
    const standardCount = this.equations.filter((eq) => eq.sourceSheet === "Standard").length;
    const disaggregationCount = this.equations.filter((eq) => eq.sourceSheet === "Disaggregation").length;
    this.logger.log(
      `Equacoes carregadas: total=${this.equations.length}, standard=${standardCount}, disaggregation=${disaggregationCount}`,
    );
  }

  listUFs() {
    return [...new Set(this.equations.map((item) => item.uf))].sort();
  }

  listMunicipios(uf: string) {
    const ufValue = uf.toUpperCase();
    return [
      ...new Set(this.equations.filter((item) => item.uf === ufValue).map((item) => item.municipio)),
    ].sort();
  }

  listEstacoes(uf?: string, municipio?: string) {
    const ufNorm = uf ? uf.toUpperCase() : null;
    const municipioNorm = municipio ? this.normalizeText(municipio) : null;

    return this.equations.filter((item) => {
      const ufOk = ufNorm ? item.uf === ufNorm : true;
      const municipioOk = municipioNorm ? this.normalizeText(item.municipio) === municipioNorm : true;
      return ufOk && municipioOk;
    });
  }

  findById(id: string) {
    return this.equations.find((item) => item.id === id) ?? null;
  }

  findBestMatch(input: {
    uf: string;
    municipio?: string;
    estacao?: string;
    preferredSheets?: Array<"Standard" | "Disaggregation">;
  }) {
    const ufValue = input.uf.toUpperCase();
    const inMunicipio = input.municipio ? this.normalizeText(input.municipio) : null;
    const inEstacao = input.estacao ? this.normalizeText(input.estacao) : null;
    const preferredSheets = input.preferredSheets ?? ["Standard", "Disaggregation"];

    const ordered = [...this.equations].sort((a, b) => {
      const aPriority = preferredSheets.indexOf(a.sourceSheet);
      const bPriority = preferredSheets.indexOf(b.sourceSheet);
      const aRank = aPriority < 0 ? 999 : aPriority;
      const bRank = bPriority < 0 ? 999 : bPriority;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return b.years - a.years;
    });

    if (inEstacao) {
      const byStation = ordered.find(
        (item) => item.uf === ufValue && this.normalizeText(item.estacao) === inEstacao,
      );
      if (byStation) {
        return byStation;
      }
    }

    if (inMunicipio) {
      const byMunicipio = ordered.find(
        (item) => item.uf === ufValue && this.normalizeText(item.municipio) === inMunicipio,
      );
      if (byMunicipio) {
        return byMunicipio;
      }
    }

    return ordered.find((item) => item.uf === ufValue) ?? null;
  }

  private loadFromWorkbook() {
    const workbookPath = this.resolveWorkbookPath();
    const workbook = XLSX.readFile(workbookPath, { cellDates: false });

    const standardSheet = workbook.Sheets["Standard"];
    const disaggregationSheet = workbook.Sheets["Disaggregation"];
    const referenceSheet = workbook.Sheets["Reference list"];

    if (!standardSheet || !disaggregationSheet) {
      throw new Error("As abas 'Standard' e 'Disaggregation' sao obrigatorias no arquivo de equacoes.");
    }

    const referenceRows = referenceSheet
      ? (XLSX.utils.sheet_to_json(referenceSheet, { defval: null }) as RowReference[])
      : [];

    const referenceMap = new Map<string, { title: string | null; link: string | null }>();
    for (const row of referenceRows) {
      const key = (row.Code ?? "").toString().trim();
      if (!key) {
        continue;
      }
      referenceMap.set(key, {
        title: row.Reference ? row.Reference.toString() : null,
        link: row.Link ? row.Link.toString() : null,
      });
    }

    const equations: LegacyEquation[] = [];
    equations.push(...this.parseSheet("Standard", standardSheet, referenceMap));
    equations.push(...this.parseSheet("Disaggregation", disaggregationSheet, referenceMap));

    return equations;
  }

  private parseSheet(
    sourceSheet: "Standard" | "Disaggregation",
    worksheet: XLSX.WorkSheet,
    referenceMap: Map<string, { title: string | null; link: string | null }>,
  ) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as RowEquation[];
    const equations: LegacyEquation[] = [];

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
      const referenceMeta = referenceMap.get(referenceCode);

      const disaggregationReferenceCode = row["Disaggregation reference"]
        ? row["Disaggregation reference"]!.toString().trim()
        : null;
      const disaggregationMeta = disaggregationReferenceCode
        ? referenceMap.get(disaggregationReferenceCode)
        : null;

      const codeValue =
        row.Code === null || row.Code === undefined || row.Code === "-" ? null : row.Code.toString();

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
        equationVersion:
          sourceSheet === "Standard"
            ? "idf_curves_brazil_standard"
            : "idf_curves_brazil_disaggregation",
      });
    }

    return equations;
  }

  private resolveWorkbookPath() {
    if (process.env.IDF_XLSX_PATH && fs.existsSync(process.env.IDF_XLSX_PATH)) {
      return process.env.IDF_XLSX_PATH;
    }

    const docsFolder = "Documenta\u00e7\u00e3o";
    const candidates = [
      path.resolve(process.cwd(), "..", docsFolder, "Equa\u00e7\u00f5es", "IDF_Curves_Brazil.xlsx"),
      path.resolve(process.cwd(), "..", "..", docsFolder, "Equa\u00e7\u00f5es", "IDF_Curves_Brazil.xlsx"),
      path.resolve(__dirname, "..", "..", "..", "..", docsFolder, "Equa\u00e7\u00f5es", "IDF_Curves_Brazil.xlsx"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new Error("Arquivo IDF_Curves_Brazil.xlsx nao encontrado. Defina IDF_XLSX_PATH no .env.");
  }

  private toNumber(value: string | number | null | undefined) {
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

  private normalizeText(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
}
