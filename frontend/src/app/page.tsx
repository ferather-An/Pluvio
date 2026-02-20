"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UfItem = { uf: string };
type MunicipioItem = { uf: string; municipio: string };

type IdfResponse = {
  resultado: { intensidade_mm_h: number; unidade: string };
  equacao: { K: number; a: number; b: number; c: number; modelo: string };
  flags: { interpolada: boolean; aviso: string | null };
  localidade: { uf: string; municipio: string; estacao: string };
  referencia: { reference_code: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function HomePage() {
  const [ufs, setUfs] = useState<UfItem[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioItem[]>([]);

  const [uf, setUf] = useState("MG");
  const [municipio, setMunicipio] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [tr, setTr] = useState(25);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdfResponse | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/v1/ufs`)
      .then((r) => r.json())
      .then((data: UfItem[]) => {
        setUfs(data);
        if (data.length > 0) {
          setUf((current) => current || data[0].uf);
        }
      })
      .catch(() => setError("Falha ao carregar UFs."));
  }, []);

  useEffect(() => {
    if (!uf) {
      return;
    }

    fetch(`${API_URL}/v1/municipios?uf=${encodeURIComponent(uf)}`)
      .then((r) => r.json())
      .then((data: MunicipioItem[]) => {
        setMunicipios(data);
        setMunicipio(data[0]?.municipio ?? "");
      })
      .catch(() => setError("Falha ao carregar municipios."));
  }, [uf]);

  const canSubmit = useMemo(() => uf && duracao >= 5 && tr >= 2, [uf, duracao, tr]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/v1/idf/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uf,
          municipio: municipio || undefined,
          duracao: Number(duracao),
          TR: Number(tr),
          modo: "LEGADO",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro no calculo.");
      }

      const payload = (await response.json()) as IdfResponse;
      setResult(payload);
    } catch {
      setError("Nao foi possivel calcular a intensidade IDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-brand-700">Pluvio Web 3.x</h1>
        <p className="text-slate-700">Fase 1: fluxo legado de calculo IDF.</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg bg-white p-5 shadow">
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="uf">
            UF
          </label>
          <select
            id="uf"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            {ufs.map((item) => (
              <option key={item.uf} value={item.uf}>
                {item.uf}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="municipio">
            Municipio
          </label>
          <select
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            {municipios.map((item) => (
              <option key={item.municipio} value={item.municipio}>
                {item.municipio}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-semibold" htmlFor="duracao">
              Duracao (min)
            </label>
            <input
              id="duracao"
              type="number"
              min={5}
              max={1440}
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold" htmlFor="tr">
              TR (anos)
            </label>
            <input
              id="tr"
              type="number"
              min={2}
              max={100}
              value={tr}
              onChange={(e) => setTr(Number(e.target.value))}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded bg-brand-500 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {error ? <p className="rounded bg-red-50 p-3 text-red-700">{error}</p> : null}

      {result ? (
        <section className="grid gap-3 rounded-lg bg-white p-5 shadow">
          <h2 className="text-xl font-semibold text-slate-800">Resultado</h2>
          <p>
            Intensidade: <strong>{result.resultado.intensidade_mm_h}</strong> {result.resultado.unidade}
          </p>
          <p>
            Equacao ({result.equacao.modelo}): K={result.equacao.K}, a={result.equacao.a}, b={result.equacao.b},
            c={result.equacao.c}
          </p>
          <p>
            Localidade: {result.localidade.municipio} - {result.localidade.uf} ({result.localidade.estacao})
          </p>
          <p>Referencia: {result.referencia.reference_code}</p>
          {result.flags.interpolada ? (
            <p className="rounded bg-amber-50 p-2 text-amber-700">
              Aviso: {result.flags.aviso ?? "Calculo com interpolacao/fallback."}
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
