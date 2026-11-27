export const verificationStates = ["verifying", "challenge", "waiting", "error_challenge", "error_details", "timeout", "success"] as const;
export type VerificationState = typeof verificationStates[number];
export type FrameState = VerificationState | "idle";
export type DemoResponse = "confirm" | "quickApproval" | "retry" | "correctDetails" | "close";
export type PreviewSession = {
  state: FrameState;
  ready: boolean;
  response: "" | "DEMO" | "APPROMT";
  result: "" | "success" | "error";
};

export const initialPreviewSession: PreviewSession = { state: "verifying", ready: true, response: "", result: "" };

/** Local UI state only; no customer identifier or form values enter this model. */
export function decidePreview(session: PreviewSession, state: VerificationState): PreviewSession {
  if (!session.ready) return session;
  return { ...session, state, ready: false, response: state === "challenge" ? "" : session.response,
    result: state === "success" ? "success" : state.startsWith("error_") ? "error" : "" };
}

export function respondPreview(session: PreviewSession, response: DemoResponse): PreviewSession {
  if (response === "close") return { ...session, state: "idle", ready: false };
  return { ...session, ready: true, result: "", response: response === "quickApproval" ? "APPROMT" : response === "confirm" ? "DEMO" : "" };
}

export const isPreviewLoading = (state: FrameState) => state === "verifying" || state === "waiting";