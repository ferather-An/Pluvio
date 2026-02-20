import { Injectable, NotFoundException } from "@nestjs/common";
import { LegacyEquationRepository } from "../../data/legacy-equation.repository";
import { CalculateIdfDto } from "./dto/calculate-idf.dto";
import { LegacyCalculator } from "./legacy.calculator";

@Injectable()
export class IdfService {
  constructor(
    private readonly legacyCalculator: LegacyCalculator,
    private readonly repository: LegacyEquationRepository,
  ) {}

  getEquationById(id: string) {
    const equation = this.repository.findById(id);
    if (!equation) {
      throw new NotFoundException("Equacao nao encontrada.");
    }

    return {
      id: equation.id,
      sourceSheet: equation.sourceSheet,
      uf: equation.uf,
      municipio: equation.municipio,
      estacao: equation.estacao,
      modelo: "SHERMAN",
      modo: "LEGADO",
      K: equation.K,
      a: equation.a,
      b: equation.b,
      c: equation.c,
      years: equation.years,
      r2: equation.r2,
      durationRange: equation.durationRange,
      referenceCode: equation.referenceCode,
      referenceTitle: equation.referenceTitle,
      referenceLink: equation.referenceLink,
      disaggregationCoefficients: equation.disaggregationCoefficients,
      disaggregationReferenceCode: equation.disaggregationReferenceCode,
      disaggregationReferenceTitle: equation.disaggregationReferenceTitle,
      disaggregationReferenceLink: equation.disaggregationReferenceLink,
      equationVersion: equation.equationVersion,
    };
  }

  calculate(input: CalculateIdfDto) {
    const equation = this.repository.findBestMatch({
      uf: input.uf,
      municipio: input.municipio,
      estacao: input.estacao,
      preferredSheets: ["Standard", "Disaggregation"],
    });

    if (!equation) {
      throw new NotFoundException("Nenhuma equacao legada encontrada para os filtros informados.");
    }

    const interpolada = !input.municipio && !input.estacao;
    const intensidade = this.legacyCalculator.calculate(
      equation.K,
      equation.a,
      equation.b,
      equation.c,
      input.duracao,
      input.TR,
    );

    return {
      input: {
        uf: input.uf.toUpperCase(),
        municipio: input.municipio ?? null,
        estacao: input.estacao ?? null,
        duracao: input.duracao,
        TR: input.TR,
        modo: input.modo ?? "LEGADO",
      },
      resultado: {
        intensidade_mm_h: Number(intensidade.toFixed(3)),
        unidade: "mm/h",
      },
      equacao: {
        source_sheet: equation.sourceSheet,
        equation_id: equation.id,
        equation_version: equation.equationVersion,
        modelo: "SHERMAN",
        modo: "LEGADO",
        K: equation.K,
        a: equation.a,
        b: equation.b,
        c: equation.c,
      },
      referencia: {
        reference_code: equation.referenceCode,
        titulo: equation.referenceTitle,
        link: equation.referenceLink,
      },
      referencia_disaggregation: equation.disaggregationReferenceCode
        ? {
            reference_code: equation.disaggregationReferenceCode,
            titulo: equation.disaggregationReferenceTitle,
            link: equation.disaggregationReferenceLink,
          }
        : null,
      localidade: {
        uf: equation.uf,
        municipio: equation.municipio,
        estacao: equation.estacao,
      },
      flags: {
        interpolada,
        aviso: interpolada ? "Equacao escolhida por fallback de UF." : null,
      },
    };
  }
}
