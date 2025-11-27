"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import styles from "../page.module.css";
import { formatCurrency } from "@/lib/domain/domainHelpers";
import type { PaymentMethod } from "@/lib/domain/domainTypes";

type FlashState = { type: "success" | "error" | "info"; text: string } | null;

type OrderEntry = {
  id: string;
  createdAt: string;
  visitDate: string;
  status: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  items: {
    id: string;
    ticketTypeId: string;
    ticketTypeName: string;
    parkName: string;
    quantity: number;
    price: number;
  }[];
};

type ReportPayload = {
  totalVisitors: number;
  totalOrders: number;
  totalRevenue: number;
  orders: OrderEntry[];
};

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState("admin");
  const [adminPass, setAdminPass] = useState("admin123");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);

  const postFlash = (message: FlashState) => {
    setFlash(message);
    if (message) setTimeout(() => setFlash(null), 3200);
  };

  const loadReport = async (username: string, password: string) => {
    const res = await fetch("/api/admin/report", {
      headers: {
        "x-admin-user": username,
        "x-admin-pass": password,
      },
    });
    if (!res.ok) {
      throw new Error("Unauthorized");
    }
    const data = await res.json();
    setReport(data.report);
  };

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await loadReport(adminUser, adminPass);
      setAdminLoggedIn(true);
      postFlash({ type: "success", text: "Admin logged in." });
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Invalid admin credentials." });
    }
  };

  const refreshReport = async () => {
    try {
      await loadReport(adminUser, adminPass);
      postFlash({ type: "success", text: "Report refreshed." });
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Failed to refresh report." });
    }
  };

  const resetAdmin = () => {
    setAdminLoggedIn(false);
    setReport(null);
    postFlash({ type: "info", text: "Admin session cleared." });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>NPOP Admin Console</h1>
            <p className={styles.heroSubtitle}>
              Review system-wide orders and revenue for the National Parks Online Portal.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Admin: admin / admin123</span>
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
                <div className={styles.statValue}>{report?.totalVisitors ?? 0}</div>
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
              Login required to view all orders placed by visitors in this database.
            </p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Admin Login</div>
              {adminLoggedIn ? (
                <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                  Logged in as admin. You can review all orders below.
                  <div className={styles.buttonRow} style={{ marginTop: 12 }}>
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="button"
                      onClick={resetAdmin}
                    >
                      Logout admin
                    </button>
                    <button
                      className={styles.button}
                      type="button"
                      onClick={refreshReport}
                    >
                      Refresh report
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  className={styles.form}
                  onSubmit={handleAdminLogin}
                  autoComplete="off"
                >
                  <div className={styles.field}>
                    <label className={styles.label}>Admin username</label>
                    <input
                      className={styles.input}
                      value={adminUser}
                      autoComplete="off"
                      onChange={(e) => setAdminUser(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Admin password</label>
                    <input
                      className={styles.input}
                      type="password"
                      value={adminPass}
                      autoComplete="off"
                      onChange={(e) => setAdminPass(e.target.value)}
                    />
                  </div>
                  <button className={styles.button} type="submit">
                    Login as admin
                  </button>
                </form>
              )}
            </div>

            <div className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardTitle}>All Orders</div>
              <p className={styles.cardDescription}>
                Surface of OrderService + ReportService data for admins.
              </p>
              {adminLoggedIn ? (
                !report || report.orders.length === 0 ? (
                  <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                    No orders yet. Complete a checkout from the visitor portal to populate this
                    list.
                  </div>
                ) : (
                  <div className={styles.orderList}>
                    {report.orders.map((order) => (
                      <div key={`admin-${order.id}`} className={styles.orderCard}>
                        <div className={styles.sectionHeader}>
                          <div className={styles.ticketTitle}>{order.id}</div>
                          <div className={styles.muted}>
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className={styles.muted}>
                          {order.items.length} line items · {order.paymentMethod} · Visit{" "}
                          {new Date(order.visitDate).toLocaleDateString()} · {order.status}
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
                  Login as admin to view all orders.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
