import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BinaryBitmap, DecodeHintType, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';
import jsQR from 'jsqr';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CARD_INPUTS, hashInputs } from '../scripts/card/inputs.ts';
import { CARD_QR_TEXT } from '../src/data/card';

const image = resolve(process.cwd(), 'public/card.png');
const baked = resolve(process.cwd(), 'scripts/card/baked.json');

/** jsQR, at a width a phone camera would see the image at. */
async function decode(width: number): Promise<string | null> {
  const { data, info } = await sharp(image).resize(width).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

/** ZXing, the decoder family behind Android and KakaoTalk scanners, on the image as it is. */
async function decodeFullSize(): Promise<string> {
  const { data, info } = await sharp(image).greyscale().raw().toBuffer({ resolveWithObject: true });
  const source = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
  const hints = new Map([[DecodeHintType.TRY_HARDER, true]]);
  return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(source)), hints).getText();
}

describe('the card image anyone can save', () => {
  it('is baked from the card, the copy, the QR drawing and my face', () => {
    expect(CARD_INPUTS).toEqual([
      'src/components/BusinessCard.astro',
      'src/data/card.ts',
      'src/lib/qr.ts',
      'src/assets/card/avatar.png',
    ]);
  });

  it('is one full-bleed portrait card, 1080 by 1944', async () => {
    expect(existsSync(image)).toBe(true);
    const { width, height } = await sharp(image).metadata();
    expect([width, height]).toEqual([1080, 1944]);
  });

  it('carries a QR that reads as my address, full size and shrunk to 300px wide', async () => {
    // jsQR alone misses this code above about 800px wide, where ZXing (and a phone) reads it.
    expect(await decodeFullSize()).toBe(CARD_QR_TEXT);
    expect(await decode(720)).toBe(CARD_QR_TEXT);
    expect(await decode(300)).toBe(CARD_QR_TEXT);
  });

  it('matches the card as it is now', () => {
    const { hash } = JSON.parse(readFileSync(baked, 'utf8')) as { hash: string };
    expect(hash, 'The card changed since the image was baked. Run npm run card').toBe(hashInputs(process.cwd()));
  });
});
