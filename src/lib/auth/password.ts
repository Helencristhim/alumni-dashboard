import bcrypt from 'bcryptjs';

// Numero de rounds para o hash (10 e um bom balanco entre seguranca e performance)
const SALT_ROUNDS = 10;

/**
 * Gera o hash de uma senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Valida os requisitos minimos de uma senha
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve ter pelo menos uma letra maiuscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve ter pelo menos uma letra minuscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve ter pelo menos um numero');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve ter pelo menos um caractere especial');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gera uma senha aleatoria segura
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = lowercase + uppercase + numbers + special;

  // Garante que a senha tenha pelo menos um de cada tipo
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Preenche o resto com caracteres aleatorios
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha a senha
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
