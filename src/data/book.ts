/**
 * The book card and its store list. The board and the command menu use the English name;
 * the list itself is in Korean, like the book. There is no price on purpose.
 */
export type BookStore = {
  name: string;
  /** The address shown beside the name, without the path. */
  host: string;
  href: string;
  /** A small tag after the name, such as the publisher's. */
  tag?: string;
};

export const book = {
  name: 'Claude, Made Easy',
  summary: 'I wrote a book on working with Claude.',
  title: '루카스의 쉽게 배우고 바로 써먹는 클로드 완벽 활용법',
  tagline: '업무와 일상에서 AI를 제대로 쓰고 싶은 이들을 위한 클로드 실전 입문 가이드',
  meta: '배성율 지음 · 위키북스 · 452쪽',
  stores: [
    { name: '위키북스', host: 'wikibook.co.kr', href: 'https://wikibook.co.kr/lucas-claude/', tag: '출판사' },
    { name: '교보문고', host: 'kyobobook.co.kr', href: 'https://product.kyobobook.co.kr/detail/S000221888560' },
    { name: 'YES24', host: 'yes24.com', href: 'https://www.yes24.com/product/goods/199966065' },
    { name: '알라딘', host: 'aladin.co.kr', href: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=406171287' },
    { name: '영풍문고', host: 'ypbooks.co.kr', href: 'https://www.ypbooks.co.kr/books/202611060951599584' },
  ] satisfies BookStore[],
} as const;
