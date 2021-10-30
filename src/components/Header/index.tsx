import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.contentHeader}>
      <Link href="/">
        <img src="Logo.svg" alt="logo" />
      </Link>
    </header>
  );
}
