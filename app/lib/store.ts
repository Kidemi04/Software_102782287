"use client";

import { useSyncExternalStore } from "react";
import type { Order, Visitor } from "./domain";

type State = {
  visitors: Record<string, Visitor>;
  orders: Order[];
};

let state: State = {
  visitors: {},
  orders: [],
};

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getState = () => state;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStore = () =>
  useSyncExternalStore(subscribe, getState, getState);

export const registerVisitor = (visitor: Visitor) => {
  state = {
    ...state,
    visitors: { ...state.visitors, [visitor.email]: visitor },
  };
  emit();
  return visitor;
};

export const replaceVisitor = (email: string, visitor: Visitor) => {
  state = {
    ...state,
    visitors: { ...state.visitors, [email]: visitor },
  };
  emit();
};

export const addOrder = (order: Order, visitorEmail: string) => {
  const visitor = state.visitors[visitorEmail];
  if (!visitor) return;

  const updatedVisitor: Visitor = {
    ...visitor,
    orderHistory: [order, ...visitor.orderHistory],
  };

  state = {
    orders: [order, ...state.orders],
    visitors: { ...state.visitors, [visitorEmail]: updatedVisitor },
  };
  emit();
};
