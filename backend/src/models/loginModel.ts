export type LoginEntry = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createLoginEntry(payload: {
  username: string;
  email: string;
  passwordHash: string;
}): LoginEntry {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    username: payload.username,
    email: payload.email,
    password_hash: payload.passwordHash,
    createdAt: now,
    updatedAt: now,
  };
}
