export type DemoStage = "ready" | "loading" | "otp" | "review" | "approved" | "rejected";
export type DemoAction = "start" | "request-code" | "use-demo-code" | "approve" | "reject" | "reset";
export const DEMO_CODE = "000000";

// No visitor data, storage, requests, or payment-provider integration.
export function transitionDemo(stage: DemoStage, action: DemoAction): DemoStage {
  if (action === "reset") return "ready";
  if (stage === "ready" && action === "start") return "loading";
  if (stage === "loading" && action === "request-code") return "otp";
  if (stage === "otp" && action === "use-demo-code") return "review";
  if (stage === "review" && action === "approve") return "approved";
  if ((stage === "loading" || stage === "otp" || stage === "review") && action === "reject") return "rejected";
  return stage;
}