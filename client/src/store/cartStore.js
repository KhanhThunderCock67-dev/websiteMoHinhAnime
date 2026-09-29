import { create } from 'zustand';
import { cartApi } from '../api';

const GUEST_CART_KEY = 'hobby_vault_guest_cart';

const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const useCartStore = create((set, get) => ({
  items: loadGuestCart(),
  isOpen: false,
  isLoading: false,
  error: null,

  setIsOpen: (isOpen) => set({ isOpen }),

  // Fetch cart (DB if token exists, otherwise localStorage)
  fetchCart: async (isAuthenticated = false) => {
    if (!isAuthenticated) {
      set({ items: loadGuestCart() });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await cartApi.get();
      const serverItems = response.data.data.cart?.items || [];
      set({ items: serverItems, isLoading: false });
    } catch (err) {
      console.warn('Could not fetch server cart, falling back to local items', err.message);
      set({ items: loadGuestCart(), isLoading: false });
    }
  },

  // Add product to cart with stock validation
  addToCart: async (product, quantity = 1, isAuthenticated = false) => {
    const requestedQty = Math.max(1, quantity);

    if (product.stockCount < requestedQty) {
      return {
        success: false,
        message: `Only ${product.stockCount} in stock for ${product.name}`,
      };
    }

    if (isAuthenticated) {
      try {
        const response = await cartApi.add(product._id, requestedQty);
        set({ items: response.data.data.cart.items, isOpen: true });
        return { success: true, message: 'Added to cart!' };
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not add item to cart';
        return { success: false, message: msg };
      }
    } else {
      // Guest local storage cart
      const currentItems = [...get().items];
      const existingIdx = currentItems.findIndex(
        (item) => (item.product?._id || item.product) === product._id
      );

      const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

      if (existingIdx > -1) {
        const nextQty = currentItems[existingIdx].quantity + requestedQty;
        if (nextQty > product.stockCount) {
          return {
            success: false,
            message: `Cannot add more. Only ${product.stockCount} in stock`,
          };
        }
        currentItems[existingIdx].quantity = nextQty;
        currentItems[existingIdx].price = effectivePrice;
      } else {
        currentItems.push({
          _id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          product,
          quantity: requestedQty,
          price: effectivePrice,
        });
      }

      saveGuestCart(currentItems);
      set({ items: currentItems, isOpen: true });
      return { success: true, message: 'Added to cart!' };
    }
  },

  // Update item quantity
  updateQuantity: async (itemId, newQuantity, isAuthenticated = false) => {
    const qty = Math.max(1, newQuantity);

    if (isAuthenticated) {
      try {
        const response = await cartApi.updateQuantity(itemId, qty);
        set({ items: response.data.data.cart.items });
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to update quantity';
        return { success: false, message: msg };
      }
    } else {
      const currentItems = get().items.map((item) => {
        if (item._id === itemId || item.product?._id === itemId) {
          const maxStock = item.product?.stockCount ?? 99;
          const cappedQty = Math.min(maxStock, qty);
          return { ...item, quantity: cappedQty };
        }
        return item;
      });

      saveGuestCart(currentItems);
      set({ items: currentItems });
      return { success: true };
    }
  },

  // Remove single item
  removeItem: async (itemId, isAuthenticated = false) => {
    if (isAuthenticated) {
      try {
        const response = await cartApi.removeItem(itemId);
        set({ items: response.data.data.cart.items });
      } catch (err) {
        console.error('Error removing item from server cart', err);
      }
    } else {
      const filtered = get().items.filter(
        (item) => item._id !== itemId && item.product?._id !== itemId
      );
      saveGuestCart(filtered);
      set({ items: filtered });
    }
  },

  // Clear all items
  clearCart: async (isAuthenticated = false) => {
    if (isAuthenticated) {
      try {
        await cartApi.clear();
      } catch (err) {
        console.error('Error clearing cart on server', err);
      }
    }
    localStorage.removeItem(GUEST_CART_KEY);
    set({ items: [] });
  },

  // Merge guest items with database when user logs in
  syncWithBackend: async () => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) {
      // Just fetch existing user cart
      await get().fetchCart(true);
      return;
    }

    try {
      const payload = guestItems.map((item) => ({
        productId: item.product?._id || item.product,
        quantity: item.quantity,
      }));

      const response = await cartApi.sync(payload);
      localStorage.removeItem(GUEST_CART_KEY);
      set({ items: response.data.data.cart.items });
    } catch (err) {
      console.error('Failed to sync guest cart to user account', err);
      await get().fetchCart(true);
    }
  },

  // Computed totals
  getTotalCount: () => {
    return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => {
      const price = item.price || item.product?.discountPrice || item.product?.price || 0;
      return sum + price * (item.quantity || 1);
    }, 0);
  },
}));
