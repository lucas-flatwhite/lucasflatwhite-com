declare module 'subset-font' {
  type Options = {
    targetFormat?: 'sfnt' | 'woff' | 'woff2' | 'truetype';
    variationAxes?: Record<string, number | { min?: number; max?: number; default?: number }>;
  };

  export default function subsetFont(buffer: Buffer, text: string, options?: Options): Promise<Buffer>;
}
