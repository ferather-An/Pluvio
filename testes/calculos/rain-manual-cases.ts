import { DisaggregateRainDto } from "../../modules/rain/dto/disaggregate-rain.dto";

export type RainManualCase = {
  name: string;
  input: DisaggregateRainDto;
  expected: Array<{
    duracao_min: number;
    coeficiente: number;
    lamina_mm: number;
    intensidade_mm_h: number;
  }>;
  note: string;
};

export const rainManualCases: RainManualCase[] = [
  {
    name: "kimball_60min",
    input: {
      chuva24hMm: 120,
      duracoesMin: [60],
      metodo: "KIMBALL",
    },
    expected: [
      {
        duracao_min: 60,
        coeficiente: 0.3793,
        lamina_mm: 45.522,
        intensidade_mm_h: 45.522,
      },
    ],
    note: "coef = (60/1440)^0.305; lamina = 120 * coef",
  },
  {
    name: "knoessen_120min",
    input: {
      chuva24hMm: 120,
      duracoesMin: [120],
      metodo: "KNOESSEN",
    },
    expected: [
      {
        duracao_min: 120,
        coeficiente: 0.4682,
        lamina_mm: 56.182,
        intensidade_mm_h: 28.091,
      },
    ],
    note: "coef = (120/1440)^0.3054; intensity = lamina / 2h",
  },
  {
    name: "cetesb_interpolated_90min",
    input: {
      chuva24hMm: 100,
      duracoesMin: [90],
      metodo: "CETESB_DAEE",
    },
    expected: [
      {
        duracao_min: 90,
        coeficiente: 0.63,
        lamina_mm: 63,
        intensidade_mm_h: 42,
      },
    ],
    note: "Linear interpolation between 60min coef 0.54 and 120min coef 0.72",
  },
];
