"use client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const { isPending, isError, error } = login;

  const handleLogin = (e: any) => {
    e.preventDefault();
    login.mutate(
      { username: email, password },
      {
        onSuccess: (res) => {
          toast.success(`Login berhasil! Selamat datang 👋`, {
            position: "top-right",
            autoClose: 3000,
          });
          setEmail("");
          setPassword("");
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              "Gagal login, periksa username & password.",
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        },
      }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen h-screen bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-overlay bg-black/75 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col lg:flex-row w-full max-w-sm md:max-w-md lg:max-w-4xl xl:max-w-6xl lg:h-full justify-center bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-darken bg-black/10 rounded-2xl lg:rounded-4xl shadow-xl/30">
        <div className="flex flex-col items-center lg:w-1/2 p-4 sm:p-6 lg:p-8">
          <Image
            src="/img/komdigi2.png"
            width={250}
            height={250}
            alt="#"
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-[250px] lg:h-[250px] object-contain"
          />
        </div>
        <div className="flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-14 rounded-2xl lg:w-1/2 pb-6 lg:pb-0">
          <div className="flex flex-col justify-center py-6 sm:py-8 lg:py-10 px-4 sm:px-5 lg:px-6 rounded-2xl border border-white/60 bg-white/45 backdrop-blur-xs shadow-lg">
            <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl font-serif tracking-widest font-semibold mb-2">
              Login
            </h1>
            <form onSubmit={handleLogin}>
              <div className="card-body p-2 sm:p-4">
                <fieldset className="fieldset">
                  <label className="label text-sm sm:text-base">Username</label>
                  <input
                    type="text"
                    className="input w-full bg-white text-sm sm:text-base"
                    placeholder="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label className="label text-sm sm:text-base">Password</label>
                  <input
                    type="password"
                    className="input w-full bg-white text-sm sm:text-base"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <a className="link link-hover text-xs sm:text-sm">
                      Forgot password?
                    </a>
                  </div>
                  {isError && (
                    <p className="text-red-500 text-xs sm:text-sm mt-2">
                      {error?.message || "Terjadi kesalahan saat login."}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="btn btn-info mt-4 w-full text-sm sm:text-base"
                    disabled={isPending}
                  >
                    {isPending ? "Memuat..." : "Masuk"}
                  </button>
                </fieldset>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
