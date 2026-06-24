import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const entryPoints = [
  {
    eyebrow: 'Atlas',
    title: 'Personal notes',
    href: '/atlas',
    description:
      'A structured notebook for AI, mathematics, systems, algorithms, and engineering concepts.',
    meta: 'research memory',
  },
  {
    eyebrow: 'Blog',
    title: 'Writing',
    href: '/blog',
    description:
      'Essays, project logs, and thoughts that need more room than an Atlas note.',
    meta: 'essays',
  },
  {
    eyebrow: 'Projects',
    title: 'Things I build',
    href: 'https://github.com/naatyu',
    description:
      'Selected experiments and repositories around machine learning, kernels, and technical exploration.',
    meta: 'workbench',
  },
] as const;

const pinnedRepos = [
  {
    name: 'MagNav',
    href: 'https://github.com/naatyu/MagNav',
    path: 'naatyu/MagNav',
    description: 'Aircraft magnetic disturbance field compensation with deep learning',
    topics: ['deep learning', 'signal processing', 'navigation'],
  },
  {
    name: 'Looped-Transformer',
    href: 'https://github.com/naatyu/Looped-Transformer',
    path: 'naatyu/Looped-Transformer',
    description: 'Repository to explore recurrent depth transformers (also named looped transformer)',
    topics: ['transformers', 'research', 'architecture'],
  },
  {
    name: 'SigReg-Kernel',
    href: 'https://github.com/naatyu/SigReg-Kernel',
    path: 'naatyu/SigReg-Kernel',
    description: 'Writing GPU kernel to optimize SigReg - Sketeched Isotropic Gaussian Regularizer',
    topics: ['gpu', 'kernels', 'optimization'],
  },
] as const;

const featuredNotes = [
  {
    title: 'SIGReg',
    href: '/atlas/ai/training/losses/regularization/sketched-isotropic-gaussian-regularization',
    meta: 'regularization',
  },
  {
    title: 'FlashAttention',
    href: '/atlas/ai/architectures/transformers/flashattention',
    meta: 'kernels',
  },
  {
    title: 'Model FLOPs utilization',
    href: '/atlas/systems/performance/model-flops-utilization-mfu',
    meta: 'systems',
  },
] as const;

const publications = [
  {
    title: 'Neural Network Calibration of Airborne Magnetometers',
    href: 'https://ieeexplore.ieee.org/document/10189964',
    authors: 'Nathan Laoué, Arnaud Lepers, Laure Deletraz, Charly Faure',
    venue: '2023 IEEE 10th International Workshop on Metrology for AeroSpace (MetroAeroSpace)',
    details: 'Milan, Italy · pp. 37-42 · DOI: 10.1109/MetroAeroSpace57412.2023.10189964',
    summary:
      'Neural-network-based calibration for airborne magnetometers, improving compensation of aircraft magnetic disturbances.',
  },
] as const;

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="Personal website for AI notes, blog posts, and projects.">
      <main>
        <section className={styles.heroSection}>
          <div className="container">
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.kicker}>personal field notes</p>
                <Heading as="h1" className={styles.pageTitle}>
                  Nathan Laoué
                </Heading>
                <p className={styles.lead}>
                  A personal space for my notes, projects, and occasional writings.
                  I'am mainly interested in large models pretraining, regardless of modality (some finetunining too).
                </p>
                <div className={styles.heroActions}>
                  <Link className={styles.primaryLink} to="/atlas">
                    Open Atlas
                  </Link>
                  <Link className={styles.secondaryLink} to="/blog">
                    Read blog
                  </Link>
                </div>
              </div>

              <aside className={styles.mathPanel} aria-label="Site focus">
                <div className={styles.panelHeader}>
                  <span>from the atlas</span>
                  <span>selected</span>
                </div>
                <div className={styles.noteList}>
                  {featuredNotes.map((note) => (
                    <Link key={note.href} className={styles.noteRow} to={note.href}>
                      <span>{note.title}</span>
                      <span>{note.meta}</span>
                    </Link>
                  ))}
                </div>
                <p className={styles.panelNote}>
                  A few useful entry points into the notebook: architecture, kernels,
                  and performance.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.entrySection}>
          <div className="container">
            <div className={styles.entryGrid}>
              {entryPoints.map((entry) => (
                <Link key={entry.title} className={styles.entryCard} to={entry.href}>
                  <p className={styles.cardEyebrow}>{entry.eyebrow}</p>
                  <Heading as="h2" className={styles.entryTitle}>
                    {entry.title}
                  </Heading>
                  <p>{entry.description}</p>
                  <span>{entry.meta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.publicationSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>published work</p>
                <Heading as="h2" className={styles.sectionTitle}>
                  Publications
                </Heading>
              </div>
            </div>

            <div className={styles.publicationGrid}>
              {publications.map((publication) => (
                <Link
                  key={publication.href}
                  className={styles.publicationCard}
                  href={publication.href}>
                  <div className={styles.publicationMeta}>
                    <span>IEEE</span>
                    <span>2023</span>
                  </div>
                  <Heading as="h2" className={styles.publicationTitle}>
                    {publication.title}
                  </Heading>
                  <p className={styles.publicationAuthors}>{publication.authors}</p>
                  <p className={styles.publicationVenue}>{publication.venue}</p>
                  <p className={styles.publicationSummary}>{publication.summary}</p>
                  <div className={styles.publicationFooter}>
                    <span>{publication.details}</span>
                    <span>Open paper ↗</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className={styles.projectSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>selected repositories</p>
                <Heading as="h2" className={styles.sectionTitle}>
                  Projects
                </Heading>
              </div>
              <Link className={styles.textLink} href="https://github.com/naatyu">
                GitHub profile
              </Link>
            </div>

            <div className={styles.repoGrid}>
              {pinnedRepos.map((repo) => (
                <Link key={repo.name} className={styles.repoCard} href={repo.href}>
                  <div className={styles.repoCardHeader}>
                    <div>
                      <p className={styles.repoPath}>{repo.path}</p>
                      <Heading as="h2" className={styles.repoTitle}>
                        {repo.name}
                      </Heading>
                    </div>
                    <span className={styles.repoArrow}>↗</span>
                  </div>
                  <p className={styles.repoDescription}>{repo.description}</p>
                  <div className={styles.badgeRow}>
                    {repo.topics.map((topic) => (
                      <span key={topic} className={styles.topicBadge}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
