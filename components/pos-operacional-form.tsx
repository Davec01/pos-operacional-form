"use client"

import Image from "next/image";
import { useRef, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, FileText, Fuel, HandCoins, Info, LogIn, LogOut, Truck, User } from "lucide-react";
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
  contrato?: string;
  tipo_solicitud?: string;
  capacidad_pasajeros?: number;
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

  const [vehiculoSel, setVehiculoSel] = useState<Vehiculo | null>(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);

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
  const [kmPlaceholder, setKmPlaceholder] = useState("0"); // Placeholder para los campos de KM
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
      setEmpleadoSeleccionado(empleadoEncontrado);
    } else {
      console.warn(
        `No se encontró empleado con nombre: "${nombreUsuarioTelegram}"`
      );
    }
  }, [nombreUsuarioTelegram, empleados, loadingUsuario, loadingEmpleados]);

  // 4. Cuando se tiene telegram_id, cargar el vehículo asignado
  useEffect(() => {
    if (!telegramId) {
      console.log("❌ No hay telegram_id, no se puede cargar vehículo");
      return;
    }

    if (loadingVehiculo) {
      console.log("⏳ Ya se está cargando el vehículo, esperando...");
      return;
    }

    console.log("🚗 Iniciando carga de vehículo para telegram_id:", telegramId);
    setLoadingVehiculo(true);

    fetch(`/api/vehiculo-asignado?telegram_id=${encodeURIComponent(telegramId)}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Respuesta del API vehiculo-asignado:", data);

        if (data?.vehiculo) {
          console.log("✅ Vehículo encontrado:", data.vehiculo);
          setVehiculoSel(data.vehiculo);
          // Usar el último odómetro solo como placeholder (no auto-llenar)
          if (data.vehiculo.ultimo_odometro) {
            setKmPlaceholder(String(data.vehiculo.ultimo_odometro));
            console.log("📊 Odómetro configurado:", data.vehiculo.ultimo_odometro);
          }
        } else if (data?.error) {
          console.error("❌ Error obteniendo vehículo asignado:", data.error);
          alert(`No se pudo cargar el vehículo: ${data.error}`);
        }

        // Actualizar token si viene uno nuevo
        if (data?.token) {
          setAuthToken(data.token);
          console.log("🔑 Token actualizado");
        }
      })
      .catch((err) => {
        console.error("❌ Error cargando vehículo asignado:", err);
        alert("Error al cargar el vehículo asignado. Por favor recarga la página.");
      })
      .finally(() => {
        setLoadingVehiculo(false);
        console.log("✅ Finalizada carga de vehículo");
      });
  }, [telegramId]);


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

    // Validar que la fecha de entrada no sea mayor que la de salida
    const entrada = new Date(fechaEntrada);
    const salida = new Date(fechaSalida);

    if (entrada > salida) {
      alert("La fecha de entrada no puede ser mayor que la fecha de salida");
      return;
    }

    if (!authToken) {
      alert("Token de autenticación no disponible. Recarga la página.");
      return;
    }

    // Formatear fechas al formato requerido por Odoo: "YYYY-MM-DD HH:MM:SS"
    // Sumar 5 horas para compensar la diferencia de zona horaria
    const formatDateTime = (isoString: string) => {
      if (!isoString) return "";

      // Parsear la fecha y hora ingresada por el usuario
      const [date, time] = isoString.split("T");
      const timeFormatted = time || "00:00";

      // Crear objeto Date con la fecha y hora ingresada
      const dateTime = new Date(`${date}T${timeFormatted}:00`);

      // Sumar 5 horas (5 * 60 * 60 * 1000 milisegundos)
      dateTime.setTime(dateTime.getTime() + (5 * 60 * 60 * 1000));

      // Formatear al formato de Odoo: YYYY-MM-DD HH:MM:SS
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, '0');
      const day = String(dateTime.getDate()).padStart(2, '0');
      const hours = String(dateTime.getHours()).padStart(2, '0');
      const minutes = String(dateTime.getMinutes()).padStart(2, '0');
      const seconds = String(dateTime.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
              <div className="relative">
                <Input
                  value={
                    loadingUsuario
                      ? "Validando usuario..."
                      : loadingEmpleados
                      ? "Cargando empleados..."
                      : !nombreUsuarioTelegram
                      ? "Usuario no autorizado"
                      : empleadoSeleccionado
                      ? empleadoSeleccionado.nombre
                      : "No se encontró empleado"
                  }
                  readOnly
                  placeholder="Se auto-llenará con tu usuario de Telegram"
                  className="pr-9 bg-slate-50"
                />
                <User className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
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
              <label className="mb-1 block text-sm">Vehículo Asignado</label>
              <div className="relative">
                <Input
                  value={
                    loadingVehiculo
                      ? "Cargando vehículo asignado..."
                      : vehiculoSel
                      ? `Nº ${vehiculoSel.numero_interno} — ${vehiculoSel.nombre.split('/').slice(0, 2).join('/')}/${vehiculoSel.matricula} — ${vehiculoSel.matricula} (odómetro: ${vehiculoSel.ultimo_odometro} km)`
                      : "No hay vehículo asignado"
                  }
                  readOnly
                  placeholder="Se auto-llenará con el vehículo asignado"
                  className="pr-9 bg-slate-50"
                />
                <Truck className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {vehiculoSel && vehiculoSel.ultimo_odometro && (
                <p className="text-xs text-emerald-600 mt-1">
                  ✓ Último odómetro registrado: {vehiculoSel.ultimo_odometro} km
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm">KM Inicial</label>
              <Input
                value={kmInicial}
                onChange={(e) => setKmInicial(e.target.value)}
                placeholder={kmPlaceholder}
                type="number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">KM Final</label>
              <Input
                value={kmFinal}
                onChange={(e) => setKmFinal(e.target.value)}
                placeholder={kmPlaceholder}
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
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <LogIn className="h-4 w-4" />
                Entrada
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative min-w-0">
                  <Calendar className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={fechaEntrada.split("T")[0] || ""}
                    onChange={(e) =>
                      setFechaEntrada(e.target.value ? `${e.target.value}T${fechaEntrada.split("T")[1] || ""}` : "")
                    }
                    className="pl-8 pr-1 text-xs h-9 min-w-0"
                  />
                </div>
                <div className="relative min-w-0">
                  <Clock className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <Input
                    type="time"
                    value={fechaEntrada.split("T")[1] || ""}
                    onChange={(e) =>
                      setFechaEntrada(
                        fechaEntrada.split("T")[0] ? `${fechaEntrada.split("T")[0]}T${e.target.value}` : `T${e.target.value}`
                      )
                    }
                    className="pl-8 pr-1 text-xs h-9 min-w-0"
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <LogOut className="h-4 w-4" />
                Salida
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative min-w-0">
                  <Calendar className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={fechaSalida.split("T")[0] || ""}
                    onChange={(e) =>
                      setFechaSalida(e.target.value ? `${e.target.value}T${fechaSalida.split("T")[1] || ""}` : "")
                    }
                    className="pl-8 pr-1 text-xs h-9 min-w-0"
                  />
                </div>
                <div className="relative min-w-0">
                  <Clock className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <Input
                    type="time"
                    value={fechaSalida.split("T")[1] || ""}
                    onChange={(e) =>
                      setFechaSalida(
                        fechaSalida.split("T")[0] ? `${fechaSalida.split("T")[0]}T${e.target.value}` : `T${e.target.value}`
                      )
                    }
                    className="pl-8 pr-1 text-xs h-9 min-w-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validación visual de fechas */}
          {fechaEntrada && fechaSalida && new Date(fechaEntrada) > new Date(fechaSalida) && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">
                ⚠️ La fecha de entrada no puede ser mayor que la fecha de salida
              </p>
            </div>
          )}
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
