"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "../page.module.css";
import type { PaymentMethod } from "@/lib/domain/domainTypes";
import { calculateItemCount, formatCurrency } from "@/lib/domain/domainHelpers";

type Product = {
  productId: string;
  productName: string;
  unitPrice: number;
  type: "TICKET" | "MERCH";
};

type CartItem = {
  product: Product;
  quantity: number;
};

type UserSession = {
  userId: string;
  fullName?: string | null;
  email: string;
};

type FlashState = { type: "success" | "error" | "info"; text: string } | null;

export default function CartPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethod>("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [walletId, setWalletId] = useState("");
  const [flash, setFlash] = useState<FlashState>(null);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0),
    [cart]
  );

  const postFlash = (message: FlashState) => {
    setFlash(message);
    if (message) {
      setTimeout(() => setFlash(null), 3200);
    }
  };

  useEffect(() => {
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("npopUser") : null;
    if (storedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products/list");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        postFlash({ type: "error", text: "Failed to load products." });
      }
    };
    void loadProducts();
  }, []);

  const updateQuantityInput = (productId: string, value: number) => {
    const safeValue = Number.isNaN(value) ? 1 : Math.max(1, value);
    setQuantities((prev) => ({ ...prev, [productId]: safeValue }));
  };

  const addProductToCart = (productId: string) => {
    if (!currentUser) {
      postFlash({ type: "error", text: "Log in on the home page before adding items." });
      return;
    }
    const product = products.find((p) => p.productId === productId);
    if (!product) return;
    const qty = Math.max(1, quantities[productId] ?? 1);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.product.productId === productId
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    postFlash({ type: "success", text: `Added ${qty} x ${product.productName} to cart.` });
  };

  const setCartQuantity = (productId: string, quantity: number) => {
    const safeQty = Math.max(1, quantity);
    setCart((prev) =>
      prev.map((item) =>
        item.product.productId === productId ? { ...item, quantity: safeQty } : item
      )
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.productId !== productId));
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      postFlash({ type: "error", text: "Log in to checkout." });
      return;
    }
    if (!cart.length) {
      postFlash({ type: "error", text: "Your cart is empty." });
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
      userId: currentUser.userId,
      cartItems: cart.map((item) => ({
        productId: item.product.productId,
        quantity: item.quantity,
      })),
      paymentMethod: checkoutMethod,
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
    } catch (err) {
      console.error(err);
      postFlash({ type: "error", text: "Checkout failed." });
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>NPOP</div>
            <div>
              <div className={styles.brandTitle}>Cart</div>
              <div className={styles.brandSub}>Products &amp; checkout</div>
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

        {flash && (
          <div
            className={`${styles.flash} ${
              flash.type === "success" ? styles.success : ""
            } ${flash.type === "error" ? styles.error : ""}`}
          >
            {flash.text}
          </div>
        )}

        {!currentUser && (
          <section className={styles.sectionBlock}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Login required</div>
              <p className={styles.cardDescription}>
                Please log in from the home page before adding items to your cart.
              </p>
              <div className={styles.buttonRow} style={{ marginTop: 12 }}>
                <Link className={styles.button} href="/#auth">
                  Go to login
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className={styles.sectionBlock}>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.cardTitle}>Products catalog</div>
                  <p className={styles.cardDescription}>
                    Tickets and merchandise; select quantities and add them to your cart.
                  </p>
                </div>
              </div>
              <div className={styles.list}>
                {products.map((product) => (
                  <div key={product.productId} className={styles.ticketRow}>
                    <div>
                      <div className={styles.ticketTitle}>{product.productName}</div>
                      <div className={styles.tinyLabel}>
                        Product {product.productId} · {product.type}
                      </div>
                    </div>
                    <div className={styles.muted}>{formatCurrency(product.unitPrice)}</div>
                    <div className={styles.buttonRow}>
                      <input
                        type="number"
                        className={styles.input}
                        min={1}
                        value={quantities[product.productId] ?? 1}
                        onChange={(e) =>
                          updateQuantityInput(product.productId, parseInt(e.target.value, 10))
                        }
                      />
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => addProductToCart(product.productId)}
                        disabled={!currentUser}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Cart &amp; checkout</div>
              <p className={styles.cardDescription}>
                Review your items, choose a payment option, and confirm your order.
              </p>
              {cart.length === 0 ? (
                <div className={styles.cardDescription} style={{ marginTop: 12 }}>
                  Cart is empty. Add items from the catalog.
                </div>
              ) : (
                <>
                  <div className={styles.cartList}>
                    {cart.map((item) => (
                      <div key={item.product.productId} className={styles.cartItem}>
                        <div>
                          <div className={styles.ticketTitle}>{item.product.productName}</div>
                          <div className={styles.tinyLabel}>
                            {item.product.type} · {formatCurrency(item.product.unitPrice)} ea
                          </div>
                        </div>
                        <div className={styles.buttonRow}>
                          <input
                            type="number"
                            min={1}
                            className={styles.input}
                            value={item.quantity}
                            onChange={(e) =>
                              setCartQuantity(
                                item.product.productId,
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                          />
                          <button
                            className={`${styles.button} ${styles.buttonSecondary}`}
                            type="button"
                            onClick={() => removeCartItem(item.product.productId)}
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
                        <div className={styles.label}>Items in cart</div>
                        <div className={styles.statValue}>{calculateItemCount(cart)}</div>
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
                        disabled={!currentUser || !cart.length}
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
          </div>
        </section>
      </div>
    </main>
  );
}
