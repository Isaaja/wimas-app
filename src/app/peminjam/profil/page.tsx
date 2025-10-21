"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/app/contexts/AuthContext";
import Loading from "@/app/components/common/Loading";
import { Edit, Save, X, User, Mail, Phone, Key } from "lucide-react";
import { useUpdateUser, useUserById } from "@/hooks/useUsers";

interface FormData {
  name: string;
  username: string;
  email: string;
  noHandphone: string;
  password: string;
}

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  noHandphone?: string;
}

export default function BorrowerProfilePage() {
  const { user: authUser, updateUser: updateAuthUser } = useAuthContext();
  const { mutate: updateUserMutation, isPending: isUpdating } = useUpdateUser();

  const {
    data: userData,
    isLoading: isFetchingUser,
    error: fetchError,
  } = useUserById(authUser?.userId || "");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    noHandphone: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (userData && !hasSyncedRef.current) {
      setFormData({
        name: userData.name || "",
        username: userData.username || "",
        email: userData.email || "",
        noHandphone: userData.noHandphone || "",
        password: "",
      });

      updateAuthUser({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        noHandphone: userData.noHandphone,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      });

      hasSyncedRef.current = true;
    }
  }, [userData, updateAuthUser]);

  if (!authUser) {
    return <Loading />;
  }

  if (isFetchingUser) {
    return <Loading />;
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{(fetchError as Error).message}</p>
        </div>
      </div>
    );
  }

  // Use fetched data as the source of truth
  const user = userData || authUser;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username wajib diisi";
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const payload: any = {
      name: formData.name,
      username: formData.username,
      email: formData.email.trim() || null,
      noHandphone: formData.noHandphone.trim() || null,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    updateUserMutation(
      { userId: authUser.userId, payload },
      {
        onSuccess: (updatedUser: any) => {
          // Update AuthContext with new data
          updateAuthUser({
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            noHandphone: updatedUser.noHandphone,
            updated_at: updatedUser.updated_at,
          });
          setIsEditing(false);
          setFormData((prev) => ({ ...prev, password: "" }));
        },
        onError: (error: Error) => {
          console.error("Gagal update profil:", error.message);
          alert(`Gagal update profil: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      noHandphone: user.noHandphone || "",
      password: "",
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      noHandphone: user.noHandphone || "",
      password: "",
    });
    setIsEditing(true);
  };

  return (
    <div className="min-h-fit bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
              <p className="text-gray-600 mt-1">
                Kelola informasi profil Anda untuk mengontrol, melindungi dan
                mengamankan akun
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                Nama Lengkap *
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded">
                  {user.name || "-"}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                Username *
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.username ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded">
                  {user.username || "-"}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan email (opsional)"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded">
                  {user.email || "-"}
                </p>
              )}
            </div>

            {/* Nomor Handphone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4" />
                Nomor Handphone
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    name="noHandphone"
                    value={formData.noHandphone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nomor handphone (opsional)"
                  />
                </div>
              ) : (
                <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded">
                  {user.noHandphone || "-"}
                </p>
              )}
            </div>

            {/* Password (hanya saat edit) */}
            {isEditing && (
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Key className="w-4 h-4" />
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
                <p className="text-gray-500 text-xs">
                  Biarkan kosong jika tidak ingin mengubah password
                </p>
              </div>
            )}

            {/* Informasi Read-only */}
            {!isEditing && (
              <>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    Role
                  </label>
                  <p className="text-gray-900 font-medium p-2 bg-gray-50 rounded">
                    {user.role === "BORROWER" ? "Peminjam" : user.role}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Required fields info */}
          {isEditing && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Catatan:</span> Field dengan tanda
                (*) wajib diisi. Email dan nomor handphone bersifat opsional.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>

              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Informasi Akun
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">User ID</p>
              <p className="text-gray-900 font-mono">
                {userData && "user_id" in userData
                  ? userData.user_id
                  : authUser.userId}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Tanggal Bergabung</p>
              <p className="text-gray-900">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>
            {user.updated_at && (
              <div className="md:col-span-2">
                <p className="text-gray-600">Terakhir Diperbarui</p>
                <p className="text-gray-900">
                  {new Date(user.updated_at).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
