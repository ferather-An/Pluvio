import { Injectable } from "@nestjs/common";
import { LegacyEquationRepository } from "../../data/legacy-equation.repository";

@Injectable()
export class GeoService {
  constructor(private readonly repository: LegacyEquationRepository) {}

  listUFs() {
    return this.repository.listUFs().map((uf) => ({ uf }));
  }

  listMunicipios(uf: string) {
    const value = uf.toUpperCase();
    return this.repository.listMunicipios(value).map((municipio) => ({ uf: value, municipio }));
  }

  listEstacoes(uf?: string, municipio?: string) {
    return this.repository.listEstacoes(uf, municipio).map((item) => ({
      id: item.id,
      uf: item.uf,
      municipio: item.municipio,
      estacao: item.estacao,
      latitude: item.latitude,
      longitude: item.longitude,
      referenceCode: item.referenceCode,
    }));
  }
}
