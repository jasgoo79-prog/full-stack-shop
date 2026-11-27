import { describe, expect, it } from "vitest";
import { decidePreview, initialPreviewSession, isPreviewLoading, respondPreview } from "@/lib/verification-preview";

describe("isolated fictional admin session", () => {
  it.each(["challenge", "error_challenge", "error_details", "success"] as const)("locks every decision immediately after %s", state => {
    const session = decidePreview(initialPreviewSession, state);
    expect(session.ready).toBe(false);
    expect(decidePreview(session, "success")).toBe(session);
  });

  it.each(["confirm", "quickApproval", "retry", "correctDetails"] as const)("unlocks all decisions together after %s", response => {
    const session = respondPreview(decidePreview(initialPreviewSession, "challenge"), response);
    expect(session.ready).toBe(true);
  });

  it("records APPROMT for simulated quick approval, without receiving inputs", () => {
    expect(respondPreview(initialPreviewSession, "quickApproval").response).toBe("APPROMT");
    expect(respondPreview(initialPreviewSession, "confirm").response).toBe("DEMO");
  });

  it.each(["verifying", "waiting"] as const)("animates loading during %s", state => {
    expect(isPreviewLoading(state)).toBe(true);
  });

  it.each(["idle", "challenge", "error_challenge", "error_details", "timeout", "success"] as const)("stops loading during %s", state => {
    expect(isPreviewLoading(state)).toBe(false);
  });

  it("keeps Submit blank initially and sets success/error only after a decision", () => {
    expect(initialPreviewSession.result).toBe("");
    expect(decidePreview(initialPreviewSession, "success").result).toBe("success");
    expect(decidePreview(initialPreviewSession, "error_challenge").result).toBe("error");
    expect(decidePreview(initialPreviewSession, "error_details").result).toBe("error");
  });
});