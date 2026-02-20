import { Controller, Get, Query } from "@nestjs/common";
import { GeoService } from "./geo.service";

@Controller()
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("ufs")
  getUFs() {
    return this.geoService.listUFs();
  }

  @Get("municipios")
  getMunicipios(@Query("uf") uf?: string) {
    if (!uf) {
      return [];
    }
    return this.geoService.listMunicipios(uf);
  }

  @Get("estacoes")
  getEstacoes(@Query("uf") uf?: string, @Query("municipio") municipio?: string) {
    return this.geoService.listEstacoes(uf, municipio);
  }
}
