'use client';

import { useCart } from '@/frontend/context/CartContext';
import { products as seedProducts } from '@/shared/data/products';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';
import { useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const seedProductMap = new Map(seedProducts.map((p) => [String(p.id), p]));

type PaymentMethod = 'cod' | 'upi' | 'card';

interface FormState {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: PaymentMethod;
  upiId: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM: FormState = {
  customerName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  pincode: '',
  paymentMethod: 'cod',
  upiId: '',
  cardNumber: '',
  cardName: '',
  cardExpiry: '',
  cardCvv: '',
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.customerName.trim()) errors.customerName = 'Full name is required';

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.address.trim()) errors.address = 'Delivery address is required';
  if (!form.city.trim()) errors.city = 'City is required';

  if (!form.pincode.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = 'Enter a valid 6-digit pincode';
  }

  if (form.paymentMethod === 'upi') {
    if (!form.upiId.trim()) {
      errors.upiId = 'UPI ID is required';
    } else if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(form.upiId.trim())) {
      errors.upiId = 'Enter a valid UPI ID (e.g. name@bank)';
    }
  }

  if (form.paymentMethod === 'card') {
    if (!form.cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(form.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Enter a valid 16-digit card number';
    }

    if (!form.cardName.trim()) errors.cardName = 'Name on card is required';

    if (!form.cardExpiry.trim()) {
      errors.cardExpiry = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.cardExpiry.trim())) {
      errors.cardExpiry = 'Enter expiry as MM/YY';
    }

    if (!form.cardCvv.trim()) {
      errors.cardCvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(form.cardCvv.trim())) {
      errors.cardCvv = 'Enter a valid 3 or 4 digit CVV';
    }
  }

  return errors;
}

function FieldInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  inputMode,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  inputMode?: 'numeric' | 'text' | 'email' | 'tel';
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[#0f1111]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-md border px-3 py-2.5 text-sm text-[#0f1111] outline-none transition focus:ring-2 focus:ring-[#e77600] ${
          error ? 'border-red-400 bg-red-50' : 'border-[#adb1b8] hover:border-[#e77600] focus:border-[#e77600]'
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; description: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives', Icon: Banknote },
  { id: 'upi', label: 'UPI', description: 'PhonePe, GPay, Paytm & more', Icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', Icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, getTotalPrice } = useCart();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const subtotal = getTotalPrice();
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const enrichedCart = cart.map((item) => {
    const fallback = seedProductMap.get(item.id);
    return {
      ...item,
      image: item.image ?? fallback?.image ?? '/paints/interior-matte.svg',
    };
  });

  const setField = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePlaceOrder = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
          paymentMethod: form.paymentMethod,
          products: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to place order. Please try again.');
      }

      // Save confirmation data to sessionStorage for the confirmation page
      sessionStorage.setItem(
        'colorburst_last_order',
        JSON.stringify({
          orderId: data.orderId,
          customerName: data.customerName,
          email: data.email,
          paymentMethod: data.paymentMethod,
          products: data.products,
          totalAmount: data.totalAmount,
          gst: data.totalAmount * 0.18,
          grandTotal: data.totalAmount * 1.18,
        })
      );

      clearCart();
      router.push('/order-confirmation');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[#eaeded] px-4">
        <ShoppingBag size={64} className="text-gray-300" />
        <h1 className="text-2xl font-semibold text-[#0f1111]">Your cart is empty</h1>
        <p className="text-sm text-[#565959]">Add products before proceeding to checkout.</p>
        <Link
          href="/products"
          className="rounded-full bg-[#ffd814] px-8 py-3 font-semibold text-[#0f1111] transition hover:bg-[#f7ca00]"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaeded] py-8 text-[#0f1111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-[#565959]">
          <Link href="/cart" className="inline-flex items-center gap-1 text-[#2162a1] transition hover:text-[#0f79af]">
            <ArrowLeft size={14} />
            Cart
          </Link>
          <span>/</span>
          <span className="font-medium text-[#0f1111]">Checkout</span>
        </nav>

        <h1 className="mb-8 text-3xl font-normal text-[#0f1111]">Checkout</h1>

        <AnimatePresence>
          {submitError && (
            <motion.div
              key="submit-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ───── LEFT COLUMN ───── */}
          <div className="space-y-6">
            {/* Shipping Details */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-lg bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-[#d5d9d9] px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232f3e] text-white">
                  <MapPin size={16} />
                </div>
                <h2 className="text-xl font-semibold text-[#0f1111]">Shipping Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldInput
                    label="Full Name *"
                    id="customerName"
                    value={form.customerName}
                    onChange={setField('customerName')}
                    placeholder="e.g. Rahul Sharma"
                    error={errors.customerName}
                    maxLength={120}
                  />
                </div>

                <FieldInput
                  label="Phone Number *"
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={setField('phone')}
                  placeholder="10-digit mobile number"
                  error={errors.phone}
                  maxLength={10}
                />

                <FieldInput
                  label="Email Address *"
                  id="email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="yourname@example.com"
                  error={errors.email}
                  maxLength={200}
                />

                <div className="sm:col-span-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="address" className="text-sm font-medium text-[#0f1111]">
                      Delivery Address *
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      value={form.address}
                      maxLength={300}
                      onChange={(e) => setField('address')(e.target.value)}
                      placeholder="Flat/House no., Building, Street, Area"
                      className={`w-full resize-none rounded-md border px-3 py-2.5 text-sm text-[#0f1111] outline-none transition focus:ring-2 focus:ring-[#e77600] ${
                        errors.address ? 'border-red-400 bg-red-50' : 'border-[#adb1b8] hover:border-[#e77600] focus:border-[#e77600]'
                      }`}
                    />
                    {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
                  </div>
                </div>

                <FieldInput
                  label="City *"
                  id="city"
                  value={form.city}
                  onChange={setField('city')}
                  placeholder="e.g. Mumbai"
                  error={errors.city}
                  maxLength={100}
                />

                <FieldInput
                  label="Pincode *"
                  id="pincode"
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={setField('pincode')}
                  placeholder="6-digit pincode"
                  error={errors.pincode}
                  maxLength={6}
                />
              </div>
            </motion.section>

            {/* Payment Method */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="overflow-hidden rounded-lg bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-[#d5d9d9] px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232f3e] text-white">
                  <Lock size={16} />
                </div>
                <h2 className="text-xl font-semibold text-[#0f1111]">Payment Method</h2>
              </div>

              <div className="space-y-3 px-6 py-6">
                {PAYMENT_OPTIONS.map(({ id, label, description, Icon }) => (
                  <label
                    key={id}
                    htmlFor={`pay-${id}`}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition ${
                      form.paymentMethod === id
                        ? 'border-[#e77600] bg-[#fff8f0]'
                        : 'border-[#d5d9d9] hover:border-[#e77600]'
                    }`}
                  >
                    <input
                      id={`pay-${id}`}
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={form.paymentMethod === id}
                      onChange={() => setField('paymentMethod')(id)}
                      className="accent-[#e77600]"
                    />
                    <Icon size={24} className={form.paymentMethod === id ? 'text-[#e77600]' : 'text-[#565959]'} />
                    <div>
                      <p className="font-medium text-[#0f1111]">{label}</p>
                      <p className="text-xs text-[#565959]">{description}</p>
                    </div>
                    {form.paymentMethod === id && (
                      <CheckCircle2 size={20} className="ml-auto shrink-0 text-[#e77600]" />
                    )}
                  </label>
                ))}

                {/* UPI extra field */}
                <AnimatePresence>
                  {form.paymentMethod === 'upi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <FieldInput
                          label="UPI ID *"
                          id="upiId"
                          value={form.upiId}
                          onChange={setField('upiId')}
                          placeholder="yourname@upi"
                          error={errors.upiId}
                          maxLength={256}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Card extra fields */}
                <AnimatePresence>
                  {form.paymentMethod === 'card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldInput
                            label="Card Number *"
                            id="cardNumber"
                            inputMode="numeric"
                            value={form.cardNumber}
                            onChange={(v) => {
                              const digits = v.replace(/\D/g, '').slice(0, 16);
                              const spaced = digits.replace(/(.{4})/g, '$1 ').trim();
                              setField('cardNumber')(spaced);
                            }}
                            placeholder="1234 5678 9012 3456"
                            error={errors.cardNumber}
                            maxLength={19}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldInput
                            label="Name on Card *"
                            id="cardName"
                            value={form.cardName}
                            onChange={setField('cardName')}
                            placeholder="As printed on card"
                            error={errors.cardName}
                            maxLength={120}
                          />
                        </div>
                        <FieldInput
                          label="Expiry (MM/YY) *"
                          id="cardExpiry"
                          inputMode="numeric"
                          value={form.cardExpiry}
                          onChange={(v) => {
                            const digits = v.replace(/\D/g, '').slice(0, 4);
                            const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                            setField('cardExpiry')(formatted);
                          }}
                          placeholder="MM/YY"
                          error={errors.cardExpiry}
                          maxLength={5}
                        />
                        <FieldInput
                          label="CVV *"
                          id="cardCvv"
                          type="password"
                          inputMode="numeric"
                          value={form.cardCvv}
                          onChange={setField('cardCvv')}
                          placeholder="3 or 4 digits"
                          error={errors.cardCvv}
                          maxLength={4}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-2 border-t border-[#eaeded] px-6 py-3 text-sm text-[#565959]">
                <ShieldCheck size={16} className="text-[#067d62]" />
                <span>All transactions are protected with 256-bit SSL encryption.</span>
              </div>
            </motion.section>
          </div>

          {/* ───── RIGHT COLUMN – ORDER SUMMARY ───── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="sticky top-20 space-y-4"
            >
              <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b border-[#d5d9d9] px-5 py-4">
                  <h2 className="text-xl font-semibold text-[#0f1111]">Order Summary</h2>
                  <p className="mt-0.5 text-xs text-[#565959]">
                    {cart.reduce((s, i) => s + i.quantity, 0)} item(s)
                  </p>
                </div>

                {/* Product list */}
                <ul className="divide-y divide-[#eaeded]">
                  {enrichedCart.map((item) => (
                    <li key={item.id} className="flex gap-3 px-5 py-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[#f0f2f2] bg-[#f7fafa]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#0f1111]">{item.name}</p>
                        <p className="text-xs text-[#565959]">{item.category}</p>
                        <p className="mt-0.5 text-xs text-[#565959]">Qty: {item.quantity}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#0f1111]">
                          {currencyFormatter.format(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-[#565959]">
                          {currencyFormatter.format(item.price)} each
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Price breakdown */}
                <div className="border-t border-[#d5d9d9] px-5 py-4">
                  <div className="space-y-2 text-sm text-[#565959]">
                    <div className="flex justify-between">
                      <span>Items subtotal</span>
                      <span>{currencyFormatter.format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-medium text-[#067d62]">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>{currencyFormatter.format(gst)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#d5d9d9] pt-4">
                    <span className="text-base font-semibold text-[#0f1111]">Order Total</span>
                    <span className="text-2xl font-bold text-[#b12704]">{currencyFormatter.format(total)}</span>
                  </div>
                </div>

                {/* Delivery estimate */}
                <div className="flex items-center gap-2 border-t border-[#eaeded] bg-[#f7fafa] px-5 py-3 text-sm text-[#565959]">
                  <Truck size={15} className="shrink-0 text-[#007185]" />
                  <span>Estimated delivery: <strong className="text-[#0f1111]">3–5 business days</strong></span>
                </div>

                {/* Place Order Button */}
                <div className="px-5 pb-5 pt-4">
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                    className="w-full rounded-full bg-[#ffd814] py-3 text-center font-semibold text-[#0f1111] shadow-sm transition hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Placing your order…
                      </span>
                    ) : (
                      'Place Order'
                    )}
                  </motion.button>

                  <p className="mt-3 text-center text-xs text-[#565959]">
                    By placing this order you agree to ColorBurst's{' '}
                    <span className="text-[#2162a1]">Terms & Conditions</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

