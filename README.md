# lucasflatwhite.com

English | [한국어](README.ko.md)

I'm Lucas Flatwhite, a software engineer who likes spotting problems and figuring out how to solve them. This is my personal site, with projects I've built, AI notes I post on X, and photos from everyday life.

[Visit the site](https://lucasflatwhite.com/) · [GitHub](https://github.com/lucas-flatwhite) · [X](https://x.com/lucas_flatwhite)

## What's here

- A paper board with project cards, a photo slideshow and links to my work.
- Daily Shot, a receipt-shaped link to the AI notes I post on X.
- [AI Timeline Log](https://lucasflatwhite.com/ai-timeline-log/), a record of generative AI since ChatGPT, and [Flatwhite Arcade](https://lucasflatwhite.com/arcade/), a collection of small browser games.
- A command menu (`Cmd/Ctrl + K`) for jumping between projects and links.

Built with Astro, TypeScript and SVG. [AI Timeline Log](https://github.com/lucas-flatwhite/ai-timeline-log) and [Flatwhite Arcade](https://github.com/lucas-flatwhite/flatwhite-arcade) each have their own repository and deployment. This site serves them under one domain.

## Run locally

```sh
npm install
npm run dev          # http://localhost:4321/
```

```sh
npm run check
npm test -- --run
npm run build
```

Project entries live in `src/content/projects/`, photos in `src/content/photos/`, and profile details in `src/data/site.ts`. See [development notes](docs/development.md) for adding photos, generating artwork and connecting the separate apps.
