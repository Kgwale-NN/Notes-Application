import * as Crypto from "expo-crypto";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { HMAC } from "fast-sha256";

import type { PasswordRecord } from "@/types/account";
import { withDeadline } from "@/services/withDeadline";

const ITERATIONS = 600_000;
const PASSWORD_CHECK_TIMEOUT_MS = 120_000;

async function calculateHash(password: string, salt: string) {
  const saltBytes = hexToBytes(salt);
  const result = await withDeadline(
    derivePasswordKey(password, saltBytes),
    PASSWORD_CHECK_TIMEOUT_MS,
    "Password verification took too long. Restart Notes and try again."
  );

  return bytesToHex(result);
}

async function derivePasswordKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey(
      "raw", utf8ToBytes(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      key,
      256
    );

    return new Uint8Array(bits);
  }

  return deriveInBatches(password, salt);
}

async function deriveInBatches(password: string, salt: Uint8Array) {
  const passwordBytes = utf8ToBytes(password);
  const mac = new HMAC(passwordBytes);
  passwordBytes.fill(0);

  // A 32-byte PBKDF2-SHA256 key needs only block 1.
  const firstInput = new Uint8Array(salt.length + 4);
  firstInput.set(salt);
  firstInput[firstInput.length - 1] = 1;
  const round = new Uint8Array(32);
  const key = new Uint8Array(32);
  const startedAt = Date.now();
  let sliceStartedAt = startedAt;

  try {
    mac.update(firstInput).finish(round);
    key.set(round);

    // Check the scheduler once per batch instead of once per HMAC.
    for (let completed = 1; completed < ITERATIONS;) {
      const end = Math.min(completed + 256, ITERATIONS);
      for (; completed < end; completed++) {
        mac.reset().update(round).finish(round);
        for (let index = 0; index < key.length; index++) {
          key[index] ^= round[index];
        }
      }

      if (Date.now() - sliceStartedAt >= 40 && completed < ITERATIONS) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        sliceStartedAt = Date.now();
        if (sliceStartedAt - startedAt >= PASSWORD_CHECK_TIMEOUT_MS) {
          throw new Error("Password verification took too long. Restart Notes and try again.");
        }
      }
    }

    return key;
  } catch (error) {
    key.fill(0);
    throw error;
  } finally {
    mac.clean();
    round.fill(0);
  }
}

export async function createPasswordRecord(
  password: string
): Promise<PasswordRecord> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const salt = bytesToHex(randomBytes);

  const hash = await calculateHash(password, salt);

  return {
    algorithm: "pbkdf2-sha256",
    hash,
    salt,
    iterations: ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  record: PasswordRecord
): Promise<boolean> {
  if (
    record.algorithm !== "pbkdf2-sha256" ||
    record.iterations !== ITERATIONS ||
    !/^[0-9a-f]{32}$/.test(record.salt) ||
    !/^[0-9a-f]{64}$/.test(record.hash)
  ) {
    return false;
  }

  const hash = await calculateHash(password, record.salt);

  return hash === record.hash;
}
