import { getCollection } from 'astro:content';
import { sectionIds } from '../data/site';
import { buildPaletteCommands, type PaletteCommand } from './command-actions';
import { withBase } from './paths';
import { placeProjects } from './projects';

/**
 * The one list behind the homepage's Cmd/Ctrl+K menu and `/commands.json`, which the
 * arcade lobby reads so both menus stay the same without a second copy.
 */
export async function loadPaletteCommands(): Promise<PaletteCommand[]> {
  const projects = placeProjects(await getCollection('projects')).palette.map((entry) => ({
    id: entry.id,
    title: entry.data.title,
    tags: entry.data.tags,
    href: entry.data.href,
    order: entry.data.order,
    featured: entry.data.featured,
  }));

  return buildPaletteCommands(withBase(), withBase('arcade/'), sectionIds, projects);
}
