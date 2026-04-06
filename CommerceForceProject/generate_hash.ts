import bcrypt from 'bcryptjs';

const password = 'admin123';

async function generate() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`Hash for ${password}: ${hash}`);
}

generate();
