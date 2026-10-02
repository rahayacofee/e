import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product, CartItem, OrderType } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  orderType: OrderType;
  customerName: string;
  tableNumber: string;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  totalAmount: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setCustomerName: (name: string) => void;
  setTableNumber: (table: string) => void;
  setDiscountAmount: (discount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [customerName, setCustomerName] = useState<string>('Pelanggan Walk-In');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const addItem = (product: Product, quantity: number = 1, notes: string = '') => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          notes: notes ? notes : next[existingIndex].notes,
        };
        return next;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes } : item))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountAmount(0);
    setCustomerName('Pelanggan Walk-In');
    setTableNumber('');
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const taxPercentage = business?.tax_percentage ?? 10;
  const servicePercentage = business?.service_percentage ?? 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(subtotalAfterDiscount * (taxPercentage / 100));
  const serviceAmount = Math.round(subtotalAfterDiscount * (servicePercentage / 100));
  const totalAmount = subtotalAfterDiscount + taxAmount + serviceAmount;

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        customerName,
        tableNumber,
        discountAmount,
        subtotal,
        taxAmount,
        serviceAmount,
        totalAmount,
        itemCount,
        addItem,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        setOrderType,
        setCustomerName,
        setTableNumber,
        setDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
