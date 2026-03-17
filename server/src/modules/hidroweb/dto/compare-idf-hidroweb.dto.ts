import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CompareIdfHidrowebDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsNumber()
  @Min(5)
  @Max(1440)
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
  @Min(10)
  @Max(1000)
  raioKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  maxEstacoes?: number;
}
