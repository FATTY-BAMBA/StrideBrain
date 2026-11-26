import styles from "../demo-value/home-chat.module.css";

/** The server's double-newline record boundary is preserved in both chat surfaces. */
export function AnswerText({ text, facts }: { text: string; facts: boolean }) {
  if (!facts) return <p className={styles.answerText}>{text}</p>;
  const [lead, ...records] = text.split("\n\n");
  return (
    <div className={styles.factAnswer}>
      <p>{lead}</p>
      {records.map((block, index) => {
        const [heading, ...lines] = block.split("\n");
        return (
          <section className={styles.answerRecord} key={index} aria-label={heading}>
            <p className={styles.answerHeading}>
              <strong>{heading}</strong>
            </p>
            {lines.map((line, lineIndex) => (
              <p className={styles.answerFact} key={lineIndex}>
                {line}
              </p>
            ))}
          </section>
        );
      })}
    </div>
  );
}
