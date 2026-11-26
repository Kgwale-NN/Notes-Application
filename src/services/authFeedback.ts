const MINIMUM_AUTH_FEEDBACK_MS = 450;

export function authFeedbackDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, MINIMUM_AUTH_FEEDBACK_MS));
}
