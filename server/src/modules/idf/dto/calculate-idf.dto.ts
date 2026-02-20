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
}
