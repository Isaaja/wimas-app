import { CartItem } from "@/hooks/useCart";

interface CartStep1Props {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}

export default function CartStep1({
  cart,
  onRemove,
  onUpdateQty,
}: CartStep1Props) {
  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">Keranjang masih kosong.</p>
        <p className="text-sm text-gray-400 mt-2">
          Tambahkan perangkat terlebih dahulu untuk melanjutkan peminjaman.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-y-auto max-h-96 space-y-3">
        {cart.map((item) => {
          const availableCount =
            item.units?.filter(
              (unit) => unit.condition === "GOOD" && unit.status === "AVAILABLE"
            ).length || 0;

          return (
            <div
              key={item.product_id}
              className="flex items-center justify-between border-b pb-3"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-gray-600">
                    Jumlah:{" "}
                    <span className="font-semibold">{item.quantity}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock tersedia: {availableCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="join">
                  <button
                    className="join-item btn btn-xs btn-outline"
                    onClick={() =>
                      onUpdateQty(
                        item.product_id,
                        Math.max(item.quantity - 1, 1)
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="join-item btn btn-xs btn-ghost no-animation">
                    {item.quantity}
                  </span>
                  <button
                    className="join-item btn btn-xs btn-outline"
                    onClick={() =>
                      onUpdateQty(item.product_id, item.quantity + 1)
                    }
                    disabled={item.quantity >= availableCount}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn btn-xs btn-error ml-2"
                  onClick={() => onRemove(item.product_id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Total Perangkat:</strong> {cart.length} item
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Total Quantity:</strong>{" "}
          {cart.reduce((sum, item) => sum + item.quantity, 0)} unit
        </p>
      </div>
    </div>
  );
}
