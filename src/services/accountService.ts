import * as Crypto from "expo-crypto";

import { readData, saveData } from "@/storage/appStorage";
import {
  createPasswordRecord,
  verifyPassword,
} from "@/services/passwordService";
import type { StoredAccount, UserProfile } from "@/types/account";

const ACCOUNTS_KEY = "accounts";

type RegistrationDetails = {
  username: string;
  email: string;
  password: string;
};

function isStoredAccount(value: unknown): value is StoredAccount {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const account = value as Partial<StoredAccount>;

  return (
    typeof account.profile?.id === "string" &&
    typeof account.profile?.username === "string" &&
    typeof account.profile?.email === "string" &&
    typeof account.profile?.createdAt === "string" &&
    typeof account.profile?.updatedAt === "string" &&
    account.credentials?.algorithm === "pbkdf2-sha256" &&
    typeof account.credentials?.hash === "string" &&
    typeof account.credentials?.salt === "string" &&
    account.credentials?.iterations === 600_000
  );
}

async function loadAccounts(): Promise<StoredAccount[]> {
  const data = await readData(ACCOUNTS_KEY);

  if (data === null) {
    return [];
  }

  if (!Array.isArray(data) || !data.every(isStoredAccount)) {
    throw new Error("Saved account data could not be read.");
  }

  return data;
}

let registrationQueue: Promise<void> = Promise.resolve();

export function registerAccount({
  username,
  email,
  password,
}: RegistrationDetails): Promise<UserProfile> {
  const task = registrationQueue.then(async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      throw new Error("Please enter a username.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (password.length < 8) {
      throw new Error("Your password must have at least 8 characters.");
    }

    const accounts = await loadAccounts();

    if (accounts.some(account => account.profile.email === cleanEmail)) {
      throw new Error("An account with this email already exists.");
    }

    if (
      accounts.some(
        account =>
          account.profile.username.toLowerCase() ===
          cleanUsername.toLowerCase()
      )
    ) {
      throw new Error("This username is already taken.");
    }

    const credentials = await createPasswordRecord(password);
    const now = new Date().toISOString();

    const profile: UserProfile = {
      id: Crypto.randomUUID(),
      username: cleanUsername,
      email: cleanEmail,
      createdAt: now,
      updatedAt: now,
    };

    const account: StoredAccount = {
      profile,
      credentials,
    };

    await saveData(ACCOUNTS_KEY, [...accounts, account]);

    return profile;
  });

  registrationQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

export async function loginAccount(
  email: string,
  password: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = await loadAccounts();

  const account = accounts.find(
    item => item.profile.email === cleanEmail
  );

  if (!account) {
    throw new Error("Your email or password is incorrect.");
  }

  const matches = await verifyPassword(password, account.credentials);

  if (!matches) {
    throw new Error("Your email or password is incorrect.");
  }

  return account.profile;
}
