'use client';

import { useCart } from '@/context/CartContext';
import { products as seedProducts } from '@/data/products';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const seedProductMap = new Map(seedProducts.map((product) => [String(product.id), product]));

function getEstimatedDeliveryLabel() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);

  return deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();

  const totalPrice = getTotalPrice();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTax = totalPrice * 0.18;
  const orderTotal = totalPrice + estimatedTax;
  const deliveryLabel = getEstimatedDeliveryLabel();
  const enrichedCart = cart.map((item) => {
    const fallbackProduct = seedProductMap.get(item.id);

    return {
      ...item,
      image: item.image ?? fallbackProduct?.image ?? '/paints/interior-matte.svg',
      description:
        item.description ??
        fallbackProduct?.description ??
        'Premium paint designed for durable coverage and a smooth finish.',
      stock: item.stock ?? fallbackProduct?.stock ?? 25,
    };
  });

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    router.push('/checkout');
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-[#eaeded] py-8 text-[#0f1111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/products"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#2162a1] transition hover:text-[#0f79af]"
          >
            <ArrowLeft size={20} />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-normal text-[#0f1111] sm:text-4xl">Shopping Cart</h1>
        </motion.div>


        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-white px-6 py-16 text-center shadow-sm"
          >
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="mb-2 text-2xl font-semibold text-[#0f1111]">Your Amazon-style cart is empty</h2>
            <p className="mb-6 text-gray-600">
              Add some paint products to get started!
            </p>
            <Link
              href="/products"
              className="inline-block rounded-full bg-[#ffd814] px-8 py-3 font-semibold text-[#0f1111] transition hover:bg-[#f7ca00]"
            >
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden rounded-lg bg-white shadow-sm"
              >
                <div className="border-b border-[#d5d9d9] px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-[28px] leading-none font-normal text-[#0f1111]">Shopping Cart</h2>
                      <p className="mt-2 text-sm text-[#565959]">
                        Price and availability may change during checkout.
                      </p>
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-left text-sm text-[#2162a1] transition hover:text-[#0f79af]"
                    >
                      Deselect all items
                    </button>
                  </div>
                </div>

                {enrichedCart.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid gap-5 border-b border-[#eaeded] px-6 py-6 last:border-b-0 md:grid-cols-[150px_minmax(0,1fr)_150px]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md border border-[#f0f2f2] bg-[#f7fafa] md:aspect-4/3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 150px"
                        className="object-contain p-3"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                        <div className="max-w-2xl">
                          <Link
                            href="/products"
                            className="text-xl font-medium leading-snug text-[#2162a1] transition hover:text-[#c7511f] hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-[#565959]">{item.description}</p>
                          <p className="mt-2 text-sm text-[#007600]">In Stock</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#565959]">
                            <span className="inline-flex items-center gap-1">
                              <Truck size={14} className="text-[#565959]" />
                              FREE delivery by {deliveryLabel}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck size={14} className="text-[#007185]" />
                              Secure packaging
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#565959]">
                            Category: <span className="font-medium text-[#0f1111]">{item.category}</span>
                            {' · '}
                            {item.stock} available
                          </p>
                        </div>

                        <p className="text-left text-xl font-semibold text-[#0f1111] md:text-right">
                          {currencyFormatter.format(item.price)}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                        <label className="inline-flex items-center gap-2 rounded-full border border-[#d5d9d9] bg-[#f0f2f2] px-3 py-2 text-[#0f1111] shadow-sm">
                          <span>Qty:</span>
                          <select
                            value={item.quantity}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                            aria-label={`Select quantity for ${item.name}`}
                            className="bg-transparent pr-1 outline-none"
                          >
                            {Array.from({ length: Math.min(10, Math.max(item.stock, item.quantity)) }, (_, value) => value + 1).map((quantity) => (
                              <option key={quantity} value={quantity}>
                                {quantity}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="inline-flex items-center gap-2 border-l border-[#d5d9d9] pl-3 text-[#2162a1] transition hover:text-[#c7511f]"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>

                        <Link
                          href="/products"
                          className="border-l border-[#d5d9d9] pl-3 text-[#2162a1] transition hover:text-[#c7511f]"
                        >
                          See more like this
                        </Link>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-[#565959]">Item subtotal</p>
                      <p className="mt-1 text-2xl font-semibold text-[#0f1111]">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </p>
                      <div className="mt-4 rounded-md border border-[#d5d9d9] bg-[#f7fafa] p-3 text-left text-sm text-[#565959]">
                        <p className="font-medium text-[#0f1111]">Delivery note</p>
                        <p className="mt-1">Ships with protective lid sealing and color-safe handling.</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="px-6 py-4 text-right text-lg text-[#0f1111]">
                  Subtotal ({totalItems} items):{' '}
                  <span className="font-semibold">{currencyFormatter.format(totalPrice)}</span>
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-20 rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start gap-2 rounded-md bg-[#f0f8ff] p-3 text-sm text-[#067d62]">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>Your order qualifies for FREE shipping.</span>
                </div>

                <p className="text-lg text-[#0f1111]">
                  Subtotal ({totalItems} items):{' '}
                  <span className="font-semibold">{currencyFormatter.format(totalPrice)}</span>
                </p>

                <motion.button
                  onClick={handleProceedToCheckout}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="mt-4 w-full rounded-full bg-[#ffd814] py-3 font-medium text-[#0f1111] transition hover:bg-[#f7ca00]"
                >
                  Proceed to Checkout
                </motion.button>

                <div className="my-5 border-t border-[#eaeded] pt-5 text-sm text-[#565959]">
                  <div className="flex justify-between py-1">
                    <span>Items</span>
                    <span>{currencyFormatter.format(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Shipping & handling</span>
                    <span className="font-medium text-[#067d62]">FREE</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Estimated tax</span>
                    <span>{currencyFormatter.format(estimatedTax)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#d5d9d9] pt-4 text-lg font-semibold text-[#b12704]">
                  <span>Order total</span>
                  <span>{currencyFormatter.format(orderTotal)}</span>
                </div>

                <p className="mt-4 text-xs text-[#565959]">
                  By placing your order, you agree to ColorBurst&apos;s pricing and delivery terms.
                </p>
              </motion.div>

              <div className="rounded-lg bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0f1111]">This order contains</h2>
                <div className="mt-4 space-y-3 text-sm text-[#565959]">
                  <div className="flex items-center justify-between">
                    <span>Paint units</span>
                    <span className="font-medium text-[#0f1111]">{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Distinct products</span>
                    <span className="font-medium text-[#0f1111]">{cart.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Estimated delivery</span>
                    <span className="font-medium text-[#0f1111]">{deliveryLabel}</span>
                  </div>
                </div>

                <button
                  onClick={clearCart}
                  className="mt-5 w-full rounded-md border border-[#d5d9d9] bg-white py-2.5 font-medium text-[#0f1111] transition hover:bg-[#f7fafa]"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
