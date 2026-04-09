import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome e obrigatorio.' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Formato de email invalido.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MaxLength(128)
  @MinLength(12, {
    message: 'A senha deve ter no minimo 12 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'A senha deve conter pelo menos uma letra maiuscula',
  })
  @Matches(/[a-z]/, {
    message: 'A senha deve conter pelo menos uma letra minuscula',
  })
  @Matches(/[0-9]/, {
    message: 'A senha deve conter pelo menos um numero',
  })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: 'A senha deve conter pelo menos um caractere especial',
  })
  password: string;
}
