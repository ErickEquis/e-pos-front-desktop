import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eposApi } from "@/api/e-posApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    Download,
    ChevronRight,
    FileSearch,
    Filter,
    Search,
    ShieldAlert,
    MonitorCheck,
    History,
    RotateCcw,
    Calendar,
    ExternalLink,
    Terminal,
    User,
    Clock,
    Activity,
    Code2,
    Database,
    Fingerprint
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface SystemLog {
    id: string;
    level: "info" | "warn" | "error" | "debug";
    account_id: string | null;
    message: string;
    user_id: string | null;
    usuario_nombre?: string;
    usuario_correo?: string;
    endpoint: string | null;
    method: string | null;
    request_payload: any;
    request_params: any;
    meta: any;
    timestamp: string;
    fecha_formateada?: string;
}

interface Usuario {
    id: string;
    nombre: string;
    correo: string;
}

export default function Logs() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [level, setLevel] = useState<string>("all");
    const [endpointSearch, setEndpointSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

    // Fetching users for the dropdown (Global for Root)
    const { data: fetchUsuarios, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["allUsersList"],
        queryFn: async () => {
            const response = await eposApi.get("/usuarios");
            return response.data || [];
        },
    });

    // Fetching logs
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["systemLogs", { page, limit, level, endpointSearch, selectedUserId, startDate, endDate }],
        queryFn: async () => {
            const params: any = { page, limit };
            if (level !== "all") params.level = level;
            if (selectedUserId !== "all") params.user_id = selectedUserId;
            if (endpointSearch) params.endpoint_search = endpointSearch;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await eposApi.get("/logs", { params });
            return response.data;
        },
    });

    const handleExport = async () => {
        try {
            const params: any = { limit: 10000 }; // Fetch a large amount for export
            if (level !== "all") params.level = level;
            if (selectedUserId !== "all") params.user_id = selectedUserId;
            if (endpointSearch) params.endpoint_search = endpointSearch;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await eposApi.get("/logs", { params });
            const logsToExport = response.data?.data || [];

            if (logsToExport.length === 0) {
                alert("No hay logs para exportar con los filtros actuales.");
                return;
            }

            // CSV Headers
            const headers = ["ID", "Nivel", "Mensaje", "Usuario", "Email", "Endpoint", "Metodo", "Fecha"];

            // Convert to CSV rows
            const csvRows = logsToExport.map((log: SystemLog) => [
                log.id,
                log.level.toUpperCase(),
                `"${(log.message || "").replace(/"/g, '""')}"`, // Escape quotes
                `"${(log.usuario_nombre || "Sistema").replace(/"/g, '""')}"`,
                log.usuario_correo || "N/A",
                log.endpoint || "-",
                log.method || "-",
                log.fecha_formateada || log.timestamp
            ].join(","));

            const csvContent = [headers.join(","), ...csvRows].join("\n");

            // Create Blob and Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

            link.setAttribute("href", url);
            link.setAttribute("download", `auditoria-logs-${timestamp}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar logs:", error);
            alert("No se pudo generar la exportación. Intente de nuevo.");
        }
    };

    const getLevelBadgeStyles = (lvl: string) => {
        switch (lvl) {
            case "error":
                return "bg-rose-100 text-rose-700 border-rose-200";
            case "warn":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "info":
                return "bg-sky-100 text-sky-700 border-sky-200";
            case "debug":
                return "bg-indigo-100 text-indigo-700 border-indigo-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const renderJsonBlock = (jsonValue: any) => {
        if (!jsonValue || Object.keys(jsonValue).length === 0) return <div className="text-muted-foreground italic text-xs py-4 text-center border-dashed border-2 rounded-lg">Sin datos registrados</div>;
        return (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-hidden shadow-inner">
                <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(jsonValue, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Auditoría del Sistema</h1>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 transition-colors uppercase text-[10px] font-bold px-2 py-0.5">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            Root Access
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">Trazabilidad completa de operaciones y eventos de seguridad.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="shadow-sm">
                        <Activity className="w-4 h-4 mr-2" />
                        Refrescar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} className="shadow-sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="border-border shadow-sm bg-card/60 backdrop-blur-sm">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col gap-6">
                        {/* Top Row: Dropdowns and Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                                <label className="flex items-center gap-2 px-1">
                                    <Filter className="w-3.5 h-3.5" />
                                    Filtrar por Nivel
                                </label>
                                <Select value={level} onValueChange={(val) => { setLevel(val); setPage(1); }}>
                                    <SelectTrigger className="h-10 bg-background/50 border-border">
                                        <SelectValue placeholder="Nivel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los registros</SelectItem>
                                        <SelectItem value="error">Críticos (Error)</SelectItem>
                                        <SelectItem value="warn">Avisos (Warn)</SelectItem>
                                        <SelectItem value="info">Información (Info)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                                <label className="flex items-center gap-2 px-1">
                                    <User className="w-3.5 h-3.5" />
                                    Usuario Actor
                                </label>
                                <Select value={selectedUserId} onValueChange={(val) => { setSelectedUserId(val); setPage(1); }}>
                                    <SelectTrigger className="h-10 bg-background/50 border-border">
                                        <SelectValue placeholder={isLoadingUsers ? "Cargando..." : "Todos"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los usuarios</SelectItem>
                                        {fetchUsuarios?.map((usr: Usuario) => (
                                            <SelectItem key={usr.id} value={usr.id}>
                                                {usr.nombre} ({usr.correo.split('@')[0]}@...)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                                <label className="flex items-center gap-2 px-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Rango Desde
                                </label>
                                <Input
                                    type="date"
                                    className="h-10 bg-background/50 border-border"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                />
                            </div>

                            <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                                <label className="flex items-center gap-2 px-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Rango Hasta
                                </label>
                                <Input
                                    type="date"
                                    className="h-10 bg-background/50 border-border"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Bottom Row: Search and Clear */}
                        <div className="flex flex-col lg:flex-row items-end gap-4 w-full border-t pt-4">
                            <div className="space-y-2 text-[13px] font-medium text-muted-foreground flex-1 w-full">
                                <label className="flex items-center gap-2 px-1">
                                    <MonitorCheck className="w-3.5 h-3.5" />
                                    Ruta del Recurso (Endpoint)
                                </label>
                                <div className="relative group">
                                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Ej: /api/ventas, /api/auth/login..."
                                        className="pl-9 h-10 bg-background/50 border-border w-full focus-visible:ring-1 focus-visible:ring-primary/30"
                                        value={endpointSearch}
                                        onChange={(e) => { setEndpointSearch(e.target.value); setPage(1); }}
                                    />
                                    {endpointSearch && (
                                        <button
                                            className="absolute right-3 top-3 text-[11px] text-muted-foreground hover:text-primary"
                                            onClick={() => { setEndpointSearch(""); setPage(1); }}
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setLevel("all");
                                    setSelectedUserId("all");
                                    setEndpointSearch("");
                                    setStartDate("");
                                    setEndDate("");
                                    setPage(1);
                                }}
                                className="h-10 px-6 font-semibold border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restablecer Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Area */}
            <Card className="border-border shadow-md overflow-hidden bg-card">
                <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
                    <Table>
                        <TableHeader className="bg-muted/40 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[80px]">Status</TableHead>
                                <TableHead className="w-[220px]">Responsable</TableHead>
                                <TableHead className="">Operación & Ruta</TableHead>
                                <TableHead className="w-[180px] text-right">Tiempo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 12 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : data?.data?.length > 0 ? (
                                data.data.map((log: SystemLog) => (
                                    <RecordRow
                                        key={log.id}
                                        log={log}
                                        onSelect={() => setSelectedLog(log)}
                                        getStyles={getLevelBadgeStyles}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                <FileSearch className="w-6 h-6 text-muted-foreground/50" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg text-foreground">No se hallaron coincidencias</p>
                                                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                                    Tu búsqueda con los criterios actuales no arrojó ningún resultado en el historial.
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                {/* Pagination */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Mostrando <span className="font-semibold text-foreground">{data.data.length}</span> de <span className="font-semibold text-foreground">{data.pagination.totalRecords}</span> eventos
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                <span className="sr-only">Anterior</span>
                            </Button>
                            <div className="px-3 py-1 bg-background rounded border border-border text-[11px] font-bold text-foreground">
                                {page} / {data.pagination.totalPages}
                            </div>
                            <Button variant="ghost" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                                <ChevronRight className="w-4 h-4" />
                                <span className="sr-only">Siguiente</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Log Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                    {selectedLog && (
                        <>
                            <DialogHeader className="p-6 pb-0 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className={`${getLevelBadgeStyles(selectedLog.level)} uppercase text-[10px] font-bold mb-2`}>
                                            {selectedLog.level}
                                        </Badge>
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                            Detalle de Actividad
                                        </DialogTitle>
                                        <DialogDescription className="font-mono text-[13px] text-primary flex items-center gap-2 mt-1">
                                            <Terminal className="w-3 h-3" />
                                            {selectedLog.method} {selectedLog.endpoint}
                                        </DialogDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[14px] font-bold text-foreground tabular-nums">
                                            {selectedLog.fecha_formateada?.split(', ')[1]}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground uppercase font-medium">
                                            {selectedLog.fecha_formateada?.split(', ')[0]}
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-6 pt-2">
                                <div className="space-y-6">
                                    {/* Action Header */}
                                    <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                                        <p className="text-sm font-semibold text-foreground leading-relaxed">
                                            {selectedLog.message}
                                        </p>
                                    </div>

                                    {/* Actor Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-border">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Actor</span>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-semibold text-foreground">{selectedLog.usuario_nombre}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-border">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Correo</span>
                                            <span className="text-sm font-mono text-foreground">{selectedLog.usuario_correo !== 'N/A' ? selectedLog.usuario_correo : "-"}</span>
                                        </div>
                                    </div>

                                    {/* Technical Details */}
                                    <div className="space-y-6 pt-2">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                                <Code2 className="w-3.5 h-3.5 text-blue-500" />
                                                Cuerpo de la Petición (Request Payload)
                                            </div>
                                            {renderJsonBlock(selectedLog.request_payload)}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                                <Database className="w-3.5 h-3.5 text-indigo-500" />
                                                Metadata de Ejecución
                                            </div>
                                            {renderJsonBlock(selectedLog.meta)}
                                        </div>

                                        {selectedLog.request_params && Object.keys(selectedLog.request_params).length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                                    <Filter className="w-3.5 h-3.5 text-amber-500" />
                                                    Query Params
                                                </div>
                                                {renderJsonBlock(selectedLog.request_params)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                            <Fingerprint className="w-3 h-3" />
                                            ID de Auditoría: {selectedLog.id}
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => {
                                            navigator.clipboard.writeText(selectedLog.id);
                                        }}>
                                            Copiar ID
                                        </Button>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)} className="font-semibold">
                                    Cerrar Vista
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function RecordRow({ log, onSelect, getStyles }: { log: SystemLog, onSelect: () => void, getStyles: any }) {
    return (
        <TableRow
            onClick={onSelect}
            className="cursor-pointer transition-colors group hover:bg-primary/[0.03] border-b border-border/50"
        >
            <TableCell>
                <Badge variant="outline" className={`${getStyles(log.level)} uppercase text-[9px] font-extrabold px-1.5 py-0 border-none shadow-none`}>
                    {log.level}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                    <span className="font-bold text-[13px] text-foreground truncate max-w-[180px]" title={log.usuario_nombre}>
                        {log.usuario_nombre}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px] font-medium">
                        {log.usuario_correo !== 'N/A' ? log.usuario_correo : "-"}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1.5">
                    <p className="text-[13px] font-medium leading-none text-foreground/90 line-clamp-1 group-hover:text-primary transition-colors">
                        {log.message}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-1 rounded-sm">
                            {log.method}
                        </span>
                        <code className="text-[11px] text-primary/80 font-mono truncate max-w-[300px]">
                            {log.endpoint}
                        </code>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex flex-col items-end">
                    <div className="text-[13px] tabular-nums font-bold text-foreground">
                        {log.fecha_formateada?.split(', ')[1]}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        {log.fecha_formateada?.split(', ')[0]}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-primary" />
                </div>
            </TableCell>
        </TableRow>
    );
}
