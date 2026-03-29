import { defineConfig } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY ?? 'lucas-flatwhite/lucasflatwhite-com';
const [repoOwner = 'lucas-flatwhite', repoName = 'lucasflatwhite-com'] = repository.split('/');
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true'
  && process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGitHubPagesBuild
    ? `https://${repoOwner}.github.io/${repoName}`
    : 'https://lucasflatwhite.com',
  base: isGitHubPagesBuild ? `/${repoName}` : undefined,
});
