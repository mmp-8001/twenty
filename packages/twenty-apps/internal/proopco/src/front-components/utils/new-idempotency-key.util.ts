// The front-component sandbox does not always expose crypto.randomUUID, and the key only has to be unique per form.
export const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
