import Image from "next/image";

const page = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-overlay bg-black/75">
      <div className="flex w-9/12 h-9/12 justify-center bg-[url(/img/bgbalmon.JPG)] bg-cover bg-center bg-blend-darken bg-black/10 rounded-4xl shadow-xl/30">
        <div className="flex flex-col w-1/2 p-8">
          <Image src="/img/komdigi2.png" width={250} height={250} alt="#" />
        </div>
        <div className="flex flex-col justify-center px-14 rounded-2xl w-1/2">
          <div className="flex flex-col justify-center py-10 px-6 rounded-2xl border border-white/60 bg-white/45 backdrop-blur-xs shadow-lg">
            <h1 className="text-center text-4xl font-bold">Login</h1>
            <div className="card-body">
              <fieldset className="fieldset">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input w-full bg-white"
                  placeholder="Email"
                />
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input w-full bg-white"
                  placeholder="Password"
                />
                <div>
                  <a className="link link-hover">Forgot password?</a>
                </div>
                <button className="btn btn-info">Masuk</button>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
