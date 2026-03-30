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
    expect(siteDataSource).toContain('burstPhrasePoolKo');
    expect(siteDataSource).toContain('burstPhrasePoolEn');
    expect(siteDataSource).toContain('playfieldConfig');
    expect(siteDataSource).toContain('backgroundWordCount: 1080');
    expect(siteDataSource).toContain('pulseRadius: 320');
    expect(siteDataSource).toContain("label: 'GitHub'");
    expect(siteDataSource).toContain("label: 'X'");
    expect(siteDataSource).toContain("'handoff'");
    expect(siteDataSource).toContain("'rollback'");
    expect(siteDataSource).toContain("'wireframe'");
    expect(siteDataSource).toContain("'로드맵'");
    expect(siteDataSource).toContain("'배포'");
    expect(siteDataSource).toContain("'npm install은 끝났는데 문제는 방금 시작됐다'");
    expect(siteDataSource).toContain("'백엔드는 200을 줬고 프론트는 영혼을 잃었다'");
    expect(siteDataSource).toContain("'git stash에 넣어둔 용기가 아직 checkout되지 않았다'");
    expect(siteDataSource).toContain("'LLM은 자신만만했고 로그는 점점 시적이 됐다'");
    expect(siteDataSource).toContain("'the build passed and the bug updated its linkedin'");
    expect(siteDataSource).toContain("'frontend shipped pixels and backend shipped character development'");
    expect(siteDataSource).toContain("'git said already up to date and my anxiety opened a new branch'");
    expect(siteDataSource).toContain("'the ai wrote the draft and the human wrote the apology'");
    expect(siteDataSource).not.toContain("'한 모금의 열기가 화면 바깥까지 번져나간다'");
    expect(siteDataSource).not.toContain("'잔물결'");
  });
});
