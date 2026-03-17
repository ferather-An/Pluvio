import { CalculateIdfDto } from "./dto/calculate-idf.dto";
import { IdfService } from "./idf.service";
export declare class IdfController {
    private readonly idfService;
    constructor(idfService: IdfService);
    calculate(body: CalculateIdfDto): Promise<{
        input: {
            uf: string;
            municipio: string | null;
            estacao: string | null;
            duracao: number;
            TR: number;
            modo: "LEGADO" | "MODERNO" | "AUTO";
            latitude: number | null;
            longitude: number | null;
            metodoDuracaoLonga: "KIMBALL" | "KNOESSEN" | null;
        };
        resultado: {
            intensidade_mm_h: number;
            unidade: string;
        };
        equacao: {
            source_sheet: string;
            source_label: string;
            equation_id: string;
            equation_version: string | null;
            modelo: string;
            modo: string;
            metodo: string | null;
            K: number;
            a: number;
            b: number;
            c: number;
        };
        referencia: {
            reference_code: string | null;
            titulo: string | null;
            link: string | null;
        };
        referencia_disaggregation: null;
        localidade: {
            uf: string;
            municipio: string;
            estacao: string;
            latitude: number | null;
            longitude: number | null;
        };
        flags: {
            interpolada: boolean;
            distancia_m: number | null;
            metodo_interpolacao: string | null;
            aviso: string | null;
            familia_duracao: string;
            metodo_duracao_longa: ("KIMBALL" | "KNOESSEN") | null;
            ancora_duracao_min: number;
        };
    }>;
    getNearestStation(latitude: string, longitude: string): Promise<{
        id: string;
        uf: string;
        municipio: string;
        estacao: string;
        latitude: number | null;
        longitude: number | null;
        distance_m: number;
    }>;
    getEquationById(id: string): Promise<{
        id: string;
        sourceSheet: string;
        uf: string;
        municipio: string;
        estacao: string;
        modelo: string;
        modo: string;
        metodo: string | null;
        K: number;
        a: number;
        b: number;
        c: number;
        years: number | null;
        r2: number | null;
        durationRange: string | null;
        referenceCode: string | null;
        referenceTitle: string | null;
        referenceLink: string | null;
        disaggregationCoefficients: null;
        disaggregationReferenceCode: null;
        disaggregationReferenceTitle: null;
        disaggregationReferenceLink: null;
        equationVersion: string | null;
    }>;
}
