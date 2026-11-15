import styles from "@/components/comparisons/comparison-loading.module.css";

export default function ComparisonLoading() {
  return (
    <div className={styles.shell} aria-busy="true" aria-label="Loading comparable projects">
      <section className={styles.hero}>
        <span className={styles.lineShort} />
        <span className={styles.lineWide} />
        <span className={styles.line} />
      </section>
      <section className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
        <div className={styles.card}>
          <div className={styles.block} />
        </div>
      </section>
      <section className={styles.table}>
        <div className={styles.block} />
      </section>
    </div>
  );
}
