import path from 'node:path';
import {readFile} from 'node:fs/promises';

import {
  DEFAULT_PARSE_FRONT_MATTER,
  normalizeUrl,
  parseMarkdownContentTitle,
  safeGlobby,
} from '@docusaurus/utils';
import type {LoadContext, Plugin} from '@docusaurus/types';

type LatestNote = {
  title: string;
  href: string;
  date: string;
  displayDate: string;
};

type LatestNotesContent = {
  notes: LatestNote[];
};

function parsePublicationDate(value: unknown): Date | undefined {
  if (!(value instanceof Date) && typeof value !== 'string') {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getDocPath(
  docsDir: string,
  filePath: string,
  slug: unknown,
): string {
  if (typeof slug === 'string') {
    return normalizeUrl(['/atlas', slug]);
  }

  const relativePath = path.relative(docsDir, filePath).replaceAll(path.sep, '/');
  const pathWithoutExtension = relativePath.replace(/\.(?:md|mdx)$/u, '');
  const parts = pathWithoutExtension.split('/');
  const basename = parts.at(-1)?.toLowerCase();
  const parent = parts.at(-2)?.toLowerCase();

  if (basename === 'index' || basename === 'readme' || basename === parent) {
    parts.pop();
  }

  return normalizeUrl(['/atlas', parts.join('/')]);
}

export default function latestAtlasNotesPlugin(
  context: LoadContext,
): Plugin {
  const docsDir = path.join(context.siteDir, 'docs');
  const docsGlob = path.join(docsDir, '**/*.{md,mdx}');

  return {
    name: 'latest-atlas-notes',

    getPathsToWatch() {
      return [docsGlob];
    },

    async loadContent() {
      const filePaths = await safeGlobby([docsGlob], {absolute: true});
      const notes = await Promise.all(
        filePaths.map(async (filePath): Promise<LatestNote | undefined> => {
          if (
            path
              .relative(docsDir, filePath)
              .split(path.sep)
              .some((part) => part.startsWith('_'))
          ) {
            return undefined;
          }

          const fileContent = await readFile(filePath, 'utf8');
          const {frontMatter, content} = await DEFAULT_PARSE_FRONT_MATTER({
            filePath,
            fileContent,
          });
          const publicationDate = parsePublicationDate(frontMatter.date);

          if (
            !publicationDate ||
            frontMatter.draft === true ||
            frontMatter.unlisted === true
          ) {
            return undefined;
          }

          const title =
            typeof frontMatter.title === 'string'
              ? frontMatter.title
              : parseMarkdownContentTitle(content).contentTitle;

          if (!title) {
            return undefined;
          }

          return {
            title,
            href: getDocPath(docsDir, filePath, frontMatter.slug),
            date: publicationDate.toISOString().slice(0, 10),
            displayDate: new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              timeZone: 'UTC',
            }).format(publicationDate),
          };
        }),
      );

      return {
        notes: notes
          .filter((note): note is LatestNote => note !== undefined)
          .sort(
            (left, right) =>
              right.date.localeCompare(left.date) ||
              left.title.localeCompare(right.title),
          )
          .slice(0, 3),
      };
    },

    contentLoaded({content, actions}) {
      actions.setGlobalData(content as LatestNotesContent);
    },
  };
}
