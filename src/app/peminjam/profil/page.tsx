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

export default function AdminProfilePage() {
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
    <div className="min-h-screen py-8">
      <div className="w-full mx-auto px-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6 mb-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-4 lg:mb-0">
              <h1 className="lg:text-2xl text-xl font-bold">Profil Saya</h1>
              <p className="text-gray-600 mt-2 max-w-md">
                Kelola informasi profil Anda dengan mudah dan aman
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                Nama Lengkap
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.name
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <span>⚠</span> {errors.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent">
                  <p className="text-gray-900 font-medium">
                    {user.name || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Username */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                Username
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.username
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Masukkan username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <span>⚠</span> {errors.username}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent">
                  <p className="text-gray-900 font-medium">
                    {user.username || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Masukkan email (opsional)"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent">
                  <p className="text-gray-900 font-medium">
                    {user.email || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Nomor Handphone */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Phone className="w-4 h-4 text-orange-600" />
                </div>
                Nomor Handphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="noHandphone"
                  value={formData.noHandphone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Masukkan nomor handphone (opsional)"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent">
                  <p className="text-gray-900 font-medium">
                    {user.noHandphone || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Password */}
            {isEditing && (
              <div className="space-y-3 md:col-span-2">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Key className="w-4 h-4 text-red-600" />
                  </div>
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <span>💡</span> Biarkan kosong jika tidak ingin mengubah
                  password
                </p>
              </div>
            )}

            {/* Role */}
            {!isEditing && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  Role
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                  <span
                    className={`font-bold ${
                      user.role === "ADMIN"
                        ? "text-indigo-600"
                        : user.role === "SUPERADMIN"
                        ? "text-purple-600"
                        : "text-gray-600"
                    }`}
                  >
                    {user.role === "ADMIN"
                      ? "Admin"
                      : user.role === "SUPERADMIN"
                      ? "Super Admin"
                      : user.role}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="group flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 hover:scale-105"
              >
                {isUpdating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Simpan Perubahan
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/50 p-6 mt-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            Informasi Akun
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Tanggal Bergabung</p>
                <p className="text-gray-900 font-medium bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            {user.updated_at && (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Terakhir Diperbarui
                </p>
                <p className="text-gray-900 font-medium bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                  {new Date(user.updated_at).toLocaleDateString("id-ID", {
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
