import { LegacyEquationRepository } from "../../data/legacy-equation.repository";
export declare class ReferencesService {
    private readonly repo;
    constructor(repo: LegacyEquationRepository);
    listReferences(input: {
        page: number;
        pageSize: number;
        q?: string;
    }): {
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
