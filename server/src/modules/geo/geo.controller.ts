import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { GeoService } from "./geo.service";

@ApiTags("geo")
@Controller()
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("ufs")
  @ApiOperation({ summary: "Listar Unidades Federativas com equações cadastradas" })
  getUFs() {
    return this.geoService.listUFs();
  }

  @Get("municipios")
  @ApiOperation({ summary: "Listar municípios de uma UF" })
  @ApiQuery({ name: "uf", required: false, example: "RJ" })
  getMunicipios(@Query("uf") uf?: string) {
    if (!uf) return [];
    return this.geoService.listMunicipios(uf);
  }

  @Get("estacoes")
  @ApiOperation({ summary: "Listar estações pluviométricas com filtros" })
  @ApiQuery({ name: "uf", required: false })
  @ApiQuery({ name: "municipio", required: false })
  getEstacoes(@Query("uf") uf?: string, @Query("municipio") municipio?: string) {
    return this.geoService.listEstacoes(uf, municipio);
  }
}
