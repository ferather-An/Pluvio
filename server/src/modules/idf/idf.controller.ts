import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CalculateIdfDto } from "./dto/calculate-idf.dto";
import { IdfService } from "./idf.service";

@ApiTags("idf")
@Controller("idf")
export class IdfController {
  constructor(private readonly idfService: IdfService) {}

  @Post("calculate")
  @ApiOperation({ summary: "Calcular intensidade de chuva pela equação de Sherman" })
  @ApiResponse({ status: 201, description: "Resultado com intensidade (mm/h), equação e flags" })
  calculate(@Body() body: CalculateIdfDto) {
    return this.idfService.calculate(body);
  }

  @Get("nearest")
  @ApiOperation({ summary: "Estação pluviométrica mais próxima de um ponto" })
  @ApiQuery({ name: "latitude", required: true, example: -22.9 })
  @ApiQuery({ name: "longitude", required: true, example: -43.2 })
  getNearestStation(
    @Query("latitude") latitude: string,
    @Query("longitude") longitude: string,
  ) {
    return this.idfService.findNearestStation({
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
  }

  @Get("equations/:id")
  @ApiOperation({ summary: "Buscar equação IDF por ID" })
  getEquationById(@Param("id") id: string) {
    return this.idfService.getEquationById(id);
  }
}
