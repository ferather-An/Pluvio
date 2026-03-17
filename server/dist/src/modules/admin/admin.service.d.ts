import { PrismaService } from "../../prisma/prisma.service";
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalEquacoes: number;
        totalDatasets: number;
        totalReferencias: number;
        publishedDatasets: number;
        ufsAtendidas: number;
    }>;
    listDatasets(page?: number, pageSize?: number): Promise<{
        data: ({
            _count: {
                equations: number;
            };
        } & {
            status: import(".prisma/client").$Enums.DatasetStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            descricao: string | null;
            origem: string | null;
            versao: string | null;
            publicadoEm: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getDataset(id: string): Promise<{
        equations: {
            status: import(".prisma/client").$Enums.DatasetStatus;
            id: string;
            datasetId: string | null;
            referenceCode: string | null;
            uf: string;
            municipio: string;
            estacao: string;
            codigoEstacao: string | null;
            agencia: string | null;
            sourceSheet: string | null;
            equationId: string | null;
            equationVersion: string | null;
            latitude: number | null;
            longitude: number | null;
            anosDados: number | null;
            faixaDuracao: string | null;
            r2: number | null;
            K: number;
            a: number;
            b: number;
            c: number;
            modo: string | null;
            modelo: string | null;
            metodo: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        status: import(".prisma/client").$Enums.DatasetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        descricao: string | null;
        origem: string | null;
        versao: string | null;
        publicadoEm: Date | null;
    }>;
    publishDataset(id: string, userEmail: string): Promise<{
        status: import(".prisma/client").$Enums.DatasetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        descricao: string | null;
        origem: string | null;
        versao: string | null;
        publicadoEm: Date | null;
    }>;
    deprecateDataset(id: string, userEmail: string): Promise<{
        status: import(".prisma/client").$Enums.DatasetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        nome: string;
        descricao: string | null;
        origem: string | null;
        versao: string | null;
        publicadoEm: Date | null;
    }>;
    importXlsx(buffer: Buffer, nomeDataset: string, userEmail: string): Promise<{
        datasetId: string;
        total: number;
        imported: number;
        errors: string[];
    }>;
    listAuditLog(page?: number, pageSize?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            acao: string;
            entidade: string;
            entidadeId: string | null;
            usuario: string | null;
            detalhes: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    private logAction;
}
