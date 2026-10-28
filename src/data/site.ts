export type HomepageSection = {
  id: string;
  label: string;
};

export const homepageSections = [
  { id: 'top', label: 'Intro' },
  { id: 'work', label: 'Work' },
] as const satisfies readonly HomepageSection[];

export type SectionId = (typeof homepageSections)[number]['id'];

export const sectionIds = homepageSections.map(
  (section) => section.id,
) as readonly SectionId[];

export const siteProfile = {
  handle: 'lucas.flatwhite',
  name: 'Lucas Flatwhite',
  nameKo: '루카스 플랫화이트',
  intro: "Endless curiosity. Spotting problems, then solving them. That's the kind of software engineer I am.",
  description:
    'Lucas Flatwhite is an endlessly curious software engineer who spots problems and solves them.',
} as const;
