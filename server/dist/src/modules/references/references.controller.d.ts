import { ReferencesService } from "./references.service";
export declare class ReferencesController {
    private readonly referencesService;
    constructor(referencesService: ReferencesService);
    listReferences(page?: string, pageSize?: string, q?: string): {
        items: {
            code: string;
            titulo: string;
            link: string | null;
            tipoFonte: string | null;
            totalMunicipios: number;
            totalEquacoes: number;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    getReferenceByCode(code: string): {
        code: string;
        titulo: string;
        link: string | null;
        tipoFonte: string | null;
        totalMunicipios: number;
        totalEquacoes: number;
        municipios: {
            uf: string;
            municipio: string;
            estacoes: string[];
        }[];
    };
}
