import React, { useEffect, useState } from "react";
import { User } from "@/hooks/useUsers";
import { toast } from "react-toastify";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: User | null;
  onSubmit: (data: any) => void;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
  onSubmit,
}) => {
  const isEdit = !!selectedUser;

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    noHandphone: "",
  });

  useEffect(() => {
    if (isEdit && selectedUser) {
      setFormData({
        name: selectedUser.name || "",
        username: selectedUser.username || "",
        email: selectedUser.email || "",
        noHandphone: selectedUser.noHandphone || "",
      });
    } else {
      setFormData({
        name: "",
        username: "",
        email: "",
        noHandphone: "",
      });
    }
  }, [isEdit, selectedUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username) {
      toast.error("Nama dan Username wajib diisi!");
      return;
    }

    const dataToSend = isEdit
      ? {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          noHandphone: formData.noHandphone,
        }
      : {
          name: formData.name,
          username: formData.username,
        };

    onSubmit(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <dialog id="user_modal" className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md bg-white">
        <h3 className="font-bold text-lg mb-4">
          {isEdit ? "Edit User" : "Tambah User"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">
              <span className="label-text">Nama</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Masukkan nama"
              className="input input-bordered w-full bg-white border-black"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Masukkan username"
              className="input input-bordered w-full bg-white border-black"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isEdit}
            />
          </div>

          {isEdit && (
            <>
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Masukkan email"
                  className="input input-bordered w-full bg-white border-black"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">No Handphone</span>
                </label>
                <input
                  type="text"
                  name="noHandphone"
                  placeholder="Masukkan nomor HP"
                  className="input input-bordered w-full bg-white border-black"
                  value={formData.noHandphone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default UserModal;
