import { notFound } from "next/navigation";
import styles from "../../page.module.css";
import { parkRepository } from "@/lib/repositories/parkRepository";
import { formatCurrency } from "@/lib/domain/domainHelpers";

type Props = { params: { id: string } };

export default async function ParkDetailPage({ params }: Props) {
  const park = await parkRepository.getParkByIdWithTicketTypes(params.id);
  if (!park) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>{park.name}</h1>
            <p className={styles.heroSubtitle}>
              Park ID: {park.id} · {park.location}
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Tickets available: {park.ticketTypes.length}</span>
              <span className={styles.badge}>Browse and add from the main catalog.</span>
            </div>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div>
            <div className={styles.sectionTitle}>Ticket Types</div>
            <p className={styles.sectionLead}>Reference pricing for {park.name}.</p>
          </div>
          <div className={styles.list}>
            {park.ticketTypes.map((ticket) => (
              <div key={ticket.id} className={styles.park}>
                <div className={styles.parkHeader}>
                  <div>
                    <div className={styles.ticketTitle}>{ticket.name}</div>
                    <div className={styles.tinyLabel}>
                      Ticket {ticket.id} · {park.name}
                    </div>
                  </div>
                  <span className={styles.pill}>{formatCurrency(ticket.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
