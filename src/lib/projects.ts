type ProjectEntry = {
  data: {
    title: string;
    featured: boolean;
    order: number;
  };
};

export function sortFeaturedProjects<T extends ProjectEntry>(entries: T[]): T[] {
  return entries
    .filter((entry) => entry.data.featured)
    .sort((left, right) => left.data.order - right.data.order);
}
