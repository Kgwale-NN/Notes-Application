import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

import { withDeadline } from "@/services/withDeadline";
import type { StoredAccount } from "@/types/account";

const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const hex256 = /^[0-9a-f]{64}$/;

function storageKey(account: StoredAccount) {
  const { credentials } = account;
  const key = "notes.password-verifier.v1." + account.profile.id;
  return credentials.algorithm === "device-hmac-sha256" && credentials.keyId
    ? key + "." + credentials.keyId
    : key;
}

function credentialVersion({ credentials }: StoredAccount) {
  if (credentials.algorithm === "device-hmac-sha256") return credentials.algorithm;

  return [credentials.algorithm, credentials.iterations, credentials.salt, credentials.hash].join(".");
}

function passwordTag(secret: Uint8Array, password: string) {
  const bytes = utf8ToBytes(password);
  try {
    return hmac(sha256, secret, bytes);
  } finally {
    bytes.fill(0);
  }
}

// A null result lets the caller distinguish an unavailable verifier from a wrong password.
export async function verifyDevicePassword(
  account: StoredAccount,
  password: string
): Promise<boolean | null> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return null;

    const saved = await withDeadline(
      SecureStore.getItemAsync(storageKey(account), options),
      1_500,
      "Device password verifier could not be read."
    );
    if (!saved) return null;

    const [version, secretHex, tagHex] = saved.split(":");
    if (version !== credentialVersion(account) || !hex256.test(secretHex) || !hex256.test(tagHex)) {
      return null;
    }

    const secret = hexToBytes(secretHex);
    const expected = hexToBytes(tagHex);
    const actual = passwordTag(secret, password);
    let differences = 0;
    for (let index = 0; index < expected.length; index++) {
      differences |= expected[index] ^ actual[index];
    }
    secret.fill(0);
    actual.fill(0);
    return differences === 0;
  } catch {
    return null;
  }
}

export async function saveDevicePassword(account: StoredAccount, password: string): Promise<boolean> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return false;

    const secret = await Crypto.getRandomBytesAsync(32);
    const tag = passwordTag(secret, password);
    const value = [credentialVersion(account), bytesToHex(secret), bytesToHex(tag)].join(":");
    secret.fill(0);
    tag.fill(0);
    await withDeadline(
      SecureStore.setItemAsync(storageKey(account), value, options),
      1_500,
      "Device password verifier could not be saved."
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeDevicePassword(account: StoredAccount): Promise<void> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return;
    await withDeadline(
      SecureStore.deleteItemAsync(storageKey(account), options),
      1_500,
      "The previous device password verifier could not be removed."
    );
  } catch {
    // The saved account already points to the new verifier.
  }
}
