import { DisaggregateRainDto } from "./dto/disaggregate-rain.dto";
export declare class RainService {
    private readonly coefTables;
    private readonly metodoMetadata;
    disaggregate(input: DisaggregateRainDto): {
        input: {
            chuva24h_mm: number;
            duracoes_min: number[];
            metodo: "CETESB_DAEE" | "REGIONAL_SUDESTE" | "KIMBALL" | "KNOESSEN";
            fator_correcao: number;
        };
        output: {
            duracao_min: number;
            coeficiente: number;
            lamina_mm: number;
            intensidade_mm_h: number;
        }[];
        metadata: {
            fonte_coeficientes: string;
            observacao: string;
        };
    };
    private calcCoef;
    private interpolateCoef;
}
