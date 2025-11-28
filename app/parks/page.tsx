import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";
import { parkRepository } from "@/lib/repositories/parkRepository";

export default async function ParksPage() {
  const parks = await parkRepository.findAllParks();

  if (!parks) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>NPOP</div>
            <div>
              <div className={styles.brandTitle}>Parks</div>
              <div className={styles.brandSub}>Capacity overview</div>
            </div>
          </div>
          <nav className={styles.topLinks} aria-label="Primary">
            <Link className={styles.navLink} href="/">
              Home
            </Link>
            <Link className={styles.navLink} href="/parks">
              Parks
            </Link>
            <Link className={styles.navLink} href="/cart">
              Cart
            </Link>
            <Link className={styles.navLink} href="/orders">
              Orders
            </Link>
            <Link className={styles.navLink} href="/admin">
              Admin
            </Link>
          </nav>
        </header>

        <section className={styles.sectionBlock}>
          <div>
            <div className={styles.sectionTitle}>Browse parks</div>
            <p className={styles.sectionLead}>
              Parks are stored in the dedicated parks table and track daily capacity for visits.
            </p>
          </div>
          <div className={styles.list}>
            {parks.map((park) => (
              <div key={park.parkId.toString()} className={styles.park}>
                <div className={styles.parkHeader}>
                  <div>
                    <div className={styles.ticketTitle}>
                      <Link className={styles.link} href={`/parks/${park.parkId.toString()}`}>
                        {park.name}
                      </Link>
                    </div>
                    <div className={styles.tinyLabel}>
                      Park ID {park.parkId.toString()} · Daily capacity {park.dailyCapacity}
                    </div>
                  </div>
                  <span className={styles.pill}>#{park.parkId.toString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

