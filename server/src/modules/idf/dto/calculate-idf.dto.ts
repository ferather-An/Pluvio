import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CalculateIdfDto {
  @IsString()
  uf!: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  estacao?: string;

  @IsNumber()
  @Min(5)
  @Max(43200)
  duracao!: number;

  @IsNumber()
  @Min(2)
  @Max(100)
  TR!: number;

  @IsOptional()
  @IsString()
  @IsIn(["LEGADO", "AUTO", "MODERNO"])
  modo?: "LEGADO" | "AUTO" | "MODERNO";

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  elevacaoM?: number;

  @IsOptional()
  @IsString()
  @IsIn(["KIMBALL", "KNOESSEN"])
  metodoDuracaoLonga?: "KIMBALL" | "KNOESSEN";
}
