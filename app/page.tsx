/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

type FlashState = { type: "success" | "error" | "info"; text: string } | null;

type UserSession = {
  userId: string;
  fullName?: string | null;
  email: string;
};

export default function Home() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [flash, setFlash] = useState<FlashState>(null);

  const postFlash = (message: FlashState) => {
    setFlash(message);
    if (message) {
      setTimeout(() => setFlash(null), 3200);
    }
  };

  const loadOrderCount = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/orders/by-user?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrderCount(data.orders.length);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("npopUser") : null;
    if (stored) {
      try {
        const parsed: UserSession = JSON.parse(stored);
        setCurrentUser(parsed);
      } catch {
        // ignore parse failure
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      void loadOrderCount(currentUser.userId);
    } else {
      setOrderCount(0);
    }
  }, [currentUser, loadOrderCount]);

  const handleLogout = () => {
    setCurrentUser(null);
    setOrderCount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("npopUser");
    }
    postFlash({ type: "info", text: "Signed out." });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>NPOP</div>
            <div>
              <div className={styles.brandTitle}>National Parks Portal</div>
              <div className={styles.brandSub}>Book tickets and track orders</div>
            </div>
          </div>
          <nav className={styles.topLinks} aria-label="Primary">
            <a className={styles.navLink} href="#how-it-works">
              How it works
            </a>
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
            {currentUser && (
              <span className={styles.navUser}>
                {currentUser.fullName ?? currentUser.email}
              </span>
            )}
            {currentUser ? (
              <button
                className={`${styles.button} ${styles.navCta}`}
                type="button"
                onClick={handleLogout}
              >
                Sign out
              </button>
            ) : (
              <button
                className={`${styles.button} ${styles.navCta}`}
                type="button"
                onClick={() => router.push("/signin")}
              >
                Log in
              </button>
            )}
          </nav>
        </header>

        <section className={styles.hero} aria-labelledby="hero-heading">
          <div>
            <p className={styles.overline}>Plan your visit</p>
            <h1 id="hero-heading" className={styles.heroTitle}>
              Reserve park tickets and manage your bookings in one place.
            </h1>
            <p className={styles.heroSubtitle}>
              Create an account, choose parks and products, complete checkout, and return any time
              to review your confirmed orders.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Simple booking flow</span>
              <span className={styles.badge}>Your orders, always available</span>
              <span className={styles.badge}>Designed for visitors</span>
            </div>
            <div className={styles.buttonRow} style={{ marginTop: 14 }}>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  if (currentUser) {
                    router.push("/cart");
                  } else {
                    router.push("/signin");
                  }
                }}
              >
                {currentUser ? "Start a new booking" : "Get started"}
              </button>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href="/orders">
                View my orders
              </Link>
            </div>
          </div>
          <div>
            <div className={styles.statStrip}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Account</div>
                <div className={styles.statValue}>
                  {currentUser ? "Signed in" : "Guest"}
                </div>
                <div className={styles.mutedSmall}>
                  {currentUser ? currentUser.email : "Sign in to keep your bookings"}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Orders</div>
                <div className={styles.statValue}>{orderCount}</div>
                <div className={styles.mutedSmall}>
                  {orderCount ? "View details on Orders page" : "No bookings yet"}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Next step</div>
                <div className={styles.statValue}>
                  {currentUser ? "Choose tickets" : "Create an account"}
                </div>
                <div className={styles.mutedSmall}>
                  {currentUser
                    ? "Go to Cart to add products"
                    : "Use the form below to register"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {flash && (
          <div
            className={`${styles.flash} ${
              flash.type === "success" ? styles.success : ""
            } ${flash.type === "error" ? styles.error : ""}`}
          >
            {flash.text}
          </div>
        )}

        <section id="how-it-works" className={styles.sectionBlock}>
          <div>
            <div className={styles.sectionTitle}>How it works</div>
            <p className={styles.sectionLead}>
              A straightforward three-step experience for visitors booking park tickets.
            </p>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureTitle}>1. Sign up or log in</div>
              <p className={styles.cardDescription}>
                Create an account with your name and email, or log in if you already have one.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureTitle}>2. Book your visit</div>
              <p className={styles.cardDescription}>
                From the Cart page, select tickets and merchandise for the parks you want to visit.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureTitle}>3. Keep track easily</div>
              <p className={styles.cardDescription}>
                Every confirmed order is saved under your account and can be reviewed on the Orders
                page.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div>
            <div className={styles.sectionTitle}>Sign in or create an account</div>
            <p className={styles.sectionLead}>
              Use a dedicated sign-in page to manage your account details and bookings.
            </p>
          </div>
          <div className={styles.card}>
            <p className={styles.cardDescription}>
              When you are ready, continue to the sign-in page to log in or register. Once signed
              in, you will return here with your bookings connected to your account.
            </p>
            <div className={styles.buttonRow} style={{ marginTop: 12 }}>
              <button
                className={styles.button}
                type="button"
                onClick={() => router.push("/signin")}
              >
                Go to sign in
              </button>
            </div>
            {currentUser ? (
              <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                You are signed in as <strong>{currentUser.fullName ?? currentUser.email}</strong>{" "}
                ({currentUser.email}). You currently have {orderCount}{" "}
                {orderCount === 1 ? "booking" : "bookings"}.
              </div>
            ) : (
              <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                You are browsing as a guest. Use the sign-in page to create an account and keep your
                bookings.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
