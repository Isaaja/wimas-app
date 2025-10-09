"use client";

import { useState } from "react";
import { CartItem } from "@/hooks/useCart";

interface CartSummaryProps {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onCheckout: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function CartSummary({
  cart,
  onRemove,
  onUpdateQty,
  onCheckout,
  onClose,
  isLoading,
}: CartSummaryProps) {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl bg-white">
        <h3 className="font-bold text-lg border-b pb-2 mb-3">
          {step === 1 && "1️⃣ Pilih Perangkat"}
          {step === 2 && "2️⃣ Upload SPT"}
          {step === 3 && "3️⃣ Divisi team"}
        </h3>

        {/* STEP 1 - PERANGKAT */}
        {step === 1 && (
          <>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500">
                Keranjang masih kosong.
              </p>
            ) : (
              <div className="overflow-y-auto max-h-[55vh] space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        Jumlah: {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          onUpdateQty(
                            item.product_id,
                            Math.max(item.quantity - 1, 1)
                          )
                        }
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          onUpdateQty(item.product_id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        className="btn btn-xs btn-error ml-2"
                        onClick={() => onRemove(item.product_id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2 - SPT */}
        {step === 2 && (
          <div className="overflow-y-auto max-h-[55vh]">
            <p className="text-gray-600 mb-2">spt disini bang</p>
          </div>
        )}

        {/* STEP 3 - USER */}
        {step === 3 && (
          <div className="overflow-y-auto max-h-[55vh]">
            <p className="text-gray-600 mb-2">nambah tim disini bang</p>
          </div>
        )}

        {/* FOOTER NAVIGATION */}
        <div className="modal-action flex justify-between items-center">
          <button className="btn" onClick={onClose}>
            Tutup
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button className="btn btn-outline" onClick={prevStep}>
                ⬅ Prev
              </button>
            )}

            {step < 3 ? (
              <button className="btn btn-accent text-black" onClick={nextStep}>
                Next ➡
              </button>
            ) : (
              <button
                className="btn btn-success text-white"
                onClick={onCheckout}
                disabled={isLoading || cart.length === 0}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Konfirmasi Pinjam"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
