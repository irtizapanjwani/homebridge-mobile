/// <reference types="node" />
// The brand fonts for server-side PDFs. The website reads them from assets/fonts; the app embeds
// them (font-data.ts) so nothing depends on files being deployed next to the function.

import * as data from './font-data';

export type BrandFonts = Record<'loraBold' | 'loraRegular' | 'poppins' | 'poppinsSemi', Buffer>;

let cache: BrandFonts | null = null;

export async function embeddableFonts(): Promise<BrandFonts> {
  cache ??= {
    loraBold: Buffer.from(data.loraBold, 'base64'),
    loraRegular: Buffer.from(data.loraRegular, 'base64'),
    poppins: Buffer.from(data.poppins, 'base64'),
    poppinsSemi: Buffer.from(data.poppinsSemi, 'base64'),
  };
  return cache;
}
