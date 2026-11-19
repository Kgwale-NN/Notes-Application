export type UserProfile = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type PasswordRecord = {
  algorithm: "pbkdf2-sha256";
  hash: string;
  salt: string;
  iterations: number;
};

export type StoredAccount = {
  profile: UserProfile;
  credentials: PasswordRecord;
};