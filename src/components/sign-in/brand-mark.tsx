import styles from "./sign-in.module.css";
/** Provisional mark from review 7237737479; replace this component when the logo is approved. */
export function BrandMark() {
  return (
    <svg className={styles.brandMark} aria-hidden="true" viewBox="0 0 32 32">
      <path
        d="M8 21l5-7 5 4 6-8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
