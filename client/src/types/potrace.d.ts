declare module "potrace" {
  interface PotraceOptions {
    turnPolicy?: string;
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
  }

  function trace(
    input: Buffer | string,
    callback: (err: Error | null, svg: string) => void
  ): void;

  function trace(
    input: Buffer | string,
    options: PotraceOptions,
    callback: (err: Error | null, svg: string) => void
  ): void;

  export { trace, PotraceOptions };
  export default { trace };
}
