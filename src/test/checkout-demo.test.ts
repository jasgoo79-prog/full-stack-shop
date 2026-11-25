import { describe, expect, it } from "vitest";
import { DEMO_CODE, transitionDemo } from "@/lib/checkout-demo";

describe("isolated checkout demo", () => {
  it("only uses the fixed fictitious code", () => {
    expect(DEMO_CODE).toBe("000000");
  });
  it("requires the loading and demo-code steps before approval", () => {
    expect(transitionDemo("ready", "approve")).toBe("ready");
    expect(transitionDemo("loading", "approve")).toBe("loading");
    expect(transitionDemo("otp", "approve")).toBe("otp");
    let stage = transitionDemo("ready", "start");
    expect(stage).toBe("loading");
    stage = transitionDemo(stage, "request-code");
    expect(stage).toBe("otp");
    stage = transitionDemo(stage, "use-demo-code");
    expect(stage).toBe("review");
    expect(transitionDemo(stage, "approve")).toBe("approved");
  });
  it("supports simulated rejection and reset", () => {
    expect(transitionDemo("loading", "reject")).toBe("rejected");
    expect(transitionDemo("otp", "reject")).toBe("rejected");
    expect(transitionDemo("review", "reject")).toBe("rejected");
    expect(transitionDemo("approved", "reset")).toBe("ready");
    expect(transitionDemo("rejected", "reset")).toBe("ready");
  });
});