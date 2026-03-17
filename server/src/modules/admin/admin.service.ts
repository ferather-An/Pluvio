import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as XLSX from "xlsx";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalEquacoes, totalDatasets, totalReferencias, publishedDatasets] = await Promise.all([
      this.prisma.idfEquation.count({ where: { status: "PUBLISHED" } }),
      this.prisma.dataset.count(),
      this.prisma.reference.count(),
      this.prisma.dataset.count({ where: { status: "PUBLISHED" } }),
    ]);

    const ufsCount = await this.prisma.idfEquation.groupBy({
      by: ["uf"],
      where: { status: "PUBLISHED" },
      _count: true,
    });

    return {
      totalEquacoes,
      totalDatasets,
      totalReferencias,
      publishedDatasets,
      ufsAtendidas: ufsCount.length,
    };
  }

  async listDatasets(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.dataset.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { equations: true } } },
      }),
      this.prisma.dataset.count(),
    ]);
    return { data, total, page, pageSize };
  }

  async getDataset(id: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: { equations: { take: 50 } },
    });
    if (!dataset) throw new NotFoundException("Dataset não encontrado");
    return dataset;
  }

  async publishDataset(id: string, userEmail: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });
    if (!dataset) throw new NotFoundException("Dataset não encontrado");
    if (dataset.status === "PUBLISHED") throw new BadRequestException("Dataset já está publicado");

    // Depreca o anterior da mesma origem
    if (dataset.origem) {
      await this.prisma.dataset.updateMany({
        where: { origem: dataset.origem, status: "PUBLISHED" },
        data: { status: "DEPRECATED" },
      });
    }

    const updated = await this.prisma.dataset.update({
      where: { id },
      data: { status: "PUBLISHED", publicadoEm: new Date() },
    });

    // Ativa equações deste dataset
    await this.prisma.idfEquation.updateMany({
      where: { datasetId: id },
      data: { status: "PUBLISHED" },
    });

    await this.logAction("PUBLISH_DATASET", "Dataset", id, userEmail, {
      nome: dataset.nome,
      origem: dataset.origem,
    });

    return updated;
  }

  async deprecateDataset(id: string, userEmail: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id } });
    if (!dataset) throw new NotFoundException("Dataset não encontrado");

    const updated = await this.prisma.dataset.update({
      where: { id },
      data: { status: "DEPRECATED" },
    });

    await this.prisma.idfEquation.updateMany({
      where: { datasetId: id },
      data: { status: "DEPRECATED" },
    });

    await this.logAction("DEPRECATE_DATASET", "Dataset", id, userEmail, { nome: dataset.nome });
    return updated;
  }

  async importXlsx(buffer: Buffer, nomeDataset: string, userEmail: string) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]);

    if (!rows.length) throw new BadRequestException("Planilha vazia ou formato inválido");

    const dataset = await this.prisma.dataset.create({
      data: {
        nome: nomeDataset,
        origem: "XLSX_IMPORT",
        versao: new Date().toISOString().slice(0, 10),
        status: "STAGING",
      },
    });

    const errors: string[] = [];
    let imported = 0;

    for (const [i, row] of rows.entries()) {
      const K = Number(row["K"] ?? row["k"]);
      const a = Number(row["a"]);
      const b = Number(row["b"]);
      const c = Number(row["c"]);
      const uf = String(row["UF"] ?? row["uf"] ?? "").toUpperCase().trim();
      const municipio = String(row["municipio"] ?? row["Municipio"] ?? "").trim();

      // Validação de faixas
      if (K < 100 || K > 100000) { errors.push(`Linha ${i + 2}: K=${K} fora da faixa [100, 100000]`); continue; }
      if (a < 0.01 || a > 1.0) { errors.push(`Linha ${i + 2}: a=${a} fora da faixa [0.01, 1.0]`); continue; }
      if (b < 0 || b > 200) { errors.push(`Linha ${i + 2}: b=${b} fora da faixa [0, 200]`); continue; }
      if (c < 0.3 || c > 1.5) { errors.push(`Linha ${i + 2}: c=${c} fora da faixa [0.3, 1.5]`); continue; }
      if (!uf || !municipio) { errors.push(`Linha ${i + 2}: UF ou Municipio ausente`); continue; }

      await this.prisma.idfEquation.create({
        data: {
          datasetId: dataset.id,
          uf,
          municipio,
          estacao: String(row["estacao"] ?? row["Estacao"] ?? municipio),
          K, a, b, c,
          latitude: row["latitude"] ? Number(row["latitude"]) : null,
          longitude: row["longitude"] ? Number(row["longitude"]) : null,
          status: "STAGING",
        },
      });
      imported++;
    }

    await this.logAction("IMPORT_XLSX", "Dataset", dataset.id, userEmail, {
      total: rows.length,
      imported,
      errors: errors.length,
    });

    return { datasetId: dataset.id, total: rows.length, imported, errors };
  }

  async listAuditLog(page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.updateLog.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.updateLog.count(),
    ]);
    return { data, total, page, pageSize };
  }

  private async logAction(
    acao: string,
    entidade: string,
    entidadeId: string,
    usuario: string,
    detalhes?: Record<string, unknown>,
  ) {
    await this.prisma.updateLog.create({
      data: { acao, entidade, entidadeId, usuario, detalhes: (detalhes ?? {}) as object },
    });
  }
}
