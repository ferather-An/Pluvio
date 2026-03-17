import { DisaggregateRainDto } from "./dto/disaggregate-rain.dto";
import { RainService } from "./rain.service";
export declare class RainController {
    private readonly rainService;
    constructor(rainService: RainService);
    disaggregate(body: DisaggregateRainDto): {
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
}
