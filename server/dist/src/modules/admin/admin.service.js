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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async getDataset(id) {
        const dataset = await this.prisma.dataset.findUnique({
            where: { id },
            include: { equations: { take: 50 } },
        });
        if (!dataset)
            throw new common_1.NotFoundException("Dataset não encontrado");
        return dataset;
    }
    async publishDataset(id, userEmail) {
        const dataset = await this.prisma.dataset.findUnique({ where: { id } });
        if (!dataset)
            throw new common_1.NotFoundException("Dataset não encontrado");
        if (dataset.status === "PUBLISHED")
            throw new common_1.BadRequestException("Dataset já está publicado");
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
    async deprecateDataset(id, userEmail) {
        const dataset = await this.prisma.dataset.findUnique({ where: { id } });
        if (!dataset)
            throw new common_1.NotFoundException("Dataset não encontrado");
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
    async importXlsx(buffer, nomeDataset, userEmail) {
        const wb = XLSX.read(buffer, { type: "buffer" });
        const sheetName = wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        if (!rows.length)
            throw new common_1.BadRequestException("Planilha vazia ou formato inválido");
        const dataset = await this.prisma.dataset.create({
            data: {
                nome: nomeDataset,
                origem: "XLSX_IMPORT",
                versao: new Date().toISOString().slice(0, 10),
                status: "STAGING",
            },
        });
        const errors = [];
        let imported = 0;
        for (const [i, row] of rows.entries()) {
            const K = Number(row["K"] ?? row["k"]);
            const a = Number(row["a"]);
            const b = Number(row["b"]);
            const c = Number(row["c"]);
            const uf = String(row["UF"] ?? row["uf"] ?? "").toUpperCase().trim();
            const municipio = String(row["municipio"] ?? row["Municipio"] ?? "").trim();
            if (K < 100 || K > 100000) {
                errors.push(`Linha ${i + 2}: K=${K} fora da faixa [100, 100000]`);
                continue;
            }
            if (a < 0.01 || a > 1.0) {
                errors.push(`Linha ${i + 2}: a=${a} fora da faixa [0.01, 1.0]`);
                continue;
            }
            if (b < 0 || b > 200) {
                errors.push(`Linha ${i + 2}: b=${b} fora da faixa [0, 200]`);
                continue;
            }
            if (c < 0.3 || c > 1.5) {
                errors.push(`Linha ${i + 2}: c=${c} fora da faixa [0.3, 1.5]`);
                continue;
            }
            if (!uf || !municipio) {
                errors.push(`Linha ${i + 2}: UF ou Municipio ausente`);
                continue;
            }
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
    async logAction(acao, entidade, entidadeId, usuario, detalhes) {
        await this.prisma.updateLog.create({
            data: { acao, entidade, entidadeId, usuario, detalhes: (detalhes ?? {}) },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map