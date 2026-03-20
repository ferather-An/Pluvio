export type LegacyManualCase = {
  name: string;
  input: {
    K: number;
    a: number;
    b: number;
    c: number;
    duracaoMin: number;
    trAnos: number;
  };
  expectedIntensity: number;
  note: string;
};

export type LongDurationManualCase = {
  name: string;
  input: {
    K: number;
    a: number;
    b: number;
    c: number;
    duracaoMin: number;
    trAnos: number;
    metodo: "KIMBALL" | "KNOESSEN";
  };
  expectedIntensity: number;
  expectedFamily: "DURACAO_LONGA";
  expectedAnchorDurationMin: number;
  note: string;
};

export const legacyManualCases: LegacyManualCase[] = [
  {
    name: "sherman_60min_tr10",
    input: {
      K: 1200,
      a: 0.2,
      b: 10,
      c: 0.8,
      duracaoMin: 60,
      trAnos: 10,
    },
    expectedIntensity: 63.548136,
    note: "I = 1200 * 10^0.2 / (60 + 10)^0.8",
  },
  {
    name: "sherman_24h_tr25",
    input: {
      K: 950,
      a: 0.18,
      b: 20,
      c: 0.82,
      duracaoMin: 1440,
      trAnos: 25,
    },
    expectedIntensity: 4.311054,
    note: "Anchor case used by long-duration regression checks",
  },
];

export const longDurationManualCases: LongDurationManualCase[] = [
  {
    name: "kimball_48h_from_24h_anchor",
    input: {
      K: 950,
      a: 0.18,
      b: 20,
      c: 0.82,
      duracaoMin: 2880,
      trAnos: 25,
      metodo: "KIMBALL",
    },
    expectedIntensity: 2.662978,
    expectedFamily: "DURACAO_LONGA",
    expectedAnchorDurationMin: 1440,
    note:
      "Uses 24h Sherman intensity 4.311054 mm/h, converts to lamina, applies factor (2880/1440)^0.305, then converts back to mm/h",
  },
  {
    name: "knoessen_72h_from_24h_anchor",
    input: {
      K: 950,
      a: 0.18,
      b: 20,
      c: 0.82,
      duracaoMin: 4320,
      trAnos: 25,
      metodo: "KNOESSEN",
    },
    expectedIntensity: 2.009903,
    expectedFamily: "DURACAO_LONGA",
    expectedAnchorDurationMin: 1440,
    note:
      "Uses 24h Sherman intensity 4.311054 mm/h, applies factor (4320/1440)^0.3054, then converts lamina back to mm/h",
  },
];
