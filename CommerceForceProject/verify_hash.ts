import bcrypt from 'bcryptjs';

const hash = '$2a$10$vI8tmZH.3hPjgvy.UX7Yme/99FJKGEqxEnJuK9WtxELeU8TX5Z/5.';
const password = 'admin123';

async function verify() {
  const result = await bcrypt.compare(password, hash);
  console.log(`Verification result: ${result}`);
}

verify();
