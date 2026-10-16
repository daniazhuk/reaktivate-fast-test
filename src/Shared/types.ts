/** Minimal event shapes controllers accept, so they stay DOM-agnostic and easy to test. */
export type ChangeEventLike = { target: { value: string } };
export type SubmitEventLike = { preventDefault(): void };
