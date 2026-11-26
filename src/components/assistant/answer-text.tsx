import type { AnswerPresentation } from "@/modules/assistant/domain/answer-cards";
import { AnswerCards } from "./answer-cards";
import styles from "../demo-value/home-chat.module.css";

/** New answers have a server-built view; the original text layout remains for old answers. */
export function AnswerText({
  text,
  facts,
  presentation,
}: {
  text: string;
  facts: boolean;
  presentation?: AnswerPresentation | undefined;
}) {
  if (presentation) return <AnswerCards presentation={presentation} />;
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
