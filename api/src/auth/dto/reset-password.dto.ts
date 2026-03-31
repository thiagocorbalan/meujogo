import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MaxLength(512)
  token: string;

  @IsString()
  @MaxLength(128)
  @MinLength(12, {
    message: 'A senha deve ter no mínimo 12 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'A senha deve conter pelo menos uma letra minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'A senha deve conter pelo menos um número',
  })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: 'A senha deve conter pelo menos um caractere especial',
  })
  password: string;
}
