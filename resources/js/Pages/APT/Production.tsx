import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Factory,
    Truck,
    Package,
    Wrench,
    Box,
    Shield,
    Users,
    AlertCircle,
} from "lucide-react";

export default function Production({ auth }: { auth: any }) {
    const submodules = [
        {
            id: 1,
            name: "Gestión de la producción",
            icon: Factory,
            href: route("apt.status"),
            description: "Control y seguimiento de la producción.",
            color: "bg-green-50 text-green-600",
            hover: "hover:border-green-500",
        },
        {
            id: 2,
            name: "Gestión de proceso de embarques",
            icon: Truck,
            href: route("apt.oe-tracker", { module: "apt" }),
            description: "Administración de procesos de embarque.",
            color: "bg-blue-50 text-blue-600",
            hover: "hover:border-blue-500",
        },
        {
            id: 3,
            name: "Gestión de inventarios",
            icon: Package,
            href: route("apt.lots.index"),
            description: "Control de inventarios y existencias.",
            color: "bg-purple-50 text-purple-600",
            hover: "hover:border-purple-500",
        },
        {
            id: 4,
            name: "Gestión de maquinarias",
            icon: Wrench,
            href: route("apt.status"),
            description: "Mantenimiento y control de equipos.",
            color: "bg-orange-50 text-orange-600",
            hover: "hover:border-orange-500",
        },
        {
            id: 5,
            name: "Gestión de equipos envasado",
            icon: Box,
            href: route("apt.unit-status"),
            description: "Administración de equipos de envasado.",
            color: "bg-yellow-50 text-yellow-600",
            hover: "hover:border-yellow-500",
        },
        {
            id: 6,
            name: "Gestión de equipos de seguridad",
            icon: Shield,
            href: route("apt.scanner"),
            description: "Control de equipos de seguridad.",
            color: "bg-red-50 text-red-600",
            hover: "hover:border-red-500",
        },
        {
            id: 7,
            name: "Gestión prestadores de servicios",
            icon: Users,
            href: route("apt.status"),
            description: "Administración de prestadores.",
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-500",
        },
        {
            id: 8,
            name: "Gestión de requerimientos",
            icon: AlertCircle,
            href: route("apt.status"),
            description: "Control de requerimientos y solicitudes.",
            color: "bg-cyan-50 text-cyan-600",
            hover: "hover:border-cyan-500",
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Gestión de la Producción">
            <Head title="Gestión de la Producción" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submódulos</h2>
                        <p className="text-gray-600">Selecciona un submódulo para continuar</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submodules.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`group bg-white rounded-lg shadow-md border-2 border-transparent p-6 flex flex-col items-start justify-start transition-all duration-300 hover:shadow-xl ${item.hover}`}
                            >
                                <div className="flex items-center gap-4 w-full mb-4">
                                    <div
                                        className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}
                                    >
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold mr-2">
                                            {item.id}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    {item.name}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {item.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
