import * as Crypto from "expo-crypto";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

import type { PasswordRecord } from "@/types/account";

const ITERATIONS = 600_000;

async function calculateHash(password: string, salt: string) {
  const result = await pbkdf2Async(
    sha256,
    password,
    hexToBytes(salt),
    {
      c: ITERATIONS,
      dkLen: 32,
      asyncTick: 10,
    }
  );

  return bytesToHex(result);
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