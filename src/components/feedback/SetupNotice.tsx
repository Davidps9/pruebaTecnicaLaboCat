export default function SetupNotice() {
    return (
        <main className="grid min-h-screen place-items-center bg-[#0b1220] px-5 py-12 text-slate-100">
            <section className="panel w-full max-w-xl rounded-3xl p-8 sm:p-10">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-300">
                    ⚙
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                    ObraPlan · Configuración
                </p>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                    Conecta tu proyecto de Supabase
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                    La aplicación está instalada, pero no encuentra las variables
                    de entorno necesarias para conectarse a Supabase.
                </p>

                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4 font-mono text-xs leading-6 text-slate-300">
                    <p>VITE_SUPABASE_URL=https://...supabase.co</p>
                    <p>VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...</p>
                </div>

                <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
                    <p className="text-xs leading-5 text-slate-400">
                        Crea un archivo <code className="text-sky-300">.env</code> en
                        la raíz del proyecto, introduce tus credenciales y ejecuta
                        de nuevo <code className="text-sky-300">npm run dev</code>.
                    </p>
                </div>
            </section>
        </main>
    )
}