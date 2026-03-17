import { GeoService } from "./geo.service";
export declare class GeoController {
    private readonly geoService;
    constructor(geoService: GeoService);
    getUFs(): {
        uf: string;
    }[];
    getMunicipios(uf?: string): {
        uf: string;
        municipio: string;
    }[];
    getEstacoes(uf?: string, municipio?: string): {
        id: string;
        uf: string;
        municipio: string;
        estacao: string;
        latitude: number;
        longitude: number;
        referenceCode: string;
    }[];
}
