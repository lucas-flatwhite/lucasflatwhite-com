export type HomepageSection = {
  id: string;
  label: string;
};

export const homepageSections = [
  { id: 'hero', label: 'Intro' },
  { id: 'projects', label: 'Selected Projects' },
  { id: 'links', label: 'Links' },
] as const satisfies readonly HomepageSection[];

export type SectionId = (typeof homepageSections)[number]['id'];

export const sectionIds = homepageSections.map(
  (section) => section.id,
) as readonly SectionId[];

export type PrimaryLink = {
  label: string;
  href: string;
  external: boolean;
};

export type IdentityLink = {
  label: string;
  href: string;
  external: true;
};

export type BurstPhrase = {
  text: string;
  palette: 'flare' | 'mint' | 'heat' | 'sunset';
  intensity: number;
};

export type RecommendedCommand =
  | {
      id: string;
      label: string;
      description: string;
      kind: 'scroll';
      target: Exclude<SectionId, 'hero'>;
    }
  | {
      id: string;
      label: string;
      description: string;
      kind: 'link';
      href: string;
    };

export const siteProfile = {
  handle: 'lucas.flatwhite',
  name: 'Lucas Flatwhite',
  heroTitle: '/lucas-flatwhite',
  heroTagline: 'Building calm, useful things on the web.',
  title: 'Developer building tools, translations, and useful web experiences.',
  intro:
    'I build tools, translations, and small web experiences with a clear, terminal-forward feel.',
  availability: 'Available for interesting collaborations and experiments.',
  experienceTitle: 'A kinetic Korean text field for lucasflatwhite.',
  experienceDescription:
    'Steer through a dense field of Korean words and trigger loud typographic bursts built with pretext.',
} as const;

export const primaryLinks = [
  {
    label: 'Projects',
    href: '#projects',
    external: false,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'Contact',
    href: '#links',
    external: false,
  },
] as const satisfies readonly PrimaryLink[];

export const footerLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'X',
    href: 'https://x.com/lucas_flatwhite',
    external: true,
  },
] as const satisfies readonly PrimaryLink[];

export const identityLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/lucas-flatwhite/',
    external: true,
  },
  {
    label: 'X',
    href: 'https://x.com/lucas_flatwhite',
    external: true,
  },
] as const satisfies readonly IdentityLink[];

export const playfieldConfig = {
  columns: 30,
  rows: 18,
  backgroundWordCount: 1080,
  baseSpeed: 7,
  burstDurationMs: 920,
  burstLockMs: 320,
  pulseRadius: 320,
  lineHeight: 28,
} as const;

export const backgroundWordPool = [
  '숨',
  '파동',
  '기척',
  '잔물결',
  '미광',
  '잔향',
  '유영',
  '밀도',
  '환기',
  '안개',
  '미세',
  '진동',
  '여운',
  '결',
  '틈',
  '잔열',
  '심도',
  '유동',
  '온도',
  '장면',
  '반사',
  '편린',
  '농도',
  '결정',
  '잔상',
  '복사광',
  '소용돌이',
  '실루엣',
  '선율',
  '유예',
  '잔광',
  '부피',
  '리듬',
  '압력',
  '온기',
  '낙차',
  '파문',
  '기류',
  '중첩',
  '항로',
  '야광',
  '편차',
  '숨결',
  '입자',
  '물비늘',
  '굴절',
  '스펙트럼',
  '번짐',
  '휘도',
  '잔파',
  '유속',
  '고요',
  '투영',
  '표류',
  '진폭',
  '사이',
  '환영',
  '파장',
  '층위',
  '메아리',
  '기압',
  '조도',
  '사광',
  '숨소리',
  '정적',
  '기울기',
  '여백',
  '미동',
  '흔들림',
  '입김',
  '심연',
  '잔흔',
  '호흡',
  '비등',
  '광맥',
  '윤슬',
  '간극',
  '난반사',
  '표정',
  '점멸',
  '곡면',
  '낙광',
  '박동',
  '비늘',
  '수면',
  '사선',
  '변주',
  '연무',
  '월광',
  '미류',
  '미립자',
  '여진',
  '상흔',
  '조류',
  '부유',
  '미광선',
  '반동',
  '전류',
  '속도',
  '궤적',
  '질감',
  '환류',
  '열섬',
  '심상',
  '정동',
  '비화',
  '요철',
  '표류광',
  '난류',
  '미명',
  '저편',
  '균열',
  '단층',
  '퇴적',
  '여파',
  '하중',
  '영점',
  '접면',
  '파편',
  '조응',
  '잠영',
  '유실광',
  '울림',
  '유실',
  '원심',
  '흐름',
  '회절',
  '응결',
  '결박',
  '심도장',
  '형광',
  '미세광',
  '상승',
  '파열',
  '명멸',
  '저류',
  '진입',
  '후광',
  '감응',
  '편광',
  '자장',
  '세기',
  '적층',
  '청명',
  '잔결',
  '비정',
  '침잠',
  '순환',
  '와류',
  '해면',
  '기미',
  '잠행',
  '조율',
  '응시',
  '수렴',
  '여명',
  '균질',
  '쇄도',
  '미열',
  '비점',
  '유예광',
  '입계',
  '밀항',
  '면류',
  '유도',
  '격자',
  '잔설',
  '증기',
  '소실점',
  '반투명',
  '도약',
  '유전',
  '반경',
  '여백광',
  '저온',
  '표층',
  '기복',
  '수류',
  '초점',
  '산란',
  '잔주름',
  '부상',
  '내광',
] as const;

export const burstPhrasePool = [
  { text: '조용한 표면 아래에서 문장이 먼저 흔들린다', palette: 'flare', intensity: 1 },
  { text: '눈에 보이지 않던 밀도가 갑자기 색으로 번진다', palette: 'heat', intensity: 2 },
  { text: '한 줄의 리듬이 여러 줄의 파동으로 갈라진다', palette: 'mint', intensity: 2 },
  { text: '문장은 부서지지 않고 더 낯선 배열을 얻는다', palette: 'sunset', intensity: 1 },
  { text: '화면의 공기가 잠깐 접히며 다른 폭을 드러낸다', palette: 'flare', intensity: 3 },
  { text: '먹힌 순간의 좌표에서 새로운 문단이 피어오른다', palette: 'sunset', intensity: 2 },
  { text: '밝아진 어휘는 곧바로 다른 줄 간격을 요구한다', palette: 'mint', intensity: 1 },
  { text: '고요했던 필드가 현란한 정렬감으로 뒤집힌다', palette: 'heat', intensity: 3 },
  { text: '단어는 파티클이 아니라 살아 있는 편집 상태다', palette: 'flare', intensity: 2 },
  { text: '짧은 충격이 지나간 뒤에도 잔상은 천천히 남는다', palette: 'sunset', intensity: 1 },
  { text: '한 문장이 좁아지면 다른 문장은 곧장 옆으로 흐른다', palette: 'mint', intensity: 2 },
  { text: '줄바꿈은 규칙이 아니라 순간적인 기분처럼 바뀐다', palette: 'heat', intensity: 3 },
  { text: '한 모금의 열기가 화면 바깥까지 번져나간다', palette: 'flare', intensity: 3 },
  { text: '접힌 문장 사이로 새벽의 향이 새어 나온다', palette: 'mint', intensity: 2 },
  { text: '낮은 온도의 문장들이 갑자기 선명한 광택을 얻는다', palette: 'sunset', intensity: 2 },
  { text: '검은 파문은 가장 늦게 식고 가장 먼저 반짝인다', palette: 'heat', intensity: 3 },
  { text: '가벼운 증기가 위로 오르며 줄 사이의 질서를 흔든다', palette: 'mint', intensity: 1 },
  { text: '미세한 쓴맛 같은 리듬이 화면 전체를 다시 묶어낸다', palette: 'flare', intensity: 2 },
  { text: '접속되지 않던 어휘들이 뜨거운 가장자리에서 엮여 든다', palette: 'sunset', intensity: 3 },
  { text: '환한 난반사가 문단의 결을 바꾸며 멀리까지 밀려간다', palette: 'heat', intensity: 2 },
  { text: '조용했던 필드는 향처럼 퍼지는 색으로 다시 깨어난다', palette: 'flare', intensity: 1 },
  { text: '한 줄의 열기가 여러 단락의 방향을 바꾸기 시작한다', palette: 'sunset', intensity: 2 },
  { text: '박동하듯 진해진 어휘가 어두운 배경을 천천히 밀어낸다', palette: 'mint', intensity: 2 },
  { text: '뜨거운 중심에서 멀어질수록 문장은 더 낯선 폭을 요구한다', palette: 'heat', intensity: 3 },
  { text: '식기 전의 향이 문단 끝까지 천천히 번져 간다', palette: 'sunset', intensity: 2 },
  { text: '종이 컵의 온기가 접힌 행간 사이를 조용히 밀어 올린다', palette: 'mint', intensity: 1 },
  { text: '첫 모금 같은 농도가 어두운 배경을 깊고 선명하게 바꾼다', palette: 'heat', intensity: 3 },
  { text: '뚜껑 아래에 머물던 열기가 문장 전체의 결을 흔든다', palette: 'flare', intensity: 2 },
  { text: '마지막 온기가 접힌 화면 아래로 천천히 스며든다', palette: 'sunset', intensity: 2 },
  { text: '한 잔의 그림자가 문장보다 오래 남아 흔들린다', palette: 'mint', intensity: 2 },
] as const satisfies readonly BurstPhrase[];

export const recommendedCommands = [
  {
    id: 'view-projects',
    label: 'view projects',
    description: 'Jump to selected work.',
    kind: 'scroll',
    target: 'projects',
  },
  {
    id: 'open-github',
    label: 'open github',
    description: 'Open the GitHub profile.',
    kind: 'link',
    href: 'https://github.com/lucas-flatwhite/',
  },
  {
    id: 'contact',
    label: 'contact',
    description: 'Jump to links and contact options.',
    kind: 'scroll',
    target: 'links',
  },
] as const satisfies readonly RecommendedCommand[];
