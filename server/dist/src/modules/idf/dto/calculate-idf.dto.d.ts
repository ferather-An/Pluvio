export declare class CalculateIdfDto {
    uf: string;
    municipio?: string;
    estacao?: string;
    duracao: number;
    TR: number;
    modo?: "LEGADO" | "AUTO" | "MODERNO";
    latitude?: number;
    longitude?: number;
    elevacaoM?: number;
    metodoDuracaoLonga?: "KIMBALL" | "KNOESSEN";
}
