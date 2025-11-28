"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { formatCurrency } from "@/lib/domain/domainHelpers";

type FlashState = { type: "success" | "error" | "info"; text: string } | null;

type UserSession = {
  userId: string;
  fullName?: string | null;
  email: string;
};

type OrderEntry = {
  orderId: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: {
    itemId: string;
    productId: string;
    productName: string;
    quantity: number;
    lockedPrice: number;
  }[];
};

type ReportPayload = {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  orders: OrderEntry[];
};

export default function AdminPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [flash, setFlash] = useState<FlashState>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);

  const postFlash = (message: FlashState) => {
    setFlash(message);
    if (message) setTimeout(() => setFlash(null), 3200);
  };

  const loadReport = async () => {
    const res = await fetch("/api/admin/report");
    if (!res.ok) {
      throw new Error("Unauthorized");
    }
    const data = await res.json();
    setReport(data.report);
  };

  const refreshReport = async () => {
    try {
      await loadReport();
      postFlash({ type: "success", text: "Report refreshed." });
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Failed to refresh report." });
    }
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("npopUser") : null;
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      } catch {
        // ignore parse issues
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadReport();
    } else {
      setReport(null);
    }
  }, [user]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>NPOP</div>
            <div>
              <div className={styles.brandTitle}>Admin Console</div>
              <div className={styles.brandSub}>Operational visibility</div>
            </div>
          </div>
          <div className={styles.topLinks}>
            <Link className={styles.navLink} href="/">
              Visitor view
            </Link>
            <button
              className={`${styles.button} ${styles.navCta}`}
              type="button"
              onClick={refreshReport}
              disabled={!user}
            >
              Refresh report
            </button>
          </div>
        </header>

        <div className={styles.hero}>
          <div>
            <p className={styles.overline}>Operations</p>
            <h1 className={styles.heroTitle}>NPOP Admin Console</h1>
            <p className={styles.heroSubtitle}>
              Oversight for the layered pipeline: gateway, JWT guard, OrderService, payment
              processor, notifications, and repository data. Everything you see is backed by Prisma
              persistence.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Uses your normal login session</span>
              <span className={styles.badge}>Data served from SQLite via Prisma</span>
            </div>
            <div className={styles.buttonRow} style={{ marginTop: 12 }}>
              <Link
                className={`${styles.button} ${styles.buttonSecondary}`}
                href="/"
              >
                Back to Visitor Portal
              </Link>
            </div>
          </div>
          <div>
            <div className={styles.statStrip}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>System orders</div>
                <div className={styles.statValue}>{report?.totalOrders ?? 0}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Revenue</div>
                <div className={styles.statValue}>
                  {formatCurrency(report?.totalRevenue ?? 0)}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Visitors</div>
                <div className={styles.statValue}>{report?.totalUsers ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        {flash && (
          <div
            className={`${styles.flash} ${
              flash.type === "success" ? styles.success : ""
            } ${flash.type === "error" ? styles.error : ""}`}
          >
            {flash.text}
          </div>
        )}

        <div className={styles.sectionBlock}>
          <div>
            <div className={styles.sectionTitle}>System Orders</div>
            <p className={styles.sectionLead}>
              Login required to view all orders placed by users in this database.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Access</div>
              {user ? (
                <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                  Using your normal login: <strong>{user.fullName ?? user.email}</strong>. Admin
                  data is unlocked automatically.
                  <div className={styles.buttonRow} style={{ marginTop: 12 }}>
                    <button className={styles.button} type="button" onClick={refreshReport}>
                      Refresh report
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                  Please sign in from the main portal first, then return here. The dashboard will
                  detect your session and load system-wide orders.
                  <div className={styles.buttonRow} style={{ marginTop: 12 }}>
                    <Link className={styles.button} href="/">
                      Go to login
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardTitle}>All Orders</div>
              <p className={styles.cardDescription}>
                Surface of OrderService + ReportService data for admins.
              </p>
              {user ? (
                !report || report.orders.length === 0 ? (
                  <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                    No orders yet. Complete a checkout from the visitor portal to populate this
                    list.
                  </div>
                ) : (
                  <div className={styles.orderList}>
                    {report.orders.map((order) => (
                      <div key={`admin-${order.orderId}`} className={styles.orderCard}>
                        <div className={styles.sectionHeader}>
                          <div className={styles.ticketTitle}>{order.orderId}</div>
                          <div className={styles.muted}>
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className={styles.muted}>
                          {order.items.length} line items · {order.status}
                        </div>
                        <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
                          <div className={styles.muted}>Total</div>
                          <div className={styles.ticketTitle}>
                            {formatCurrency(order.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className={styles.cardDescription} style={{ marginTop: 12 }}>
                  Login on the main page to view all orders.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
