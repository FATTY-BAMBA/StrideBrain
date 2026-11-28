import styles from "./sign-in.module.css";
export function IdentityHeading({ title, caption }: { title: string; caption?: string }) {
  return (
    <header className={styles.sheetHead}>
      <h1>{title}</h1>
      {caption && <p>{caption}</p>}
    </header>
  );
}
