import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { sha256Hex, canonicalStringify } from "@/lib/audit/sha256";

// Pins the audit payload hash to a REAL SHA-256 (not the old char-code hash).
// Correctness is proven two ways:
//   1. FIPS 180-2 known-answer vectors (independent of any local crypto lib).
//   2. Cross-check against node:crypto for arbitrary / multi-block inputs.

function nodeSha256(message: string): string {
  return createHash("sha256").update(message, "utf8").digest("hex");
}

describe("sha256Hex", () => {
  it("matches FIPS 180-2 vector for empty string", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("matches FIPS 180-2 vector for 'abc'", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("matches FIPS 180-2 vector for the 56-char two-block message", () => {
    const msg =
      "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
    expect(sha256Hex(msg)).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    );
  });

  it("matches FIPS 180-2 vector for the 1,000,000 x 'a' message", () => {
    const msg = "a".repeat(1_000_000);
    expect(sha256Hex(msg)).toBe(
      "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0"
    );
  });

  it("agrees with node:crypto for arbitrary multi-block inputs", () => {
    const samples = [
      "hello world",
      "The quick brown fox jumps over the lazy dog",
      "a".repeat(63), // one block boundary
      "a".repeat(64),
      "a".repeat(65),
      "a".repeat(119), // two-block boundary
      "a".repeat(120),
      "a".repeat(128),
      JSON.stringify({ b: 2, a: 1, c: { z: 26, y: 25 } }),
      "unicode: café ☕ 東京",
    ];
    for (const s of samples) {
      expect(sha256Hex(s)).toBe(nodeSha256(s));
    }
  });

  it("is deterministic and 64 lowercase hex chars", () => {
    const h1 = sha256Hex("payload");
    const h2 = sha256Hex("payload");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different digests for different inputs (no trivial collisions)", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
    expect(sha256Hex("1")).not.toBe(sha256Hex("2"));
  });
});

describe("canonicalStringify", () => {
  it("is independent of top-level key insertion order", () => {
    expect(canonicalStringify({ a: 1, b: 2, c: 3 })).toBe(
      canonicalStringify({ c: 3, a: 1, b: 2 })
    );
  });

  it("is independent of NESTED key insertion order (the old bug)", () => {
    const x = { outer: { z: 26, a: 1 }, list: [1, 2, 3] };
    const y = { list: [1, 2, 3], outer: { a: 1, z: 26 } };
    expect(canonicalStringify(x)).toBe(canonicalStringify(y));
  });

  it("preserves array order (arrays are ordered, not sorted)", () => {
    expect(canonicalStringify({ a: [3, 1, 2] })).toBe('{"a":[3,1,2]}');
    expect(canonicalStringify({ a: [3, 1, 2] })).not.toBe(
      canonicalStringify({ a: [1, 2, 3] })
    );
  });

  it("handles null, undefined-in-object, booleans, and numbers", () => {
    expect(canonicalStringify(null)).toBe("null");
    expect(canonicalStringify({ a: null, b: true, c: 1.5 })).toBe(
      '{"a":null,"b":true,"c":1.5}'
    );
  });

  it("produces a stable hash regardless of key order (end-to-end)", () => {
    const h1 = sha256Hex(canonicalStringify({ rollYear: 2025, cod: 12.3 }));
    const h2 = sha256Hex(canonicalStringify({ cod: 12.3, rollYear: 2025 }));
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});