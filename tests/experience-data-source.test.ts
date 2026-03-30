import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const siteDataSource = readFileSync(
  resolve(process.cwd(), 'src/data/site.ts'),
  'utf8',
);

describe('experience data source contract', () => {
  it('defines the one-screen text field content model', () => {
    expect(siteDataSource).toContain('identityLinks');
    expect(siteDataSource).toContain('backgroundWordPool');
    expect(siteDataSource).toContain('burstPhrasePool');
    expect(siteDataSource).toContain('playfieldConfig');
    expect(siteDataSource).toContain('backgroundWordCount: 1080');
    expect(siteDataSource).toContain('pulseRadius: 320');
    expect(siteDataSource).toContain("label: 'GitHub'");
    expect(siteDataSource).toContain("label: 'X'");
    expect(siteDataSource).toContain("'잔물결'");
    expect(siteDataSource).toContain("'안개'");
    expect(siteDataSource).toContain("'복사광'");
    expect(siteDataSource).toContain("'한 모금의 열기가 화면 바깥까지 번져나간다'");
    expect(siteDataSource).toContain("'접힌 문장 사이로 새벽의 향이 새어 나온다'");
    expect(siteDataSource).toContain("'식기 전의 향이 문단 끝까지 천천히 번져 간다'");
    expect(siteDataSource).toContain("'마지막 온기가 접힌 화면 아래로 천천히 스며든다'");
    expect(siteDataSource).toContain("'한 잔의 그림자가 문장보다 오래 남아 흔들린다'");
  });
});
