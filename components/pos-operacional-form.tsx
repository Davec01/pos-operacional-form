"use client"

import Image from "next/image";
import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, FileText, Fuel, HandCoins, Info, LogIn, LogOut, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Empleado = {
  id: number;
  nombre: string;
  contrato: string;
  agreement_id: number | null;
  puesto_trabajo: string;
  telefono_movil_laboral: string;
};

type Vehiculo = {
  id: number;
  nombre: string;
  matricula: string;
  numero_interno: string;
  modelo: string;
  ultimo_odometro: number;
  conductor: string;
  estado: string;
  tipo_solicitud: string;
  capacidad_pasajeros: number;
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

  // Estados para empleados y vehículos
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoSel, setVehiculoSel] = useState<Vehiculo | null>(null);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  // Token de autenticación (se obtiene de las respuestas de API)
  const [authToken, setAuthToken] = useState<string>("");

  // Nombre del usuario de Telegram (autollenado)
  const [nombreUsuarioTelegram, setNombreUsuarioTelegram] = useState<string>("");
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  // Form
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [kmInicial, setKmInicial] = useState("");
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

  // 1. Cargar usuario de Telegram por telegram_id
  useEffect(() => {
    if (!telegramId) {
      setLoadingUsuario(false);
      return;
    }

    setLoadingUsuario(true);
    fetch(`/api/usuario?telegram_id=${encodeURIComponent(telegramId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.nombre) {
          setNombreUsuarioTelegram(data.nombre);
        } else if (data?.error) {
          console.error("Error validando usuario:", data.error);
          alert(`Error: ${data.error}`);
        }
      })
      .catch((err) => {
        console.error("Error cargando usuario:", err);
        alert("Error al validar usuario de Telegram");
      })
      .finally(() => setLoadingUsuario(false));
  }, [telegramId]);

  // 2. Cargar lista de empleados al iniciar
  useEffect(() => {
    setLoadingEmpleados(true);
    fetch("/api/empleados")
      .then((res) => res.json())
      .then((data) => {
        if (data?.empleados) {
          setEmpleados(data.empleados);
        }
        // Guardar el token para uso posterior
        if (data?.token) {
          setAuthToken(data.token);
        }
      })
      .catch((err) => console.error("Error cargando empleados:", err))
      .finally(() => setLoadingEmpleados(false));
  }, []);

  // 3. Cuando se carga el nombre del usuario y la lista de empleados,
  //    auto-seleccionar el empleado que coincida con el nombre
  useEffect(() => {
    if (loadingUsuario || loadingEmpleados || !nombreUsuarioTelegram || empleados.length === 0) {
      return;
    }

    // Normalizar para comparación
    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const nombreNormalizado = normalize(nombreUsuarioTelegram);

    // Buscar empleado por nombre
    const empleadoEncontrado = empleados.find(
      (emp) => normalize(emp.nombre) === nombreNormalizado
    );

    if (empleadoEncontrado) {
      // Auto-seleccionar el empleado
      onChangeEmpleado(String(empleadoEncontrado.id));
    } else {
      console.warn(
        `No se encontró empleado con nombre: "${nombreUsuarioTelegram}"`
      );
    }
  }, [nombreUsuarioTelegram, empleados, loadingUsuario, loadingEmpleados]);

  // Cuando se selecciona un empleado, cargar sus vehículos
  const onChangeEmpleado = async (empleadoId: string) => {
    if (!empleadoId) {
      setEmpleadoSeleccionado(null);
      setVehiculos([]);
      setVehiculoSel(null);
      return;
    }

    const empleado = empleados.find((e) => e.id === parseInt(empleadoId));
    if (!empleado) return;

    setEmpleadoSeleccionado(empleado);
    setVehiculoSel(null);
    setLoadingVehiculos(true);

    try {
      const res = await fetch(`/api/vehiculos-por-contrato?contrato=${encodeURIComponent(empleado.contrato)}`);
      const data = await res.json();

      if (data?.vehiculos) {
        setVehiculos(data.vehiculos);
        // Auto-seleccionar primer vehículo si existe
        if (data.vehiculos.length > 0) {
          const primerVehiculo = data.vehiculos[0];
          setVehiculoSel(primerVehiculo);
          if (primerVehiculo.ultimo_odometro) {
            setKmInicial(String(primerVehiculo.ultimo_odometro));
            setKmFinal(String(primerVehiculo.ultimo_odometro));
          }
        }
      }
      // Actualizar token si viene uno nuevo
      if (data?.token) {
        setAuthToken(data.token);
      }
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      setVehiculos([]);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  // Cambiar vehículo
  const onChangeVehiculo = (vehiculoId: string) => {
    if (!vehiculoId) {
      setVehiculoSel(null);
      return;
    }

    const vehiculo = vehiculos.find((v) => v.id === parseInt(vehiculoId));
    if (vehiculo) {
      setVehiculoSel(vehiculo);
      if (vehiculo.ultimo_odometro) {
        setKmInicial(String(vehiculo.ultimo_odometro));
        setKmFinal(String(vehiculo.ultimo_odometro));
      }
    }
  };

  const getFileNames = (files: FileList | null) => {
    if (!files || files.length === 0) return "Ningún archivo seleccionado";
    if (files.length === 1) return files[0].name;
    return `${files.length} archivos seleccionados`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!empleadoSeleccionado) {
      alert("Por favor selecciona un empleado");
      return;
    }

    if (!vehiculoSel) {
      alert("Por favor selecciona un vehículo");
      return;
    }

    if (!fechaEntrada || !fechaSalida) {
      alert("Por favor completa las fechas de entrada y salida");
      return;
    }

    if (!authToken) {
      alert("Token de autenticación no disponible. Recarga la página.");
      return;
    }

    // Formatear fechas al formato requerido por Odoo: "YYYY-MM-DD HH:MM:SS"
    // Sin conversión de timezone - usa exactamente lo que el usuario ingresó
    const formatDateTime = (isoString: string) => {
      if (!isoString) return "";

      // Parsear directamente sin crear objeto Date
      const [date, time] = isoString.split("T");
      const timeFormatted = time || "00:00";

      // Retornar directamente el string en formato Odoo
      return `${date} ${timeFormatted}:00`;
    };

    // Calcular km recorridos
    const kmStart = kmInicial ? parseFloat(kmInicial) : 0;
    const kmEnd = kmFinal ? parseFloat(kmFinal) : 0;
    const kmTraveled = kmEnd - kmStart;

    // Preparar body en formato Odoo
    const body = {
      token: authToken,
      employee_id: empleadoSeleccionado.id,
      vehicle_id: vehiculoSel.id,
      agreement_id: empleadoSeleccionado.agreement_id || 36, // Usar agreement_id del empleado o valor por defecto

      check_in: formatDateTime(fechaEntrada),
      check_out: formatDateTime(fechaSalida),

      lunch_hour: 1.0,
      km_start: kmStart,
      km_end: kmEnd,
      km_traveled: kmTraveled,
      cost_id: observaciones || "",

      fuel_type: tipoCombustible || "diesel",
      fuel: showFuelSection,
      fuel_value: showFuelSection && totalFacturasCombustible ? parseFloat(totalFacturasCombustible) : 0,
      fuel_expenses: showFuelSection && tanqueoGastos,
      km_fuel: showFuelSection && kmFinalCombustible ? parseFloat(kmFinalCombustible) : kmEnd,
      gallons: showFuelSection && galonesTanqueados ? parseFloat(galonesTanqueados) : 0,

      feeding_value: showExpensesSection && totalFacturaAlimentacion ? parseFloat(totalFacturaAlimentacion) : 0,
      feeding: showExpensesSection && !!totalFacturaAlimentacion,
      lodging_value: showExpensesSection && totalFacturaHospedaje ? parseFloat(totalFacturaHospedaje) : 0,
      lodging: showExpensesSection && !!totalFacturaHospedaje,
      tolls_value: showExpensesSection && totalFacturaPeajes ? parseFloat(totalFacturaPeajes) : 0,
      tolls: showExpensesSection && !!totalFacturaPeajes,
      others_value: showExpensesSection && totalFacturaOtros ? parseFloat(totalFacturaOtros) : 0,
      others: showExpensesSection && !!totalFacturaOtros,

      observations: observaciones || "",
      notes: observaciones || "",

      attachment: !!planillaFile,
      attachment_filename: planillaFile?.name || false,
    };

    try {
      const res = await fetch("/api/guardar-posoperacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Formulario enviado correctamente a Odoo");
        window.location.reload();
      } else {
        alert(`Error al guardar: ${result.error || "Error desconocido"}`);
        console.error("Error details:", result);
      }
    } catch (error) {
      console.error("Error en submit:", error);
      alert("Error al enviar el formulario");
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
        {/* Validación de usuario de Telegram */}
        {loadingUsuario && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-sm text-blue-800">🔍 Validando usuario de Telegram...</p>
          </div>
        )}

        {!loadingUsuario && !nombreUsuarioTelegram && telegramId && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-sm text-red-800">⚠️ Usuario no registrado en el sistema</p>
            <p className="text-xs text-red-600 mt-1">Contacta al administrador para registrarte</p>
          </div>
        )}

        {!telegramId && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
            <p className="text-sm text-yellow-800">⚠️ Acceso solo desde Telegram</p>
            <p className="text-xs text-yellow-600 mt-1">Este formulario debe abrirse desde el bot de Telegram</p>
          </div>
        )}

        {/* Información del Personal */}
        <SectionCard title="Información del Personal" icon={User} tone="bg-blue-50">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Empleado</label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-white"
                value={empleadoSeleccionado?.id || ""}
                onChange={(e) => onChangeEmpleado(e.target.value)}
                disabled={loadingEmpleados || loadingUsuario || !nombreUsuarioTelegram}
              >
                <option value="">
                  {loadingUsuario
                    ? "Validando usuario..."
                    : loadingEmpleados
                    ? "Cargando empleados..."
                    : !nombreUsuarioTelegram
                    ? "Usuario no autorizado"
                    : empleadoSeleccionado
                    ? empleadoSeleccionado.nombre
                    : "Selecciona un empleado"}
                </option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
              {nombreUsuarioTelegram && empleadoSeleccionado && (
                <p className="text-xs text-green-600 mt-1">✓ Usuario validado: {nombreUsuarioTelegram}</p>
              )}
            </div>

            {/* Contrato (read-only, se llena automáticamente) */}
            <div>
              <label className="mb-1 block text-sm">Contrato</label>
              <div className="relative">
                <Input
                  value={empleadoSeleccionado?.contrato || ""}
                  readOnly
                  placeholder="Se llenará automáticamente"
                  className="pr-9 bg-slate-50"
                />
                <Info className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Información del Vehículo */}
        <SectionCard title="Información del Vehículo" icon={Truck} tone="bg-emerald-50">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Vehículo / Nº Interno</label>
              <select
                className="w-full h-10 rounded-md border px-3 text-sm bg-white"
                value={vehiculoSel?.id || ""}
                onChange={(e) => onChangeVehiculo(e.target.value)}
                disabled={loadingVehiculos || vehiculos.length === 0}
              >
                <option value="">
                  {loadingVehiculos
                    ? "Cargando vehículos..."
                    : vehiculos.length === 0
                    ? "No hay vehículos disponibles"
                    : "Selecciona un vehículo"}
                </option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    Nº {v.numero_interno} — {v.nombre} — {v.matricula}
                    {v.ultimo_odometro ? ` (odómetro: ${v.ultimo_odometro} km)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">KM Inicial</label>
              <Input
                value={kmInicial}
                onChange={(e) => setKmInicial(e.target.value)}
                placeholder="0"
                type="number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">KM Final</label>
              <Input
                value={kmFinal}
                onChange={(e) => setKmFinal(e.target.value)}
                placeholder="0"
                type="number"
              />
            </div>

            {kmInicial && kmFinal && parseFloat(kmFinal) > parseFloat(kmInicial) && (
              <div className="md:col-span-2 rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">KM Recorridos:</span>{" "}
                  {(parseFloat(kmFinal) - parseFloat(kmInicial)).toFixed(1)} km
                </p>
              </div>
            )}
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
