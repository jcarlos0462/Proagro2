import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { useState, useEffect, useRef, Fragment } from "react";
import {
    ArrowLeft,
    Camera,
    Check,
    CheckCircle2,
    ChevronsUpDown,
    Clock,
    FileText,
    MoreHorizontal,
    Package,
    Printer,
    QrCode,
    Search,
    Settings,
    Trash2,
    Truck,
    User,
    UserRound,
    Warehouse,
    X,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { Dialog, Menu, Transition } from "@headlessui/react";
import LoadingAssistantDropdown from "@/Components/LoadingAssistantDropdown";
import QrScannerModal from "@/Components/QrScannerModal";

interface Lot {
    id: number;
    folio: string;
    plant_origin?: string;
    warehouse?: string;
}

interface Assistant {
    id: number;
    name: string;
}

interface HistoryItem {
    id: string;
    lot_id: number | null;
    folio: string;
    operator: string;
    squad_leader: string;
    product: string;
    plates: string;
    started_at: string | null;
    finished_at: string | null;
    status: string;
}

interface Props {
    auth: any;
    lots: Lot[];
    squad_leaders: string[];
    assistants: Assistant[];
    initial_history: HistoryItem[];
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h > 0 ? String(h).padStart(2, "0") : null,
        String(m).padStart(2, "0"),
        String(s).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");
}

function formatDateTime(isoString: string | null): string {
    if (!isoString) return "Pendiente";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "p.m." : "a.m.";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

function LiveStopwatch({ startedAt, finishedAt, status }: { startedAt: string | null; finishedAt: string | null; status: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startedAt) {
            setElapsed(0);
            return;
        }

        const startMs = new Date(startedAt).getTime();

        if (status === "loading" || !finishedAt) {
            const tick = () => {
                const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
                setElapsed(diff);
            };
            tick();
            const timer = setInterval(tick, 1000);
            return () => clearInterval(timer);
        } else {
            const endMs = new Date(finishedAt).getTime();
            const diff = Math.max(0, Math.floor((endMs - startMs) / 1000));
            setElapsed(diff);
        }
    }, [startedAt, finishedAt, status]);

    return (
        <span className="font-mono font-bold text-xs text-indigo-900 tracking-wider">
            {formatDuration(elapsed)}
        </span>
    );
}

export default function ShipmentProcess({
    auth,
    lots = [],
    squad_leaders = [],
    assistants = [],
    initial_history = [],
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [history, setHistory] = useState<HistoryItem[]>(initial_history);
    const [searchQr, setSearchQr] = useState("");
    const [isSearchingQr, setIsSearchingQr] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [scannedOrder, setScannedOrder] = useState<any>(null);

    // Form fields
    const [warehouse, setWarehouse] = useState("Almacen 1");
    const [selectedLotId, setSelectedLotId] = useState<string>(lots[0]?.id?.toString() || "");
    const [squadLeader, setSquadLeader] = useState<string>(squad_leaders[0] || "");
    const [loadingAssistant, setLoadingAssistant] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Success Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Table search filter
    const [historySearch, setHistorySearch] = useState("");

    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentStep === 1) {
            setTimeout(() => {
                qrInputRef.current?.focus();
            }, 100);
        }
    }, [currentStep]);

    const refreshHistory = async () => {
        try {
            const response = await axios.get(route("documentation.shipment-orders.loading-history"));
            if (Array.isArray(response.data)) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error("Error refreshing loading history:", error);
        }
    };

    const handleSearchOrder = async (query?: string) => {
        const q = (query !== undefined ? query : searchQr).trim();
        if (!q) {
            Swal.fire({
                icon: "warning",
                title: "Folio o QR Requerido",
                text: "Por favor escanee un código QR o escriba el folio de la orden.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        setIsSearchingQr(true);
        try {
            const response = await axios.get(route("documentation.shipment-orders.search-qr"), {
                params: { qr: q },
            });

            if (response.data?.order) {
                const order = response.data.order;
                setScannedOrder(order);
                setSearchQr(order.folio || q);
                if (order.warehouse) {
                    setWarehouse(order.warehouse);
                }
                setCurrentStep(2);
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Orden no encontrada",
                    text: `No se encontró la orden con el código o folio: ${q}`,
                    confirmButtonColor: "#4f46e5",
                });
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || "Orden de embarque no encontrada o no válida.";
            Swal.fire({
                icon: error.response?.data?.blocked ? "info" : "warning",
                title: error.response?.data?.blocked ? "Pase a báscula" : "Atención",
                text: msg,
                confirmButtonColor: "#4f46e5",
            });
            setScannedOrder(null);
        } finally {
            setIsSearchingQr(false);
        }
    };

    const handleResetToStep1 = () => {
        setScannedOrder(null);
        setSearchQr("");
        setCurrentStep(1);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!scannedOrder?.id) {
            Swal.fire({
                icon: "info",
                title: "Orden Requerida",
                text: "Por favor escanea o ingresa el folio de la Orden de Embarque a cargar.",
                confirmButtonColor: "#4f46e5",
            });
            setCurrentStep(1);
            return;
        }

        if (!selectedLotId) {
            Swal.fire({
                icon: "warning",
                title: "Lote requerido",
                text: "Por favor selecciona el lote que cargará.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        setIsSaving(true);

        try {
            await axios.post(route("documentation.shipment-orders.save-loading"), {
                shipment_order_id: scannedOrder.id,
                lot_id: selectedLotId,
                warehouse: warehouse || "Almacen 1",
                squad_leader: squadLeader || null,
                loading_assistant: loadingAssistant || null,
            });

            // Show custom success modal matching Image 3
            setShowSuccessModal(true);

            // Refresh list & reset to step 1
            setScannedOrder(null);
            setSearchQr("");
            setCurrentStep(1);
            await refreshHistory();
        } catch (error: any) {
            const msg =
                error.response?.data?.message ||
                error.response?.data?.errors?.squad_leader?.[0] ||
                "Error al guardar el embarque.";
            Swal.fire({
                icon: msg.includes("debe pasar a Bascula") ? "info" : "error",
                title: msg.includes("debe pasar a Bascula") ? "Pase a báscula" : "Error al guardar",
                text: msg,
                confirmButtonColor: "#4f46e5",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = async (id: string, folio: string) => {
        try {
            await axios.patch(route("documentation.shipment-orders.finish-loading", id));
            await refreshHistory();
            Swal.fire({
                icon: "success",
                title: "Orden Finalizada",
                text: `La orden ${folio} ha sido finalizada correctamente.`,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "No se pudo finalizar la orden.",
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    const handleDelete = async (id: string, folio: string) => {
        const result = await Swal.fire({
            title: "¿Eliminar del historial?",
            text: `¿Estás seguro de eliminar la orden ${folio} del historial de carga?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#991b1b",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route("documentation.shipment-orders.delete-loading", id));
                await refreshHistory();
                Swal.fire({
                    icon: "success",
                    title: "Eliminado",
                    text: "El registro ha sido eliminado del historial.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error: any) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.response?.data?.message || "No se pudo eliminar el registro.",
                    confirmButtonColor: "#4f46e5",
                });
            }
        }
    };

    const filteredHistory = history.filter((item) => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
            item.folio.toLowerCase().includes(q) ||
            item.operator.toLowerCase().includes(q) ||
            item.squad_leader.toLowerCase().includes(q) ||
            item.product.toLowerCase().includes(q) ||
            item.plates.toLowerCase().includes(q)
        );
    });

    const warehouseOptions = [
        "Almacen 1",
        "Almacen 2",
        "Almacen 3",
        "Almacen 4",
        "Almacen 5",
        "Almacen 6",
        "Almacen 7",
        "Almacen 8",
    ];

    const currentUserName = auth?.user?.name || auth?.user?.username || "admin";

    return (
        <DashboardLayout user={auth.user} header="Gestión de proceso de embarques">
            <Head title="Gestión de proceso de embarques" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link & Header */}
                <div className="mb-6">
                    <Link
                        href={route("apt.production")}
                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-semibold mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5 text-gray-500" />
                        Volver a Gestión de almacenes
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Gestión de proceso de embarques
                            </h2>
                            <p className="text-sm text-gray-500">
                                Registro, control y seguimiento de órdenes de embarque en tiempo real.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {/* Step 1 Indicator */}
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className={`flex items-center gap-3 text-left transition-all ${
                                currentStep === 1
                                    ? "opacity-100"
                                    : "opacity-75 hover:opacity-100 cursor-pointer"
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                                    currentStep === 1
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50"
                                        : scannedOrder
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {scannedOrder && currentStep === 2 ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    "1"
                                )}
                            </div>
                            <div>
                                <span className="block text-xs uppercase font-bold text-gray-400">
                                    Paso 1
                                </span>
                                <span
                                    className={`text-sm font-bold ${
                                        currentStep === 1 ? "text-indigo-950" : "text-gray-700"
                                    }`}
                                >
                                    Escanear QR / Folio
                                </span>
                            </div>
                        </button>

                        {/* Step Divider */}
                        <div className="flex-1 mx-4 sm:mx-8 h-0.5 bg-gray-200 relative">
                            <div
                                className={`absolute inset-0 bg-indigo-600 transition-all duration-300 ${
                                    currentStep === 2 ? "w-full" : "w-0"
                                }`}
                            />
                        </div>

                        {/* Step 2 Indicator */}
                        <div
                            className={`flex items-center gap-3 text-left transition-all ${
                                currentStep === 2 ? "opacity-100" : "opacity-50"
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                                    currentStep === 2
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50"
                                        : "bg-gray-100 text-gray-400"
                                }`}
                            >
                                2
                            </div>
                            <div>
                                <span className="block text-xs uppercase font-bold text-gray-400">
                                    Paso 2
                                </span>
                                <span
                                    className={`text-sm font-bold ${
                                        currentStep === 2 ? "text-indigo-950" : "text-gray-500"
                                    }`}
                                >
                                    Asignación y Carga
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8 mb-8">
                    {/* STEP 1: SCAN QR / ENTER FOLIO */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <div className="text-center max-w-xl mx-auto mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
                                    <QrCode className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900">
                                    Escanear Código QR de Orden de Embarque
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Utilice el lector óptico, la cámara del dispositivo o escriba el folio para comenzar el proceso de carga.
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <QrCode className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <input
                                            ref={qrInputRef}
                                            type="text"
                                            value={searchQr}
                                            onChange={(e) => setSearchQr(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
                                            placeholder="Ej: PA2026-0005 o escanear código..."
                                            className="block w-full pl-12 pr-10 py-3.5 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold text-gray-900 uppercase placeholder-gray-400 text-base"
                                        />
                                        {searchQr && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQr("");
                                                    setScannedOrder(null);
                                                }}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraOpen(true)}
                                        className="inline-flex items-center justify-center px-5 py-3.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl shadow-sm text-sm font-bold transition gap-2"
                                        title="Escanear con cámara"
                                    >
                                        <Camera className="w-5 h-5 text-indigo-600" />
                                        <span>Cámara</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSearchOrder()}
                                        disabled={isSearchingQr || !searchQr.trim()}
                                        className="inline-flex items-center justify-center px-7 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50 gap-2"
                                    >
                                        <Search className="w-4 h-4" />
                                        {isSearchingQr ? "Buscando..." : "Siguiente"}
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Lector óptico listo para captura automática al presionar Enter</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ORDER DETAILS & ASSIGNMENT FORM */}
                    {currentStep === 2 && scannedOrder && (
                        <div className="animate-fade-in">
                            {/* Identified Order Header Badge */}
                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm font-bold">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl font-extrabold text-indigo-950">
                                                {scannedOrder.folio}
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                Orden Identificada
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1 font-medium">
                                            <span>
                                                <strong className="text-gray-900">Operador:</strong> {scannedOrder.operator_name || "N/A"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong className="text-gray-900">Placas:</strong> {scannedOrder.tractor_plate || "N/A"}{" "}
                                                {scannedOrder.trailer_plate ? `/ ${scannedOrder.trailer_plate}` : ""}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong className="text-gray-900">Producto:</strong> {scannedOrder.product || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetToStep1}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Cambiar Orden
                                </button>
                            </div>

                            {/* Main Form Fields */}
                            <form onSubmit={handleSave}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Número de almacén */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Número de almacén
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={warehouse}
                                                onChange={(e) => setWarehouse(e.target.value)}
                                                list="warehouses-list"
                                                placeholder="Almacen 1"
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            <datalist id="warehouses-list">
                                                {warehouseOptions.map((w) => (
                                                    <option key={w} value={w} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Lote que cargará */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Lote que cargará
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedLotId}
                                                onChange={(e) => {
                                                    const lotId = e.target.value;
                                                    setSelectedLotId(lotId);
                                                    const lot = lots.find((l) => l.id.toString() === lotId);
                                                    if (lot?.warehouse) {
                                                        setWarehouse(lot.warehouse);
                                                    }
                                                }}
                                                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Seleccione un lote...</option>
                                                {lots.map((lot) => (
                                                    <option key={lot.id} value={lot.id}>
                                                        {lot.folio}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                                                <ChevronsUpDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Encargado de Cuadrilla */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Encargado de Cuadrilla
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={squadLeader}
                                                onChange={(e) => setSquadLeader(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Seleccione encargado de cuadrilla...</option>
                                                {squad_leaders.map((leader) => (
                                                    <option key={leader} value={leader}>
                                                        {leader}
                                                    </option>
                                                ))}
                                                {!squad_leaders.includes("PABLO FRANCISCO VIVAS TORRES") && (
                                                    <option value="PABLO FRANCISCO VIVAS TORRES">
                                                        PABLO FRANCISCO VIVAS TORRES
                                                    </option>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                                                <ChevronsUpDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auxiliar de Carga */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Auxiliar de Carga
                                        </label>
                                        <LoadingAssistantDropdown
                                            value={loadingAssistant}
                                            initialAssistants={assistants}
                                            onChange={(name) => setLoadingAssistant(name)}
                                        />
                                    </div>

                                    {/* Encargado de Almacén / Turno */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Encargado de Almacén
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={currentUserName}
                                            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 font-medium shadow-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Submit & Back Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetToStep1}
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center justify-center px-8 py-3 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        {isSaving ? "Guardando..." : "Guardar Embarque"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Table Section: HISTORIAL DE ÓRDENES DE EMBARQUE */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full">
                    <div className="p-5 md:p-6 bg-white border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-extrabold text-indigo-950 uppercase tracking-wide">
                                Historial de Órdenes de Embarque
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Consulta de órdenes en proceso de carga y finalizadas.
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                placeholder="Filtrar folio, operador..."
                                className="block w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
                            <thead className="bg-[#1e1b4b] text-white">
                                <tr>
                                    <th className="w-[3%] px-1.5 py-3.5 text-center font-bold uppercase tracking-wider">
                                        <Settings className="w-4 h-4 mx-auto text-indigo-300 opacity-60" />
                                    </th>
                                    <th className="w-[11%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        FOLIO
                                    </th>
                                    <th className="w-[15%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        OPERADOR
                                    </th>
                                    <th className="w-[14%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        LÍDER DE CUADRILLA
                                    </th>
                                    <th className="w-[14%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        PRODUCTO
                                    </th>
                                    <th className="w-[9%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        PLACAS
                                    </th>
                                    <th className="w-[10%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        HORA INICIAL
                                    </th>
                                    <th className="w-[8%] px-2 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        HORA FINAL
                                    </th>
                                    <th className="w-[7%] px-2 py-3.5 text-center font-bold uppercase tracking-wider truncate">
                                        CRONÓMETRO
                                    </th>
                                    <th className="w-[9%] px-2 py-3.5 text-center font-bold uppercase tracking-wider truncate">
                                        ACCIÓN
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-indigo-50/50 transition-colors duration-150"
                                        >
                                            {/* Gear Menu */}
                                            <td className="w-[3%] px-1.5 py-2.5 text-center">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <Menu.Button className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Menu.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-100"
                                                        enterFrom="transform opacity-0 scale-95"
                                                        enterTo="transform opacity-100 scale-100"
                                                        leave="transition ease-in duration-75"
                                                        leaveFrom="transform opacity-100 scale-100"
                                                        leaveTo="transform opacity-0 scale-95"
                                                    >
                                                        <Menu.Items className="absolute left-0 z-50 mt-1 w-40 origin-top-left rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none text-xs">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <a
                                                                        href={route("documentation.print-order", row.id)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold ${
                                                                            active ? "bg-indigo-600 text-white" : "text-gray-700"
                                                                        }`}
                                                                    >
                                                                        <Printer className="w-3.5 h-3.5" />
                                                                        Imprimir OE
                                                                    </a>
                                                                )}
                                                            </Menu.Item>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </td>

                                            {/* Folio */}
                                            <td className="w-[11%] px-2 py-2.5 font-bold text-indigo-700 uppercase truncate text-left">
                                                <a
                                                    href={route("documentation.print-order", row.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                    title="Ver / Imprimir orden"
                                                >
                                                    {row.folio}
                                                </a>
                                            </td>

                                            {/* Operador */}
                                            <td className="w-[15%] px-2 py-2.5 font-semibold text-gray-800 uppercase truncate text-left" title={row.operator}>
                                                {row.operator}
                                            </td>

                                            {/* Líder de Cuadrilla */}
                                            <td className="w-[14%] px-2 py-2.5 text-gray-700 uppercase truncate text-left" title={row.squad_leader}>
                                                {row.squad_leader}
                                            </td>

                                            {/* Producto */}
                                            <td className="w-[14%] px-2 py-2.5 text-gray-700 uppercase truncate text-left" title={row.product}>
                                                {row.product}
                                            </td>

                                            {/* Placas */}
                                            <td className="w-[9%] px-2 py-2.5 font-mono text-gray-600 uppercase text-[11px] truncate text-left" title={row.plates}>
                                                {row.plates}
                                            </td>

                                            {/* Hora Inicial */}
                                            <td className="w-[10%] px-2 py-2.5 text-gray-700 text-[11px] leading-tight text-left" title={formatDateTime(row.started_at)}>
                                                {formatDateTime(row.started_at)}
                                            </td>

                                            {/* Hora Final */}
                                            <td className="w-[8%] px-2 py-2.5 text-[11px] leading-tight text-left" title={row.finished_at ? formatDateTime(row.finished_at) : "Pendiente"}>
                                                {row.finished_at ? (
                                                    <span className="text-gray-700 font-medium">
                                                        {formatDateTime(row.finished_at)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic font-semibold">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {/* Cronómetro */}
                                            <td className="w-[7%] px-2 py-2.5 text-center">
                                                <LiveStopwatch
                                                    startedAt={row.started_at}
                                                    finishedAt={row.finished_at}
                                                    status={row.status}
                                                />
                                            </td>

                                            {/* Acción */}
                                            <td className="w-[9%] px-2 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                                    {row.status === "loading" && !row.finished_at && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFinish(row.id, row.folio)}
                                                            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-2 py-1 rounded-md text-[11px] transition shadow-sm whitespace-nowrap"
                                                        >
                                                            Finalizar
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(row.id, row.folio)}
                                                        className="bg-red-800 hover:bg-red-900 text-white font-bold px-2 py-1 rounded-md text-[11px] transition shadow-sm whitespace-nowrap"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                                            <Package className="mx-auto h-10 w-10 mb-2 opacity-40" />
                                            <p className="text-sm font-medium">No hay registros en el historial de carga</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Qr Scanner Modal for Camera Scanning */}
            <QrScannerModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onScan={(code) => {
                    if (code) {
                        setIsCameraOpen(false);
                        setSearchQr(code);
                        handleSearchOrder(code);
                    }
                }}
                title="Escanear Código QR de OE"
            />

            {/* Modal "Embarque guardado" (Pixel-perfect matching Image 3) */}
            <Transition.Root show={showSuccessModal} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setShowSuccessModal(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-8 pb-8 pt-10 text-center shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                                    {/* Circular Checkmark Badge */}
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-200 bg-green-50/50">
                                        <Check className="h-12 w-12 text-green-500 stroke-[3]" />
                                    </div>

                                    {/* Modal Text */}
                                    <div className="mt-6">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-2xl font-bold leading-6 text-gray-800"
                                        >
                                            Embarque guardado
                                        </Dialog.Title>
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-500">
                                                El embarque se guardó correctamente.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-8">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 focus:outline-none transition duration-150"
                                            onClick={() => setShowSuccessModal(false)}
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </DashboardLayout>
    );
}
