/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import type { PaymentMethod, OrderDTO } from "@/lib/domain/domainTypes";
import type { Park } from "@/lib/domain/park";
import { calculateTicketCount, formatCurrency } from "@/lib/domain/domainHelpers";

type FlashState = { type: "success" | "error" | "info"; text: string } | null;

type CartItem = {
  ticket: Park["ticketTypes"][number];
  quantity: number;
};

type VisitorSession = {
  id: string;
  name: string;
  email: string;
};

export default function Home() {
  const [parks, setParks] = useState<Park[]>([]);
  const [currentVisitor, setCurrentVisitor] = useState<VisitorSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderDTO[]>([]);

  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [flash, setFlash] = useState<FlashState>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod>("CARD");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [walletId, setWalletId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.ticket.price * item.quantity, 0),
    [cart]
  );
  const cartTickets = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const postFlash = (message: FlashState) => {
    setFlash(message);
    if (message) {
      setTimeout(() => setFlash(null), 3200);
    }
  };

  const loadParks = useCallback(async () => {
    try {
      const res = await fetch("/api/parks/list");
      const data = await res.json();
      setParks(data);
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Failed to load parks." });
    }
  }, []);

  const loadHistory = useCallback(async (visitorId: string) => {
    try {
      const res = await fetch(`/api/orders/history?visitorId=${encodeURIComponent(visitorId)}`);
      const data = await res.json();
      if (data.success) {
        setOrderHistory(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadParks();
  }, [loadParks]);

  useEffect(() => {
    if (currentVisitor) {
      void loadHistory(currentVisitor.id);
    } else {
      setOrderHistory([]);
    }
  }, [currentVisitor, loadHistory]);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        postFlash({ type: "error", text: data.message ?? "Registration failed." });
        return;
      }
      postFlash({ type: "success", text: data.message });
      setAuthMode("login");
      setRegisterPassword("");
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Registration failed." });
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        postFlash({ type: "error", text: data.message ?? "Login failed." });
        return;
      }
      setCurrentVisitor(data.visitor);
      postFlash({ type: "success", text: `Welcome back, ${data.visitor.name}.` });
      setCart([]);
      loadHistory(data.visitor.id);
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Login failed." });
    }
  };

  const handleLogout = () => {
    setCurrentVisitor(null);
    setCart([]);
    setOrderHistory([]);
    postFlash({ type: "info", text: "Signed out and cleared your cart." });
  };

  const updateQuantityInput = (ticketId: string, value: number) => {
    const safeValue = Number.isNaN(value) ? 1 : Math.max(1, value);
    setQuantities((prev) => ({ ...prev, [ticketId]: safeValue }));
  };

  const addTicketToCart = (ticketId: string) => {
    if (!currentVisitor) {
      postFlash({ type: "error", text: "Log in before adding tickets." });
      return;
    }
    const ticket = parks.flatMap((p) => p.ticketTypes).find((t) => t.id === ticketId);
    if (!ticket) return;
    const qty = Math.max(1, quantities[ticketId] ?? 1);
    setCart((prev) => {
      const existing = prev.find((item) => item.ticket.id === ticketId);
      if (existing) {
        return prev.map((item) =>
          item.ticket.id === ticketId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ticket, quantity: qty }];
    });
    postFlash({ type: "success", text: `Added ${qty} x ${ticket.name} to cart.` });
  };

  const setCartQuantity = (ticketId: string, quantity: number) => {
    const safeQty = Math.max(1, quantity);
    setCart((prev) =>
      prev.map((item) =>
        item.ticket.id === ticketId ? { ...item, quantity: safeQty } : item
      )
    );
  };

  const removeCartItem = (ticketId: string) => {
    setCart((prev) => prev.filter((item) => item.ticket.id !== ticketId));
  };

  const handleCheckout = async () => {
    if (!currentVisitor) {
      postFlash({ type: "error", text: "Log in to checkout." });
      return;
    }
    if (!cart.length) {
      postFlash({ type: "error", text: "Your cart is empty." });
      return;
    }
    if (!visitDate) {
      postFlash({ type: "error", text: "Select a visit date before checkout." });
      return;
    }

    if (checkoutMethod === "CARD" && (!cardNumber.trim() || !cardCvv.trim())) {
      postFlash({ type: "error", text: "Card number and CVV are required." });
      return;
    }
    if (checkoutMethod === "WALLET" && !walletId.trim()) {
      postFlash({ type: "error", text: "Wallet ID is required for wallet checkout." });
      return;
    }

    const payload = {
      visitorId: currentVisitor.id,
      cartItems: cart.map((item) => ({
        ticketTypeId: item.ticket.id,
        quantity: item.quantity,
      })),
      paymentMethod: checkoutMethod,
      visitDate,
      paymentDetails: {
        cardNumber,
        cvv: cardCvv,
        walletId,
      },
    };

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
      postFlash({ type: "error", text: data.message ?? "Checkout failed." });
      return;
    }
    postFlash({ type: "success", text: data.message ?? "Order placed." });
    setCart([]);
    setCardNumber("");
    setCardCvv("");
    setWalletId("");
    setVisitDate("");
    await loadHistory(currentVisitor.id);
  } catch (err) {
    console.error(err);
    postFlash({ type: "error", text: "Checkout failed." });
  }
};

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>National Parks Online Portal (NPOP)</h1>
            <p className={styles.heroSubtitle}>
              Register visitors, browse parks, manage carts, and simulate checkout strategies.
              Data now persists to SQLite via Prisma and API routes.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>Max 10 tickets / order</span>
              <span className={styles.badge}>Admin: admin / admin123</span>
            </div>
            <div className={styles.buttonRow} style={{ marginTop: 12 }}>
              <Link className={styles.button} href="/admin">
                Go to Admin Console
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.statusBar}>
          <div className={styles.statusChip}>
            {currentVisitor ? (
              <>
                Signed in as <strong>{currentVisitor.name}</strong>
              </>
            ) : (
              <span>Browsing as guest — please log in to add tickets</span>
            )}
          </div>
          <div className={styles.inlineStat}>
            <span className={styles.mutedSmall}>Items</span>
            <strong>{cartTickets}</strong>
          </div>
          <div className={styles.inlineStat}>
            <span className={styles.mutedSmall}>Cart total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
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
            <div className={styles.sectionTitle}>Visitor Workspace</div>
            <p className={styles.sectionLead}>
              Register/login, browse parks, manage your cart, and place orders.
            </p>
          </div>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.cardTitle}>Visitor Access</div>
                  <p className={styles.cardDescription}>
                    Register or sign in; authentication now goes through /api/auth.
                  </p>
                </div>
                <div className={styles.buttonRow}>
                  <button
                    className={`${styles.button} ${
                      authMode === "register" ? "" : styles.buttonSecondary
                    }`}
                    onClick={() => setAuthMode("register")}
                    type="button"
                  >
                    Register
                  </button>
                  <button
                    className={`${styles.button} ${
                      authMode === "login" ? "" : styles.buttonSecondary
                    }`}
                    onClick={() => setAuthMode("login")}
                    type="button"
                  >
                    Login
                  </button>
                </div>
              </div>

              {authMode === "register" ? (
                <form className={styles.form} onSubmit={handleRegister} autoComplete="off">
                  <div className={styles.field}>
                    <label className={styles.label}>Full name</label>
                    <input
                      className={styles.input}
                      placeholder="Jane Ranger"
                      value={registerName}
                      autoComplete="off"
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="you@email.com"
                      value={registerEmail}
                      autoComplete="off"
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Password</label>
                    <input
                      className={styles.input}
                      type="password"
                      value={registerPassword}
                      autoComplete="new-password"
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                  </div>
                  <div className={styles.buttonRow}>
                    <button className={styles.button} type="submit">
                      Save registration
                    </button>
                  </div>
                </form>
              ) : (
                <form className={styles.form} onSubmit={handleLogin} autoComplete="off">
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      value={loginEmail}
                      autoComplete="off"
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Password</label>
                    <input
                      className={styles.input}
                      type="password"
                      value={loginPassword}
                      autoComplete="off"
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <div className={styles.buttonRow}>
                    <button className={styles.button} type="submit">
                      Login
                    </button>
                    {currentVisitor && (
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    )}
                  </div>
                </form>
              )}

              {currentVisitor ? (
                <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                  Logged in as <strong>{currentVisitor.name}</strong> ({currentVisitor.email}) —{" "}
                  {orderHistory.length} orders placed.
                </div>
              ) : (
                <div className={styles.cardDescription} style={{ marginTop: 10 }}>
                  You are browsing as a guest.
                </div>
              )}
            </div>

            <div className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.cardTitle}>Parks &amp; Ticket Types</div>
                <p className={styles.cardDescription}>
                  Loaded from SQLite via Prisma; mirrors the original seed data.
                </p>
              </div>
              <div className={styles.cardDescription}>
                Choose quantities then add them to the session cart.
              </div>
            </div>

            <div className={styles.controlRow} style={{ marginBottom: 10 }}>
              <div className={styles.field}>
                <label className={styles.label}>Search parks</label>
                <input
                  className={styles.input}
                  placeholder="Search by park or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.list}>
              {parks
                .filter((park) =>
                  `${park.name} ${park.location}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((park) => (
                  <div key={park.id} className={styles.park}>
                    <div className={styles.parkHeader}>
                      <div>
                        <div className={styles.ticketTitle}>
                          <Link className={styles.link} href={`/parks/${park.id}`}>
                            {park.name}
                          </Link>
                        </div>
                        <div className={styles.muted}>{park.location}</div>
                      </div>
                      <span className={styles.pill}>#{park.id}</span>
                    </div>
                    {park.ticketTypes.map((ticket) => (
                      <div key={ticket.id} className={styles.ticketRow}>
                        <div>
                          <div className={styles.ticketTitle}>{ticket.name}</div>
                          <div className={styles.tinyLabel}>
                            Ticket {ticket.id} · {park.name}
                          </div>
                        </div>
                        <div className={styles.muted}>{formatCurrency(ticket.price)}</div>
                        <div className={styles.buttonRow}>
                          <input
                            type="number"
                            className={styles.input}
                            min={1}
                            value={quantities[ticket.id] ?? 1}
                            onChange={(e) =>
                              updateQuantityInput(ticket.id, parseInt(e.target.value, 10))
                            }
                          />
                          <button
                            className={styles.button}
                            type="button"
                            onClick={() => addTicketToCart(ticket.id)}
                            disabled={!currentVisitor}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Cart &amp; Checkout</div>
              <p className={styles.cardDescription}>
                Cart stays client-side; checkout calls /api/orders/checkout with payment strategy.
              </p>
              {cart.length === 0 ? (
                <div className={styles.cardDescription} style={{ marginTop: 12 }}>
                  Cart is empty. Add tickets to begin checkout.
                </div>
              ) : (
                <>
                  <div className={styles.cartList}>
                    {cart.map((item) => (
                      <div key={item.ticket.id} className={styles.cartItem}>
                        <div>
                          <div className={styles.ticketTitle}>{item.ticket.name}</div>
                          <div className={styles.tinyLabel}>
                            {item.ticket.parkName ?? ""} · {formatCurrency(item.ticket.price)} ea
                          </div>
                        </div>
                        <div className={styles.buttonRow}>
                          <input
                            type="number"
                            min={1}
                            className={styles.input}
                            value={item.quantity}
                            onChange={(e) =>
                              setCartQuantity(item.ticket.id, parseInt(e.target.value, 10) || 1)
                            }
                          />
                          <button
                            className={`${styles.button} ${styles.buttonSecondary}`}
                            type="button"
                            onClick={() => removeCartItem(item.ticket.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.checkoutPanel}>
                    <div className={styles.controlRow}>
                      <div>
                        <div className={styles.label}>Payment method</div>
                        <select
                          className={styles.select}
                          value={checkoutMethod}
                          onChange={(e) => setCheckoutMethod(e.target.value as PaymentMethod)}
                        >
                          <option value="CARD">Credit Card</option>
                          <option value="WALLET">Digital Wallet</option>
                          <option value="DUMMY">Dummy Payment</option>
                        </select>
                        <div className={styles.cardDescription}>
                          CARD requires card number + CVV; WALLET requires wallet ID; DUMMY always
                          succeeds.
                        </div>
                      </div>
                      <div>
                        <div className={styles.label}>Tickets in cart</div>
                        <div className={styles.statValue}>{calculateTicketCount(cart)}</div>
                      </div>
                    </div>

                    <div className={styles.field} style={{ marginTop: 8 }}>
                      <label className={styles.label}>Visit date</label>
                      <input
                        className={styles.input}
                        type="date"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                      />
                      <div className={styles.cardDescription}>
                        Required for checkout; used for reschedule/cancel flows.
                      </div>
                    </div>

                    {checkoutMethod === "CARD" && (
                      <div className={styles.controlRow} style={{ marginTop: 8 }}>
                        <div className={styles.field}>
                          <label className={styles.label}>Card number</label>
                          <input
                            className={styles.input}
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>CVV</label>
                          <input
                            className={styles.input}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {checkoutMethod === "WALLET" && (
                      <div className={styles.field} style={{ marginTop: 8 }}>
                        <label className={styles.label}>Wallet ID</label>
                        <input
                          className={styles.input}
                          placeholder="wallet-12345"
                          value={walletId}
                          onChange={(e) => setWalletId(e.target.value)}
                        />
                      </div>
                    )}

                    <div className={styles.sectionHeader} style={{ marginTop: 12 }}>
                      <div className={styles.label}>Total</div>
                      <div className={styles.statValue}>{formatCurrency(cartTotal)}</div>
                    </div>
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={handleCheckout}
                        disabled={!currentVisitor || !cart.length || !visitDate}
                      >
                        Checkout
                      </button>
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={() => setCart([])}
                      >
                        Clear cart
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Visitor Orders</div>
              <p className={styles.cardDescription}>
                Pulled from the database via /api/orders/history for the logged-in visitor.
              </p>
            {currentVisitor && orderHistory.length > 0 ? (
              <div className={styles.orderList}>
                {orderHistory.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.ticketTitle}>{order.id}</div>
                      <div className={styles.muted}>
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.muted}>
                      Visit date: {new Date(order.visitDate).toLocaleDateString()} | Status:{" "}
                      {order.status}
                    </div>
                    <div className={styles.orderItems}>
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.ticketTypeId}`}>
                          {item.quantity} x {item.ticketTypeName} ({item.parkName})
                        </div>
                      ))}
                    </div>
                    <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
                      <div className={styles.muted}>Payment: {order.paymentMethod}</div>
                      <div className={styles.ticketTitle}>{formatCurrency(order.totalAmount)}</div>
                    </div>
                    <div className={styles.buttonRow} style={{ marginTop: 8 }}>
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={async () => {
                          const newDate = prompt("New visit date (YYYY-MM-DD):");
                          if (!newDate) return;
                          const res = await fetch("/api/orders/reschedule", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              visitorId: currentVisitor.id,
                              orderId: order.id,
                              visitDate: newDate,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            postFlash({ type: "error", text: data.message ?? "Reschedule failed." });
                            return;
                          }
                          postFlash({ type: "success", text: data.message });
                          await loadHistory(currentVisitor.id);
                        }}
                      >
                        Reschedule
                      </button>
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        type="button"
                        onClick={async () => {
                          if (!confirm("Cancel this order?")) return;
                          const res = await fetch("/api/orders/cancel", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              visitorId: currentVisitor.id,
                              orderId: order.id,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            postFlash({ type: "error", text: data.message ?? "Cancel failed." });
                            return;
                          }
                          postFlash({ type: "success", text: data.message });
                          await loadHistory(currentVisitor.id);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.cardDescription} style={{ marginTop: 12 }}>
                  {currentVisitor ? "No orders yet for this visitor." : "Log in to view history."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
