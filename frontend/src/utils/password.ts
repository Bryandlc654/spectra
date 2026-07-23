export const generatePassword = (length = 16) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_-+=<>?';
  const all = upper + lower + digits + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

export const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: 'Débil', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/4' };
  if (score <= 4) return { label: 'Media', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/4' };
  if (score <= 5) return { label: 'Fuerte', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-3/4' };
  return { label: 'Muy fuerte', color: 'bg-green-600', textColor: 'text-green-700', width: 'w-full' };
};
