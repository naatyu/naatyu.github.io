import React, {useId, useState, type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type PaperFigureProps = {
  src: string; alt: string; label: string; source: string;
  legend?: string; narrow?: boolean; children: ReactNode;
};

export function PaperFigure({src, alt, label, source, legend, narrow, children}: PaperFigureProps) {
  const imageUrl = useBaseUrl(src);
  const legendUrl = useBaseUrl(legend ?? src);
  return <figure className={`${styles.figure} ${narrow ? styles.narrow : ''}`}>
    <div className={styles.figureMeta}><span>{label}</span><a href={imageUrl} target="_blank" rel="noopener noreferrer">Open full-size figure ↗</a></div>
    <a className={styles.imageLink} href={imageUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size figure: ${alt}`}>
      <img className={styles.paperImage} src={imageUrl} alt={alt} loading="lazy" />
    </a>
    {legend && <img className={styles.legend} src={legendUrl} alt="Blue: larger model. Yellow: smaller model. Star: Chinchilla-optimal reference." loading="lazy" />}
    <figcaption className={styles.caption}><div className={styles.readingLabel}>How to read it</div><div>{children}</div><a className={styles.source} href={source} target="_blank" rel="noopener noreferrer">Source and original context ↗</a></figcaption>
  </figure>;
}

const checkpoints = [
  {tokens: '2.17T', accuracy: 81, state: 'Before collapse', explanation: 'At this checkpoint, the probe favors the correct arithmetic answer on 81% of evaluated items.'},
  {tokens: '2.19T', accuracy: 0, state: 'Collapse', explanation: 'After another 20 billion tokens, accuracy on this probe is 0%. This does not mean the model has lost every arithmetic capability.'},
  {tokens: '2.21T', accuracy: 81.7, state: 'Recovery', explanation: 'After another 20 billion tokens, accuracy recovers to 81.7%. The earlier drop was not a permanent downward trend.'},
];

/** Only the three reported observations are plotted; no inferred measurements. */
export function CheckpointExplorer() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const checkpoint = checkpoints[selected];
  const xs = [100, 300, 500];
  const y = (accuracy: number) => 212 - accuracy * 1.7;
  return <section className={styles.explorer} aria-label="Explore three reported pretraining checkpoints">
    <div className={styles.eyebrow}>Observed in OLMo3-32B · arithmetic answer-sequence probe</div>
    <p className={styles.thesis}>More training. Same task.<br /><span>A different preference.</span></p>
    <p className={styles.intro}>Select a checkpoint to follow the collapse and recovery.</p>
    <svg className={styles.chart} viewBox="0 0 600 264" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Accuracy falls from 81% to 0%, then recovers to 81.7%</title>
      <desc id={`${id}-desc`}>Three reported checkpoints at 2.17, 2.19, and 2.21 trillion training tokens. Straight segments connect observations and do not represent intermediate measurements.</desc>
      {[0, 50, 100].map(value => <g key={value}><line className={styles.gridLine} x1="68" y1={y(value)} x2="542" y2={y(value)} /><text className={styles.axisLabel} x="54" y={y(value) + 4} textAnchor="end">{value}%</text></g>)}
      <polyline className={styles.observationLine} points={checkpoints.map((c, i) => `${xs[i]},${y(c.accuracy)}`).join(' ')} />
      {checkpoints.map((c, i) => <g key={c.tokens}>
        {i === selected && <circle className={styles.selectionRing} cx={xs[i]} cy={y(c.accuracy)} r="16" />}
        <circle className={i === 1 ? styles.shortcutPoint : styles.taskPoint} cx={xs[i]} cy={y(c.accuracy)} r="6" />
        <text className={styles.pointLabel} x={xs[i]} y={y(c.accuracy) - 23} textAnchor="middle">{c.accuracy}%</text>
        <text className={styles.axisLabel} x={xs[i]} y="250" textAnchor="middle">{c.tokens} tokens</text>
      </g>)}
    </svg>
    <div className={styles.checkpointButtons} aria-label="Choose a checkpoint">
      {checkpoints.map((c, i) => <button key={c.tokens} type="button" aria-pressed={selected === i} aria-controls={`${id}-detail`} onClick={() => setSelected(i)}><span>{c.tokens}</span><small>{c.state}</small></button>)}
    </div>
    <div id={`${id}-detail`} className={styles.checkpointDetail} aria-live="polite" aria-atomic="true"><strong>{checkpoint.accuracy}% accuracy · {checkpoint.state.toLowerCase()}</strong><p>{checkpoint.explanation}</p></div>
    <p className={styles.chartNote}>Three reported observations, not a full training curve. Connecting lines are visual guides. Neighboring points are 20B training tokens apart.</p>
  </section>;
}

const transferMetrics = [
  {name: 'Reasoning transfer', label: 'GPQA-Diamond after math SFT', earlier: 36.3, later: 29.8, difference: 6.5, detail: 'The earlier base transfers math SFT better to this held-out science reasoning benchmark. This is not its in-distribution math score.'},
  {name: 'Alignment transfer', label: 'Robustness to prefilling attacks after general SFT', earlier: 53, later: 21, difference: 32, detail: 'The earlier base becomes more resistant to the evaluated prefilling attacks. This is not a comprehensive safety score.'},
];

export function TransferComparison() {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const metric = transferMetrics[selected];
  return <section className={styles.transfer} aria-label="Compare post-training transfer from two base checkpoints">
    <div className={styles.eyebrow}>OLMo3-32B · matched post-training within each experiment</div>
    <div className={styles.metricButtons}>{transferMetrics.map((m, i) => <button key={m.name} type="button" aria-pressed={selected === i} aria-controls={`${id}-results`} onClick={() => setSelected(i)}>{m.name}</button>)}</div>
    <div id={`${id}-results`} aria-live="polite" aria-atomic="true">
      <p className={styles.metricTitle}>{metric.label}</p>
      <div className={styles.barRow}><span>4.5T base</span><div className={styles.barTrack}><div className={styles.earlierBar} style={{width: `${metric.earlier}%`}} /></div><strong>{metric.earlier}%</strong></div>
      <div className={styles.barRow}><span>4.9T base</span><div className={styles.barTrack}><div className={styles.laterBar} style={{width: `${metric.later}%`}} /></div><strong>{metric.later}%</strong></div>
      <p className={styles.delta}>Earlier checkpoint: +{metric.difference} percentage points</p>
      <p className={styles.chartNote}>{metric.detail} Both bars use a 0–100% scale.</p>
    </div>
  </section>;
}
