import { Suspense } from "react";
import PosOperacionalForm from "@/components/pos-operacional-form";

// 👇 Evita que Next intente prerender la ruta "/"
export const dynamic = "force-dynamic";
// (opcional, aún más estricto)
// export const revalidate = 0;
// export const fetchCache = "force-no-store";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto py-4 px-4">
      <Suspense fallback={<p>Cargando…</p>}>
        <PosOperacionalForm />
      </Suspense>
    </main>
  );
}
