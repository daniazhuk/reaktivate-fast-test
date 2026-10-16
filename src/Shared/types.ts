/** Minimal event shapes controllers accept, so they stay DOM-agnostic and easy to test. */
export type ValueChangeEvent = { target: { value: string } };
export type SubmitEvent = { preventDefault(): void };
