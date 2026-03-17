import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class DisaggregateRainDto {
  @ApiProperty({ description: "Chuva total em 24h (mm)", minimum: 1, maximum: 1000, example: 80 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  chuva24hMm!: number;

  @ApiProperty({
    description: "Durações desejadas em minutos (5–1440)",
    type: [Number],
    example: [5, 10, 15, 30, 60, 120, 360, 720, 1440],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(5, { each: true })
  @Max(1440, { each: true })
  duracoesMin!: number[];

  @ApiProperty({
    description: "Método de desagregação",
    enum: ["CETESB_DAEE", "REGIONAL_SUDESTE", "KIMBALL", "KNOESSEN"],
    example: "CETESB_DAEE",
  })
  @IsIn(["CETESB_DAEE", "REGIONAL_SUDESTE", "KIMBALL", "KNOESSEN"])
  metodo!: "CETESB_DAEE" | "REGIONAL_SUDESTE" | "KIMBALL" | "KNOESSEN";

  @ApiPropertyOptional({
    description: "Fator de correção multiplicativo (padrão 1,0)",
    minimum: 0.1,
    maximum: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(3)
  fatorCorrecao?: number;
}
