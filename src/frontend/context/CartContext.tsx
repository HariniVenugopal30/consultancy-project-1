'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
  description?: string;
  stock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_PREFIX = 'colorburst_cart';
const GUEST_CART_KEY = `${CART_STORAGE_PREFIX}_guest`;
const AUTH_CHANGED_EVENT = 'auth-changed';

type AuthUser = {
  id?: string;
};

function getAuthUserId() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = localStorage.getItem('authUser');
    if (!rawUser) {
      return null;
    }

    const parsed = JSON.parse(rawUser) as AuthUser;
    return typeof parsed.id === 'string' && parsed.id.trim().length > 0 ? parsed.id : null;
  } catch {
    return null;
  }
}

function getCartStorageKey(userId: string | null) {
  return userId ? `${CART_STORAGE_PREFIX}_${userId}` : GUEST_CART_KEY;
}

function loadCartFromStorage(key: string) {
  if (typeof window === 'undefined') {
    return [] as CartItem[];
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }

    return parsed.filter((item): item is CartItem => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        typeof item.category === 'string' &&
        (item.image === undefined || typeof item.image === 'string') &&
        (item.description === undefined || typeof item.description === 'string') &&
        (item.stock === undefined || typeof item.stock === 'number')
      );
    });
  } catch {
    return [] as CartItem[];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [activeUserId, setActiveUserId] = useState<string | null>(() => getAuthUserId());
  const [cartsByKey, setCartsByKey] = useState<Record<string, CartItem[]>>(() => {
    const initialUserId = getAuthUserId();
    const initialStorageKey = getCartStorageKey(initialUserId);

    return {
      [initialStorageKey]: loadCartFromStorage(initialStorageKey),
    };
  });

  const storageKey = useMemo(() => getCartStorageKey(activeUserId), [activeUserId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncAuthUser = () => {
      setActiveUserId(getAuthUserId());
    };

    syncAuthUser();
    window.addEventListener('storage', syncAuthUser);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthUser);

    return () => {
      window.removeEventListener('storage', syncAuthUser);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthUser);
    };
  }, []);

  useEffect(() => {
    setCartsByKey((previousCarts) => {
      if (previousCarts[storageKey]) {
        return previousCarts;
      }

      return {
        ...previousCarts,
        [storageKey]: loadCartFromStorage(storageKey),
      };
    });
  }, [storageKey]);

  const cart = useMemo(
    () => cartsByKey[storageKey] ?? loadCartFromStorage(storageKey),
    [cartsByKey, storageKey]
  );

  const updateCartForStorageKey = (updater: (currentCart: CartItem[]) => CartItem[]) => {
    setCartsByKey((previousCarts) => {
      const currentCart = previousCarts[storageKey] ?? loadCartFromStorage(storageKey);

      return {
        ...previousCarts,
        [storageKey]: updater(currentCart),
      };
    });
  };

  // Persist current cart for the active user key.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);

  const addToCart = (item: CartItem) => {
    updateCartForStorageKey((prevCart) => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (id: string) => {
    updateCartForStorageKey((prevCart) => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    updateCartForStorageKey((prevCart) =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    updateCartForStorageKey(() => []);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
