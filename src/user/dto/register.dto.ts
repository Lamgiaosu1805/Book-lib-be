import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Password phải >= 6 ký tự' })
  @Matches(/[A-Z]/, { message: 'Password phải có ít nhất 1 chữ hoa' })
  @Matches(/[0-9]/, { message: 'Password phải có ít nhất 1 chữ số' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password phải có ít nhất 1 ký tự đặc biệt' })
  password: string;
}
