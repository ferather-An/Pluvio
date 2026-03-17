import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DisaggregateRainDto } from "./dto/disaggregate-rain.dto";
import { RainService } from "./rain.service";

@ApiTags("rain")
@Controller("rain")
export class RainController {
  constructor(private readonly rainService: RainService) {}

  @Post("disaggregate")
  @ApiOperation({
    summary: "Desagregar chuva de 24h em sub-diárias",
    description:
      "Converte chuva total de 24h (mm) em lâminas e intensidades para múltiplas durações.\n\n" +
      "**Métodos:** CETESB_DAEE · REGIONAL_SUDESTE · KIMBALL · KNOESSEN",
  })
  @ApiResponse({ status: 201, description: "Tabela de desagregação por duração" })
  disaggregate(@Body() body: DisaggregateRainDto) {
    return this.rainService.disaggregate(body);
  }
}
