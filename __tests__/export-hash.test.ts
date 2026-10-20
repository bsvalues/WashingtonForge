/**
 * Court-Ready Export Hashing — Unit Tests
 *
 * Proves the court-packet export path computes REAL SHA-256 digests, not the
 * old char-code / Math.random() simulation. Uses known-answer vectors: the
 * expected digests are the canonical SHA-256 of the inputs, independently
 * verifiable (e.g. `echo -n abc | sha256sum`).
 *
 * Regression guard: if anyone reverts to a fake hash, the known-answer
 * assertions fail immediately.
 */

import { describe, it, expect } from "vitest";

import { sha256Hex, generatePackageHash, generateSignatureHash } from "@/lib/export/hash";

describe("sha256Hex", () => {
  it("matches the canonical SHA-256 of 'abc' (FIPS 180-2 test vector)", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("matches the canonical SHA-256 of the empty string", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("returns a 64-char lowercase hex string", () => {
    expect(sha256Hex("some parcel payload")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for identical input", () => {
    expect(sha256Hex("stable")).toBe(sha256Hex("stable"));
  });

  it("differs for different input", () => {
    expect(sha256Hex("parcel A")).not.toBe(sha256Hex("parcel B"));
  });
});

describe("generatePackageHash", () => {
  const payload = {
    parcel_id: "P1",
    county_fips: "03051",
    roll_year: 2024,
    sections: ["property_summary"],
    format: "pdf",
  };
  const timestamp = "2026-01-01T00:00:00.000Z";

  it("is a real SHA-256 over the canonical payload + timestamp (known answer)", () => {
    expect(generatePackageHash(payload, timestamp)).toBe(
      "sha256:2fe5ffbd25bb6a0232ad06470768fbf49eca301d77b2cafbf05a05cbf9b97787"
    );
  });

  it("is prefixed with 'sha256:' and carries a 64-hex digest", () => {
    expect(generatePackageHash(payload, timestamp)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("changes when the payload changes", () => {
    const a = generatePackageHash(payload, timestamp);
    const b = generatePackageHash({ ...payload, parcel_id: "P2" }, timestamp);
    expect(a).not.toBe(b);
  });

  it("changes when the timestamp changes", () => {
    const a = generatePackageHash(payload, timestamp);
    const b = generatePackageHash(payload, "2026-01-02T00:00:00.000Z");
    expect(a).not.toBe(b);
  });
});

describe("generateSignatureHash", () => {
  const packageHash = "sha256:2fe5ffbd25bb6a0232ad06470768fbf49eca301d77b2cafbf05a05cbf9b97787";
  const certifiedBy = "03051 County Assessor";
  const certifiedAt = "2026-01-01T00:00:00.000Z";

  it("is a real SHA-256 binding package + certifier + time (known answer)", () => {
    expect(generateSignatureHash(packageHash, certifiedBy, certifiedAt)).toBe(
      "sig:eb710291ebe5eed0b70b598a782df58382bd3b9979b77da743b73b25e00d0e7e"
    );
  });

  it("is prefixed with 'sig:' and carries a 64-hex digest", () => {
    expect(generateSignatureHash(packageHash, certifiedBy, certifiedAt)).toMatch(
      /^sig:[0-9a-f]{64}$/
    );
  });

  it("binds to the certifier identity (different certifier → different sig)", () => {
    const a = generateSignatureHash(packageHash, certifiedBy, certifiedAt);
    const b = generateSignatureHash(packageHash, "03061 County Assessor", certifiedAt);
    expect(a).not.toBe(b);
  });

  it("binds to the package (different package → different sig)", () => {
    const a = generateSignatureHash(packageHash, certifiedBy, certifiedAt);
    const b = generateSignatureHash(
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      certifiedBy,
      certifiedAt
    );
    expect(a).not.toBe(b);
  });
});
