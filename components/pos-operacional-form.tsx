"use client"

import Image from "next/image";
import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, FileText, Fuel, HandCoins, Info, LogIn, LogOut, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type ApiResp = {
  persona: string;
  contratos: Array<{
    contrato: string;
    responsable?: string;
    vehiculos: Array<{ id: number; numeroInterno: string; vehiculo: string; odometro?: number }>;
  }>;
  message?: string;
};

// Helper UI
function SectionCard({
  title,
  icon: Icon,
  tone = "bg-slate-50",
  children,
}: {
  title: string;
  icon: any;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 shadow-sm ${tone}`}>
      <header className="flex items-center gap-2 px-5 py-3 border-b border-slate-200/70">
        <Icon className="h-5 w-5" />
        <h2 className="text-base font-semibold tracking-wide">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function PosOperacionalForm() {
  const searchParams = useSearchParams();
  const telegramId = searchParams.get("telegram_id");

  // Empleado (desde FastAPI proxy /api/usuario)
  const [empleado, setEmpleado] = useState("");
  const [loadingEmpleado, setLoadingEmpleado] = useState(true);

  // Contratos/vehículos dinámicos (desde /api/vehiculos-por-persona)
  const [lista, setLista] = useState<ApiResp | null>(null);
  const [contrato, setContrato] = useState<string>("");
  const [vehiculoSel, setVehiculoSel] = useState<{ numeroInterno: string; vehiculo: string; odometro?: number } | null>(null);

  // Form
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [kmFinal, setKmFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Archivos
  const planillaInputRef = useRef<HTMLInputElement>(null);
  const [planillaFile, setPlanillaFile] = useState<File | null>(null);

  // Combustible
  const [showFuelSection, setShowFuelSection] = useState(false);
  const combustibleInputRef = useRef<HTMLInputElement>(null);
  const [combustibleFiles, setCombustibleFiles] = useState<FileList | null>(null);
  const [tipoCombustible, setTipoCombustible] = useState("");
  const [kmFinalCombustible, setKmFinalCombustible] = useState("");
  const [tanqueoGastos, setTanqueoGastos] = useState(false);
  const [galonesTanqueados, setGalonesTanqueados] = useState("");
  const [totalFacturasCombustible, setTotalFacturasCombustible] = useState("");

  // Gastos
  const [showExpensesSection, setShowExpensesSection] = useState(false);
  const alimentacionInputRef = useRef<HTMLInputElement>(null);
  const hospedajeInputRef = useRef<HTMLInputElement>(null);
  const peajesInputRef = useRef<HTMLInputElement>(null);
  const otrosInputRef = useRef<HTMLInputElement>(null);

  const [alimentacionFiles, setAlimentacionFiles] = useState<FileList | null>(null);
  const [hospedajeFiles, setHospedajeFiles] = useState<FileList | null>(null);
  const [peajesFiles, setPeajesFiles] = useState<FileList | null>(null);
  const [otrosFiles, setOtrosFiles] = useState<FileList | null>(null);

  const [totalFacturaAlimentacion, setTotalFacturaAlimentacion] = useState("");
  const [totalFacturaHospedaje, setTotalFacturaHospedaje] = useState("");
  const [totalFacturaPeajes, setTotalFacturaPeajes] = useState("");
  const [totalFacturaOtros, setTotalFacturaOtros] = useState("");

  // Cargar empleado
  useEffect(() => {
    if (!telegramId) return;
    setLoadingEmpleado(true);
    fetch(`/api/usuario?telegram_id=${encodeURIComponent(telegramId)}`)
      .then((res) => res.json())
      .then((data) => setEmpleado((data?.nombre || "").trim()))
      .catch((err) => console.error("Error cargando empleado:", err))
      .finally(() => setLoadingEmpleado(false));
  }, [telegramId]);

  // Con empleado -> carga contratos/vehículos
  useEffect(() => {
    if (loadingEmpleado || !empleado) return;

    (async () => {
      try {
        const r = await fetch(`/api/vehiculos-por-persona?persona=${encodeURIComponent(empleado)}`);
        const j: ApiResp = await r.json();
        setLista(j);

        // Autoselección inicial opcional
        if (j?.contratos?.length) {
          const c0 = j.contratos[0];
          setContrato(c0.contrato);
          const v0 = c0.vehiculos[0];
          if (v0) {
            setVehiculoSel(v0);
            if (v0.odometro) setKmFinal(String(v0.odometro));
          }
        } else {
          setContrato("");
          setVehiculoSel(null);
        }
      } catch (e) {
        console.error("vehiculos-por-persona:", e);
      }
    })();
  }, [loadingEmpleado, empleado]);

  // Lista de vehículos para el contrato seleccionado
  const vehiculosDelContrato = useMemo(() => {
    if (!lista || !contrato) return [];
    const c = lista.contratos.find((x) => x.contrato === contrato);
    return c?.vehiculos ?? [];
  }, [lista, contrato]);

  // Cambiar contrato
  const onChangeContrato = (value: string) => {
    setContrato(value);
    setVehiculoSel(null);
  };

  // Cambiar vehículo
  const onChangeVehiculo = (value: string) => {
    const [nint] = value.split("|");
    const v = vehiculosDelContrato.find((x) => x.numeroInterno === nint) || null;
    setVehiculoSel(v);
    if (v?.odometro) setKmFinal(String(v.odometro));
  };

  const getFileNames = (files: FileList | null) => {
    if (!files || files.length === 0) return "Ningún archivo seleccionado";
    if (files.length === 1) return files[0].name;
    return `${files.length} archivos seleccionados`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      empleado,
      contrato,
      vehiculo: vehiculoSel ? vehiculoSel.vehiculo : "",
      fechaEntrada,
      fechaSalida,
      kmFinal: kmFinal ? parseInt(kmFinal) : null,
      planillaServiciosNombre: planillaFile?.name || null,
      tanqueo: showFuelSection,
      tipoCombustible: showFuelSection ? tipoCombustible : null,
      kmFinalCombustible: showFuelSection && kmFinalCombustible ? parseInt(kmFinalCombustible) : null,
      tanqueoGastos: showFuelSection ? tanqueoGastos : null,
      galonesTanqueados: showFuelSection && galonesTanqueados ? parseFloat(galonesTanqueados) : null,
      totalFacturasCombustible: showFuelSection && totalFacturasCombustible ? parseInt(totalFacturasCombustible) : null,
      facturasCombustible: [],
      tieneGastosOperacionales: showExpensesSection,
      totalFacturaAlimentacion: showExpensesSection && totalFacturaAlimentacion ? parseInt(totalFacturaAlimentacion) : null,
      facturasAlimentacion: [],
      totalFacturaHospedaje: showExpensesSection && totalFacturaHospedaje ? parseInt(totalFacturaHospedaje) : null,
      facturasHospedaje: [],
      totalFacturaPeajes: showExpensesSection && totalFacturaPeajes ? parseInt(totalFacturaPeajes) : null,
      facturasPeajes: [],
      totalFacturaOtros: showExpensesSection && totalFacturaOtros ? parseInt(totalFacturaOtros) : null,
      facturasOtros: [],
      observaciones,
    };

    const res = await fetch("/api/guardar-posoperacional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      alert("Formulario enviado correctamente");
      window.location.reload();
    } else {
      alert("Error al guardar en la base de datos");
    }
  };

  return (
    <div className="min-h-screen bg-sky-100 py-8">
      {/* Encabezado con logo */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <Image src="/viacotur 3.png" width={220} height={60} alt="VIACOTUR S.A." priority />
        <div className="w-full max-w-4xl rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-sky-100 to-emerald-50 shadow-sm">
          <div className="px-6 py-5">
            <h1 className="text-center text-xl font-medium tracking-wide text-sky-900">REGISTRO POS-OPERACIONAL</h1>
            <p className="mt-1 text-center text-sm text-sky-700/80">Sistema de Control Operativo</p>
          </div>
          <div className="h-[3px] w-full rounded-b-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Personal */}
        <SectionCard title="Información del Personal" icon={User} tone="bg-blue-50">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Empleado</label>
              <div className="relative">
                <Input value={loadingEmpleado ? "Cargando…" : empleado} readOnly className="pr-9" />
                <Info className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Contrato dinámico */}
            <div>
              <label className="mb-1 block text-sm">Contrato</label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-white"
                value={contrato}
                onChange={(e) => onChangeContrato(e.target.value)}
              >
                {lista?.contratos?.length ? (
                  lista.contratos.map((c) => (
                    <option key={c.contrato} value={c.contrato}>
                      {c.contrato}
                    </option>
                  ))
                ) : (
                  <option value="">{lista?.message || "Sin contratos disponibles"}</option>
                )}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Información del Vehículo */}
        <SectionCard title="Información del Vehículo" icon={Truck} tone="bg-emerald-50">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Vehículo / Nº Interno</label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-white"
                value={vehiculoSel ? `${vehiculoSel.numeroInterno}|${vehiculoSel.vehiculo}` : ""}
                onChange={(e) => onChangeVehiculo(e.target.value)}
              >
                <option value="" disabled>Selecciona…</option>
                {vehiculosDelContrato.map((v) => (
                  <option key={v.numeroInterno} value={`${v.numeroInterno}|${v.vehiculo}`}>
                    Nº {v.numeroInterno} — {v.vehiculo}{v.odometro ? ` (odómetro: ${v.odometro})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">KM Final</label>
              <Input value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} placeholder="50000" />
            </div>
          </div>
        </SectionCard>

        {/* Fechas y Horarios */}
        <SectionCard title="Fechas y Horarios" icon={Calendar} tone="bg-fuchsia-50">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <LogIn className="h-4 w-4" />
                Entrada
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  value={fechaEntrada.split("T")[0] || ""}
                  onChange={(e) =>
                    setFechaEntrada(e.target.value ? `${e.target.value}T${fechaEntrada.split("T")[1] || ""}` : "")
                  }
                />
                <Input
                  type="time"
                  value={fechaEntrada.split("T")[1] || ""}
                  onChange={(e) =>
                    setFechaEntrada(
                      fechaEntrada.split("T")[0] ? `${fechaEntrada.split("T")[0]}T${e.target.value}` : `T${e.target.value}`
                    )
                  }
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <LogOut className="h-4 w-4" />
                Salida
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  value={fechaSalida.split("T")[0] || ""}
                  onChange={(e) =>
                    setFechaSalida(e.target.value ? `${e.target.value}T${fechaSalida.split("T")[1] || ""}` : "")
                  }
                />
                <Input
                  type="time"
                  value={fechaSalida.split("T")[1] || ""}
                  onChange={(e) =>
                    setFechaSalida(
                      fechaSalida.split("T")[0] ? `${fechaSalida.split("T")[0]}T${e.target.value}` : `T${e.target.value}`
                    )
                  }
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Servicios y Verificaciones */}
        {/* <SectionCard title="Servicios y Verificaciones" icon={FileText} tone="bg-amber-50"> */}
          {/* <div className="space-y-6"> */}
            {/* Planilla */}
            {/* <div> */}
              {/* <label className="mb-1 block text-sm">Planilla de Servicios</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={planillaInputRef}
                  onChange={(e) => setPlanillaFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => planillaInputRef.current?.click()}>
                  Seleccionar archivo
                </Button>
                <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  {planillaFile ? planillaFile.name : "Ningún archivo seleccionado"} */}
                {/* </div> */}
              {/* </div> */}
            {/* </div> */}

            {/* Toggles */}
            {/* <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-sky-50 p-3">
                <Checkbox id="chkComb" checked={showFuelSection} onCheckedChange={(v) => setShowFuelSection(Boolean(v))} />
                <label htmlFor="chkComb" className="select-none text-sm flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  ¿Tanqueaste Combustible?
                </label>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                <Checkbox
                  id="chkGastos"
                  checked={showExpensesSection}
                  onCheckedChange={(v) => setShowExpensesSection(Boolean(v))}
                />
                <label htmlFor="chkGastos" className="select-none text-sm flex items-center gap-2">
                  <HandCoins className="h-4 w-4" />
                  ¿Tienes Gastos Operacionales?
                </label>
              </div>
            </div> */}

            {/* Combustible */}
            {/* {showFuelSection && (
              <div className="space-y-5 rounded-xl border border-sky-200 bg-sky-100 p-4">
                <h3 className="text-sm font-semibold text-sky-800">COMBUSTIBLES</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Tipo de Combustible</label>
                    <Input value={tipoCombustible} onChange={(e) => setTipoCombustible(e.target.value)} placeholder="Diesel, Gasolina..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">KM Final</label>
                    <Input value={kmFinalCombustible} onChange={(e) => setKmFinalCombustible(e.target.value)} placeholder="125286" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="tanqueoGastos" checked={tanqueoGastos} onCheckedChange={(v) => setTanqueoGastos(Boolean(v))} />
                  <label htmlFor="tanqueoGastos" className="text-sm">¿Tanqueo para gastos operacionales?</label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Galones/m³ tanqueados</label>
                    <Input value={galonesTanqueados} onChange={(e) => setGalonesTanqueados(e.target.value)} placeholder="11.286" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Valor total facturas combustible</label>
                    <Input value={totalFacturasCombustible} onChange={(e) => setTotalFacturasCombustible(e.target.value)} placeholder="98625" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm">Facturas de Combustible</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      ref={combustibleInputRef}
                      onChange={(e) => setCombustibleFiles(e.target.files)}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" onClick={() => combustibleInputRef.current?.click()}>
                      Seleccionar archivo
                    </Button>
                    <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      {getFileNames(combustibleFiles)}
                    </div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Gastos Operacionales */}
            {/* {showExpensesSection && (
              <div className="space-y-5 rounded-xl border border-emerald-200 bg-sky-100 p-4">
                <h3 className="text-sm font-semibold text-emerald-800">GASTOS OPERACIONALES PARA REEMBOLSO</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Valor total facturas alimentación</label>
                    <Input value={totalFacturaAlimentacion} onChange={(e) => setTotalFacturaAlimentacion(e.target.value)} placeholder="98625" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Facturas alimentación</label>
                    <div className="flex items-center gap-2">
                      <input type="file" multiple ref={alimentacionInputRef} onChange={(e) => setAlimentacionFiles(e.target.files)} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => alimentacionInputRef.current?.click()}>
                        Seleccionar archivo
                      </Button>
                      <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {getFileNames(alimentacionFiles)}
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Valor total facturas hospedaje</label>
                    <Input value={totalFacturaHospedaje} onChange={(e) => setTotalFacturaHospedaje(e.target.value)} placeholder="98625" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Facturas hospedaje</label>
                    <div className="flex items-center gap-2">
                      <input type="file" multiple ref={hospedajeInputRef} onChange={(e) => setHospedajeFiles(e.target.files)} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => hospedajeInputRef.current?.click()}>
                        Seleccionar archivo
                      </Button>
                      <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {getFileNames(hospedajeFiles)}
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Valor total facturas peajes</label>
                    <Input value={totalFacturaPeajes} onChange={(e) => setTotalFacturaPeajes(e.target.value)} placeholder="98625" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Facturas peajes</label>
                    <div className="flex items-center gap-2">
                      <input type="file" multiple ref={peajesInputRef} onChange={(e) => setPeajesFiles(e.target.files)} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => peajesInputRef.current?.click()}>
                        Seleccionar archivo
                      </Button>
                      <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {getFileNames(peajesFiles)}
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Valor total otros imprevistos</label>
                    <Input value={totalFacturaOtros} onChange={(e) => setTotalFacturaOtros(e.target.value)} placeholder="98625" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Facturas otros imprevistos</label>
                    <div className="flex items-center gap-2">
                      <input type="file" multiple ref={otrosInputRef} onChange={(e) => setOtrosFiles(e.target.files)} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => otrosInputRef.current?.click()}>
                        Seleccionar archivo
                      </Button>
                      <div className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        {getFileNames(otrosFiles)}
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            {/* )} */}
          {/* </div> */}
        {/* </SectionCard> */}

        {/* Observaciones */}
        <SectionCard title="Observaciones" icon={Info} tone="bg-sky-100">
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese sus observaciones aquí..."
            rows={4}
          />
        </SectionCard>

        {/* Enviar */}
        <div className="flex justify-center pt-2">
          <Button type="submit" className="px-10">
            ENVIAR
          </Button>
        </div>
      </form>
    </div>
  );
}
