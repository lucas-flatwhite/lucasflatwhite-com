/**
 * The work card: the badge I wear at KakaoPay Insurance, and the letter it opens on how I
 * see insurance. The badge speaks English like the rest of the board; the letter is
 * available in Korean and English.
 * No middle dots anywhere in this copy.
 */

/** A 16 by 16 dot picture, one string per row: `#` is a dot, `.` is paper. */
export type DotArt = readonly string[];

const database: DotArt = [
  '....########....',
  '..##........##..',
  '.#............#.',
  '.##..........##.',
  '.#.##########.#.',
  '.#............#.',
  '.##..........##.',
  '.#.##########.#.',
  '.#............#.',
  '.##..........##.',
  '.#.##########.#.',
  '.#............#.',
  '.#............#.',
  '..##........##..',
  '....########....',
  '................',
];

const browserOverServers: DotArt = [
  '################',
  '#.#.#..........#',
  '################',
  '#..............#',
  '#...#......#...#',
  '#..#...##...#..#',
  '#...#......#...#',
  '#..............#',
  '################',
  '................',
  '################',
  '#.#.........##.#',
  '################',
  '################',
  '#.#.........##.#',
  '################',
];

const knight: DotArt = [
  '................',
  '......##........',
  '.....####.......',
  '....######......',
  '...###.####.....',
  '..#########.....',
  '..##########....',
  '.....#######....',
  '....#######.....',
  '....######......',
  '...#######......',
  '...#######......',
  '..#########.....',
  '..#########.....',
  '.###########....',
  '.###########....',
];

const umbrella: DotArt = [
  '.......##.......',
  '.....######.....',
  '...##########...',
  '..############..',
  '.##############.',
  '################',
  '#..#...##...#..#',
  '.......##.......',
  '.......##.......',
  '.......##.......',
  '.......##.......',
  '.......##.......',
  '.......##..##...',
  '........####....',
  '................',
  '................',
];

export type WorkScene = { question: string; answer: string; art: DotArt };

export const work = {
  company: 'KakaoPay Insurance',
  summary: 'From backend engineering to full-stack development and tech strategy',
  scenes: [
    { question: 'What do you do here?', answer: 'Backend engineering.', art: database },
    { question: 'What are you building lately?', answer: 'Full-stack development.', art: browserOverServers },
    { question: 'What else?', answer: 'Tech strategy.', art: knight },
  ] satisfies WorkScene[],
  /** What the badge says to a visitor who points at it. */
  visitor: { question: 'How do you see insurance?', answer: "Tap, and I'll tell you.", art: umbrella } satisfies WorkScene,
  letter: {
    eyebrow: 'HOW I SEE INSURANCE',
    title: '보험에 대한 새로운 시각',
    /** The visitor's doubt, then my answer. */
    turns: [
      ['보험, 어렵지 않나요?', '보험은 어렵지 않아요.'],
      ['필요할 땐 오래 걸리잖아요?', '당신이 필요할 때 더 빨리 다가갈게요.'],
      ['막상 일이 생기면요?', '그 순간에 가장 가까이 있어야 해요.'],
    ] as const,
    really: '정말이요.',
    /** One sentence; the words marked true get the highlighter. */
    pledge: [
      ['보험은 ', false],
      ['쉽고', true],
      [', ', false],
      ['친근하고', true],
      [', ', false],
      ['정확하고', true],
      [', ', false],
      ['꼭 필요한 때', true],
      [' 당신을 찾아가야 하고, ', false],
      ['빨라야', true],
      [' 해요.', false],
    ] as const,
    waiting: '그리고 다시 만나고 싶어져야 해요',
    replay: '다시 만나기',
    signature: 'Lucas',
  },
} as const;

export type WorkLanguage = 'en' | 'ko';
export const workLetters = {
  ko: { ...work.letter, eyebrow: '보험을 바라보는 시각', close: '닫기', languageLabel: '언어', replay: '강조 다시 보기' },
  en: {
    eyebrow: 'HOW I SEE INSURANCE',
    title: 'A fresh perspective on insurance',
    turns: [
      ["Isn't insurance complicated?", "It doesn't have to be."],
      ["Doesn't it take too long when I need it?", "I'll help it reach you faster when you need it."],
      ['What if something actually happens?', "That's when we should be closest to you."],
    ],
    really: 'I mean it.',
    pledge: [
      ['Insurance should be ', false], ['simple', true], [', ', false],
      ['approachable', true], [', and ', false], ['accurate', true],
      ['. It should reach you ', false], ['when you need it most', true],
      [', and it should be ', false], ['fast', true], ['.', false],
    ],
    waiting: 'And leave you wanting to meet again.',
    replay: 'Replay highlights',
    signature: 'Lucas',
    close: 'Close',
    languageLabel: 'Language',
  },
} as const;
