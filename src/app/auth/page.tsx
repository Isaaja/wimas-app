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
    <div className="flex justify-center items-center h-screen bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-overlay bg-black/75">
      <div className="flex w-11/12 h-11/12 lg:w-9/12 lg:h-9/12 justify-center bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-darken bg-black/10 rounded-4xl shadow-xl/30">
        <div className="flex flex-col w-1/2 p-8">
          <Image src="/img/komdigi2.png" width={250} height={250} alt="#" />
        </div>
        <div className="flex flex-col justify-center px-0 lg:px-14 rounded-2xl w-full lg:w-1/2">
          <div className="flex flex-col justify-center py-10 px-6 rounded-2xl border border-white/60 bg-white/45 backdrop-blur-xs shadow-lg">
            <h1 className="text-center text-4xl font-bold">Login</h1>
            <form onSubmit={handleLogin}>
              <div className="card-body">
                <fieldset className="fieldset">
                  <label className="label">Username</label>
                  <input
                    type="text"
                    className="input w-full bg-white"
                    placeholder="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input w-full bg-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <a className="link link-hover">Forgot password?</a>
                  </div>
                  {isError && (
                    <p className="text-red-500 text-sm mt-2">
                      {error?.message || "Terjadi kesalahan saat login."}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="btn btn-info mt-4 w-full"
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
