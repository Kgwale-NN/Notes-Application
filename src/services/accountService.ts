import * as Crypto from "expo-crypto";

import { readData, saveData } from "@/storage/appStorage";
import {
  removeDevicePassword,
  saveDevicePassword,
  verifyDevicePassword,
} from "@/services/devicePasswordVerifier";
import {
  createPasswordRecord,
  verifyPassword,
} from "@/services/passwordService";
import type { StoredAccount, UserProfile } from "@/types/account";
import { withDeadline } from "@/services/withDeadline";

const ACCOUNTS_KEY = "accounts";

type RegistrationDetails = {
  username: string;
  email: string;
  password: string;
};

export type ProfileChanges = {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
};

function isStoredAccount(value: unknown): value is StoredAccount {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const account = value as Partial<StoredAccount>;
  const credentials = account.credentials;

  return (
    typeof account.profile?.id === "string" &&
    typeof account.profile?.username === "string" &&
    typeof account.profile?.email === "string" &&
    typeof account.profile?.createdAt === "string" &&
    typeof account.profile?.updatedAt === "string" &&
    (
      (credentials?.algorithm === "device-hmac-sha256" &&
        (credentials.keyId === undefined || typeof credentials.keyId === "string")) ||
      (credentials?.algorithm === "pbkdf2-sha256" &&
        typeof credentials.hash === "string" &&
        typeof credentials.salt === "string" &&
        credentials.iterations === 600_000)
    )
  );
}

async function loadAccounts(): Promise<StoredAccount[]> {
  const data = await withDeadline(
    readData(ACCOUNTS_KEY),
    8_000,
    "Notes could not open account storage. Close and reopen the app, then try again."
  );

  if (data === null) {
    return [];
  }

  if (!Array.isArray(data) || !data.every(isStoredAccount)) {
    throw new Error("Saved account data could not be read.");
  }

  return data;
}

let accountWriteQueue: Promise<void> = Promise.resolve();

function writeAccount<T>(operation: () => Promise<T>): Promise<T> {
  const task = accountWriteQueue.then(operation);
  accountWriteQueue = task.then(() => undefined, () => undefined);
  return task;
}

function validateProfile(
  username: string,
  email: string,
  accounts: StoredAccount[],
  accountId?: string
) {
  if (!username) throw new Error("Please enter a username.");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  const otherAccounts = accounts.filter(account => account.profile.id !== accountId);
  if (otherAccounts.some(account => account.profile.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  if (otherAccounts.some(account => account.profile.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("This username is already taken.");
  }
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error("Your password must have at least 8 characters.");
  }
}

export function registerAccount({
  username,
  email,
  password,
}: RegistrationDetails): Promise<UserProfile> {
  const task = writeAccount(async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    validatePassword(password);
    const accounts = await loadAccounts();
    validateProfile(cleanUsername, cleanEmail, accounts);

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
      credentials: { algorithm: "device-hmac-sha256" },
    };

    // Persist a device-only account only after its verifier is safely stored.
    if (!(await saveDevicePassword(account, password))) {
      account.credentials = await createPasswordRecord(password);
    }
    await saveData(ACCOUNTS_KEY, [...accounts, account]);

    return profile;
  });

  // Keep writes serialized even if the registration screen stops waiting.
  return withDeadline(
    task,
    140_000,
    "Account creation is taking too long. Try logging in before submitting again."
  );
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

  if (!account || !(await verifyAccountPassword(account, password))) {
    throw new Error("Your email or password is incorrect.");
  }

  return account.profile;
}

async function verifyAccountPassword(account: StoredAccount, password: string): Promise<boolean> {
  const deviceMatch = await verifyDevicePassword(account, password);
  if (deviceMatch !== null) return deviceMatch;

  if (account.credentials.algorithm === "device-hmac-sha256") {
    throw new Error("Notes could not access this account’s password verifier. Open Notes on the device where you created the account and try again.");
  }

  if (await verifyPassword(password, account.credentials)) {
    await saveDevicePassword(account, password);
    return true;
  }

  return false;
}

export function updateAccount(accountId: string, changes: ProfileChanges): Promise<UserProfile> {
  return writeAccount(async () => {
    const username = changes.username.trim();
    const email = changes.email.trim().toLowerCase();
    const { currentPassword, newPassword } = changes;

    if (!currentPassword) throw new Error("Enter your current password.");
    if (newPassword) validatePassword(newPassword);

    const accounts = await loadAccounts();
    const account = accounts.find(item => item.profile.id === accountId);
    if (!account) throw new Error("Your account could not be found.");

    validateProfile(username, email, accounts, accountId);
    if (!(await verifyAccountPassword(account, currentPassword))) {
      throw new Error("Your current password is incorrect.");
    }

    const profile = { ...account.profile, username, email, updatedAt: new Date().toISOString() };
    const updated: StoredAccount = { ...account, profile };

    if (newPassword) {
      // Write to a new key so the current password survives a failed account save.
      updated.credentials = { algorithm: "device-hmac-sha256", keyId: Crypto.randomUUID() };
      if (!(await saveDevicePassword(updated, newPassword))) {
        updated.credentials = await createPasswordRecord(newPassword);
      }
    }

    await saveData(ACCOUNTS_KEY, accounts.map(item => item.profile.id === accountId ? updated : item));
    if (newPassword) await removeDevicePassword(account);

    return profile;
  });
}
