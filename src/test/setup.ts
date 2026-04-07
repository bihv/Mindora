import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe(): void {}

  disconnect(): void {}

  unobserve(): void {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: () =>
    ({
      font: "",
      measureText: (value: string) => ({ width: value.length * 8 }),
    }) as CanvasRenderingContext2D,
});

if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    configurable: true,
    value: () => "test-random-uuid",
  });
}
