import * as Crypto from "expo-crypto";

import { readData, saveData } from "@/storage/appStorage";
import { saveDevicePassword, verifyDevicePassword } from "@/services/devicePasswordVerifier";
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
      credentials?.algorithm === "device-hmac-sha256" ||
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

  registrationQueue = task.then(
    () => undefined,
    () => undefined
  );

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

  if (!account) {
    throw new Error("Your email or password is incorrect.");
  }

  const deviceMatch = await verifyDevicePassword(account, password);
  if (deviceMatch === true) return account.profile;

  if (deviceMatch === null) {
    if (account.credentials.algorithm === "device-hmac-sha256") {
      throw new Error("Notes could not access this account’s password verifier. Open Notes on the device where you created the account and try again.");
    }

    if (await verifyPassword(password, account.credentials)) {
      await saveDevicePassword(account, password);
      return account.profile;
    }
  }

  throw new Error("Your email or password is incorrect.");
}
