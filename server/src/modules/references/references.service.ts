import { Injectable, NotFoundException } from "@nestjs/common";
import { LegacyEquationRepository } from "../../data/legacy-equation.repository";

@Injectable()
export class ReferencesService {
  constructor(private readonly repo: LegacyEquationRepository) {}

  listReferences(input: { page: number; pageSize: number; q?: string }) {
    const allRefs = this.repo.listReferences();
    const allEquations = this.repo.listEstacoes();

    // Compute per-reference stats from in-memory equations
    const statsByRef = new Map<string, { municipios: Set<string>; equationCount: number }>();
    for (const eq of allEquations) {
      if (!statsByRef.has(eq.referenceCode)) {
        statsByRef.set(eq.referenceCode, { municipios: new Set(), equationCount: 0 });
      }
      const s = statsByRef.get(eq.referenceCode)!;
      s.municipios.add(`${eq.uf}|${eq.municipio}`);
      s.equationCount += 1;
    }

    let items = allRefs.map((ref) => {
      const stats = statsByRef.get(ref.code);
      return {
        code: ref.code,
        titulo: ref.title ?? ref.code,
        link: ref.link,
        tipoFonte: null as string | null,
        totalMunicipios: stats?.municipios.size ?? 0,
        totalEquacoes: stats?.equationCount ?? 0,
      };
    });

    // Filter by query
    const q = input.q?.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.titulo.toLowerCase().includes(q) ||
          (item.link ?? "").toLowerCase().includes(q),
      );
    }

    // Sort: most equations first, then alphabetically by code
    items.sort(
      (a, b) => b.totalEquacoes - a.totalEquacoes || a.code.localeCompare(b.code),
    );

    const total = items.length;
    const start = (input.page - 1) * input.pageSize;

    return {
      items: items.slice(start, start + input.pageSize),
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }

  getReferenceByCode(code: string) {
    const ref = this.repo.findReferenceByCode(code.trim());
    if (!ref) {
      throw new NotFoundException("Referencia nao encontrada para o codigo informado.");
    }

    const allEquations = this.repo.listEstacoes();
    const refEquations = allEquations.filter((eq) => eq.referenceCode === code.trim());

    // Group stations by UF + municipality
    const municipioMap = new Map<
      string,
      { uf: string; municipio: string; estacoes: Set<string> }
    >();
    for (const eq of refEquations) {
      const key = `${eq.uf}|${eq.municipio}`;
      if (!municipioMap.has(key)) {
        municipioMap.set(key, { uf: eq.uf, municipio: eq.municipio, estacoes: new Set() });
      }
      municipioMap.get(key)!.estacoes.add(eq.estacao);
    }

    const municipios = [...municipioMap.values()]
      .map((m) => ({
        uf: m.uf,
        municipio: m.municipio,
        estacoes: [...m.estacoes].sort(),
      }))
      .sort((a, b) => a.uf.localeCompare(b.uf) || a.municipio.localeCompare(b.municipio));

    return {
      code: ref.code,
      titulo: ref.title ?? ref.code,
      link: ref.link,
      tipoFonte: null as string | null,
      totalMunicipios: municipioMap.size,
      totalEquacoes: refEquations.length,
      municipios,
    };
  }
}
