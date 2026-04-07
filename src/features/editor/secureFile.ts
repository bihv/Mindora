import {
  hydrateMindMapDocument,
  isMindMapDocument,
} from "../../domain/mindmap/documents";
import type { MindMapDocument } from "../../domain/mindmap/model";

type SecureMindMapEnvelope = {
  algorithm: "AES-GCM";
  ciphertext: string;
  iv: string;
  version: 1;
};

const SECURE_FILE_HEADER = "MINDORA_SECURE_V1";
const HARD_CODED_KEY_SEED = "mindora-secure-file-key-v1";

let cachedKeyPromise: Promise<CryptoKey> | null = null;

export const MINDORA_FILE_EXTENSION = "mindora";
export const MINDORA_FILE_EXTENSION_WITH_DOT = ".mindora";
export const MINDORA_FILE_MIME_TYPE = "application/x-mindora";

export async function serializeMindMapFileContents(
  document: MindMapDocument,
): Promise<string> {
  const json = JSON.stringify(hydrateMindMapDocument(document));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getOrCreateSecureFileKey();
  const encodedJson = new TextEncoder().encode(json);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      iv: toArrayBuffer(iv),
      name: "AES-GCM",
    },
    key,
    toArrayBuffer(encodedJson),
  );

  const envelope: SecureMindMapEnvelope = {
    algorithm: "AES-GCM",
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    iv: bytesToBase64(iv),
    version: 1,
  };

  return `${SECURE_FILE_HEADER}\n${JSON.stringify(envelope)}`;
}

export async function parseMindMapFileContents(
  contents: string,
): Promise<MindMapDocument> {
  const newlineIndex = contents.indexOf("\n");

  if (newlineIndex === -1) {
    throw new Error("File is not a valid Mindora secure file.");
  }

  const header = contents.slice(0, newlineIndex).trimEnd();

  if (header !== SECURE_FILE_HEADER) {
    throw new Error("File is not a valid Mindora secure file.");
  }

  const envelopeContents = contents.slice(newlineIndex + 1).trim();
  let envelope: unknown;

  try {
    envelope = JSON.parse(envelopeContents);
  } catch {
    throw new Error("Mindora secure file metadata is corrupted.");
  }

  if (!isSecureMindMapEnvelope(envelope)) {
    throw new Error("Mindora secure file metadata is invalid.");
  }

  const key = await getOrCreateSecureFileKey();
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);

  let decryptedBuffer: ArrayBuffer;

  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        iv: toArrayBuffer(iv),
        name: "AES-GCM",
      },
      key,
      toArrayBuffer(ciphertext),
    );
  } catch {
    throw new Error(
      "Unable to decrypt this Mindora file. It may belong to a different app installation.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(new TextDecoder().decode(decryptedBuffer));
  } catch {
    throw new Error("Mindora secure file contents are corrupted.");
  }

  if (!isMindMapDocument(parsed)) {
    throw new Error("Mindora secure file does not contain a valid map.");
  }

  return hydrateMindMapDocument(parsed);
}

async function getOrCreateSecureFileKey(): Promise<CryptoKey> {
  cachedKeyPromise ??= loadHardCodedSecureFileKey();
  return cachedKeyPromise;
}

async function loadHardCodedSecureFileKey(): Promise<CryptoKey> {
  const encodedSeed = new TextEncoder().encode(HARD_CODED_KEY_SEED);
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(encodedSeed));
  return importKey(new Uint8Array(digest).buffer);
}

async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    {
      length: 256,
      name: "AES-GCM",
    },
    false,
    ["encrypt", "decrypt"],
  );
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.buffer instanceof ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength
  ) {
    return bytes.buffer;
  }

  return new Uint8Array(bytes).buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isSecureMindMapEnvelope(value: unknown): value is SecureMindMapEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const envelope = value as Partial<SecureMindMapEnvelope>;

  return (
    envelope.algorithm === "AES-GCM" &&
    typeof envelope.ciphertext === "string" &&
    typeof envelope.iv === "string" &&
    envelope.version === 1
  );
}
