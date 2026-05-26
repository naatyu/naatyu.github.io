import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const pinnedRepos = [
  {
    name: 'MagNav',
    href: 'https://github.com/naatyu/MagNav',
    description: 'Aircraft magnetic disturbance field compensation with deep learning',
    topics: ['deep learning', 'signal processing', 'navigation'],
  },
  {
    name: 'Looped-Transformer',
    href: 'https://github.com/naatyu/Looped-Transformer',
    description: 'Repository to explore recurrent depth transformers (also named looped transformer)',
    topics: ['transformers', 'research', 'architecture'],
  },
  {
    name: 'SigReg-Kernel',
    href: 'https://github.com/naatyu/SigReg-Kernel',
    description: 'Writing GPU kernel to optimize SigReg - Sketeched Isotropic Gaussian Regularizer',
    topics: ['gpu', 'kernels', 'optimization'],
  },
] as const;

export default function Home(): ReactNode {
  return (
    <Layout
      title="Projects"
      description="Selected GitHub projects.">
      <main>
        <section className={styles.homeSection}>
          <div className="container">
            <div className={styles.headerRow}>
              <div>
                <p className={styles.eyebrow}>GitHub</p>
                <Heading as="h1" className={styles.pageTitle}>
                  Projects
                </Heading>
              </div>
              <Link className="button button--secondary" href="https://github.com/naatyu">
                View profile
              </Link>
            </div>

            <div className={styles.repoGrid}>
              {pinnedRepos.map((repo) => (
                <Link key={repo.name} className={styles.repoCard} href={repo.href}>
                  <div className={styles.repoCardHeader}>
                    <Heading as="h2" className={styles.repoTitle}>
                      {repo.name}
                    </Heading>
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
