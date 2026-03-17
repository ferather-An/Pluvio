import { LegacyEquationRepository } from "../../data/legacy-equation.repository";
export declare class GeoService {
    private readonly repository;
    constructor(repository: LegacyEquationRepository);
    listUFs(): {
        uf: string;
    }[];
    listMunicipios(uf: string): {
        uf: string;
        municipio: string;
    }[];
    listEstacoes(uf?: string, municipio?: string): {
        id: string;
        uf: string;
        municipio: string;
        estacao: string;
        latitude: number;
        longitude: number;
        referenceCode: string;
    }[];
}
