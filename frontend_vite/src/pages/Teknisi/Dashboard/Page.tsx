import { useQuery } from "@tanstack/react-query";
import { getManagedMesin, getManagedMesinLogs, getMyTask } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState } from "react";
import { Info, ToolCase } from "lucide-react";
import { LogRow, filterLogStyles, filterLogTypes } from '../../../components/ui/log/Log';
import { FilterDropdown } from "../../../components/ui/dropdown/Dropdown";
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { MesinInfoModal } from "./MesinInfo";

import "dayjs/locale/id"; 
import type { Mesin, SlotData, SlotRow } from "../../Dashboard/Mesin/Interface";
import { MesinMaintenanceModal } from "./Maintenance";

const filterPrioritasStyles = {
  low: { label: "Low", dot: "bg-lime-500" },
  medium: { label: "Medium", dot: "bg-yellow-500"},
  high: { label: "High", dot: "bg-orange-600"},
  urgent: { label: "Urgent", dot: "bg-red-500"},
  all: { label: "Semua Prioritas", dot: ""}
}
const filterPrioritasTypes = ["all", "low", "medium", "high", "urgent"];


export default function PageDashboardTeknisi(){
    dayjs.extend(utc);
    dayjs.extend(timezone);


    dayjs.locale('id');
    
    const { profile } = useAuth();

    const { data, isLoading, error } = useQuery({
        // Gunakan profile?.user_id langsung di queryKey
        queryKey: ['ManagedMesin', profile?.id],
        
        // Fungsi hanya akan dijalankan jika profile?.user_id ada
        queryFn: () => getManagedMesin(profile.id),
        
        // KUNCINYA DI SINI: Query tidak akan jalan selama user_id belum ada
        enabled: !!profile?.id, 
    });

    const [activeLogFilter, setActiveLogFilter] = useState("all");
    const [ prioritas, setPrioritas] = useState("all");    
    const { data: dataLogs, isLoading: loadingLogs, error: errorLogs } = useQuery({
        // Gunakan profile?.user_id langsung di queryKey
        queryKey: ['ManagedMesinLogs', profile?.id, activeLogFilter],
        
        // Fungsi hanya akan dijalankan jika profile?.user_id ada
        queryFn: () => getManagedMesinLogs(profile.id, activeLogFilter),
        
        // KUNCINYA DI SINI: Query tidak akan jalan selama user_id belum ada
        enabled: !!profile?.id, 
    });
    const { data: dataTask, isLoading: loadingTasks, error: errorTasks } = useQuery({
        // Gunakan profile?.user_id langsung di queryKey
        queryKey: ['MyTask', profile?.id, prioritas],
        
        // Fungsi hanya akan dijalankan jika profile?.user_id ada
        queryFn: () => getMyTask(profile.id, prioritas),
        
        // KUNCINYA DI SINI: Query tidak akan jalan selama user_id belum ada
        enabled: !!profile?.id, 
    });

    const minIoHost = import.meta.env.VITE_MINIO_HOST;
    const minIoPort = import.meta.env.VITE_MINIO_PORT;
    const [ isMesinInfoModalOpen, setIsMesinInfoModalOpen] = useState(false);    
    const [dataInfo, setDataInfo] = useState<Mesin | null>(null);
    const [ isMesinMaintenanceModalOpen, setIsMesinMaintenanceModalOpen] = useState(false);
    const [dataMesinMaintenance, setdataMesinMaintenance] = useState<Mesin | null>(null);
    const getStructuredSlot = (slots: SlotData[] = []) => {
        // 1. Grouping menggunakan reduce

        // console.log("slotsss",slots)
        const groupedByRow = slots.reduce((acc: SlotRow[], curr) => {
            const rowNum = curr.metadata.row_number;
            let row = acc.find((r) => r.row_number === rowNum);

            if (!row) {
                row = {
                    row_number: rowNum,
                    col: [],
                };
                acc.push(row);
            }

            row.col.push({
                kode: curr.kode,
                col_number: curr.metadata.col_number,
                span: curr.metadata.span,
                gabungan: curr.metadata.gabungan,
                stock: curr.stock || 0,
                ...(curr.produk && {
                    produk_id: curr.produk_id,
                    produk: curr.produk
                }),
                
            });

            return acc;
        }, []);

        // 2. Urutkan Baris dan Kolom SEKALI saja di akhir
        return groupedByRow
            .sort((a, b) => a.row_number - b.row_number) // Urutkan baris
            .map(row => ({
                ...row,
                col: row.col.sort((a, b) => a.col_number - b.col_number) // Urutkan kolom
            }));
    };

    useEffect(() => {
        console.log("datana",data)
    },[data])
    return ( 
        <div className="">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    { data?.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-400 text-sm">
                            Data tidak ditemukan
                        </div>
                    )}
                    {isLoading ? (
                        <>
                            <div className="bg-white dark:bg-slate-800 rounded-lg h-40 p-5 text-gray-300 flex flex-col gap-4">
                                    <div className="flex justify-between gap-4">
                                        <div className="w-full p-3 bg-gray-100 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                        <div className=" px-4 py-1 bg-gray-100 dark:bg-slate-700 animate-pulse rounded-full"></div>

                                    </div>
                                <div className="w-full p-2 bg-gray-100 dark:bg-slate-700 animate-pulse rounded"></div>
                                <div className="w-full p-2 bg-gray-100 dark:bg-slate-700 animate-pulse rounded"></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg h-40 p-5 text-gray-300 flex flex-col gap-4">
                                    <div className="flex justify-between gap-4">
                                        <div className="w-full p-3 bg-gray-100 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                                        <div className=" px-4 py-1 bg-gray-100 dark:bg-slate-700 animate-pulse rounded-full"></div>

                                    </div>
                                <div className="w-full p-2 bg-gray-100 dark:bg-slate-700 animate-pulse rounded"></div>
                                <div className="w-full p-2 bg-gray-100 dark:bg-slate-700 animate-pulse rounded"></div>
                            </div>
                        </>
                    ): (
                        data.map((row: any) => {
                            // console.log("real slot", row.slots);
                            const slot = getStructuredSlot(row?.slots || []);
                            const lokasiLengkap = [row.desa, row.kecamatan, row.kabupaten].filter(Boolean).join(', ')
                            return(
                            <div key={row.id} className="bg-white dark:bg-slate-800 rounded-lg h-fit p-5 text-slate-700 dark:text-gray-300 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-bold">{row.nama}</h2>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : row.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-400' } `}>
                                        {row.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">{lokasiLengkap}</p>
                                <div className="h-[150px] sm:h-[200px] overflow-y-auto mb-4 no-scrollbar">
                                    
                                    {slot.map((s) => (
                                        <div key={s.row_number} className="flex justify-between ">
                                            <div className="flex-1 w-full ">
                                                {s.col.map(c => {
                                                    const isMerged = c.span > 1;
                                                    const totalCols = s.col.length;
                                                    const widthPercent = (c.span / totalCols) * 100;
                                                   
                                                    
                                                    return (  
                                                        <div key={c.kode} className="mb-1" >

                                                            <label    style={{ width: `calc(${widthPercent}% - ${(8 * (totalCols - c.span)) / totalCols}px)` }}>   
                                                                <div
                                                                
                                                                    className={`
                                                                        flex gap-4 justify-between
                                                                        rounded-lg border-[1.5px] px-3 py-2
                                                                        transition-colors duration-100 select-none pr-3
                                                                        ${ c.produk && c.stock === 0 ? 'bg-red-100 dark:bg-red-950  border-red-300 dark:border-red-700 text-red-600 dark:text-red-500 ' :  c.produk &&  c.stock  && c.max_stock && c.stock / c.max_stock * 100  <= 50 ? 'bg-yellow-100 dark:bg-yellow-950  border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-500' : c.produk && c.stock && c.stock > 5 ? 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400' :
                                                                            "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 "
                                                                        }
                                                                        `}>
                                                                    {c.produk ? (
                                                                            <>
                                                                                
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="left-3 top-2 text-xs">{c.kode}</span>
                                                                                <img src={`http://${minIoHost}:${minIoPort}/${c?.produk.img_url}` } className="w-8 h-8 rounded-lg" alt="" />

                                                                                <div className="flex items-center">
                                                                                    <p className="text-xs dark:text-gray-300 p-auto">{c.produk?.nama}</p> 

                                                                                </div> 
                                                                            </div>
                                                                            
                                                                            <div className="  flex items-center gap-2">
                                                                                <span className="text-xs font-medium dark:text-gray-300 top-2 right-3"> {c.stock}</span>
                                                                                {isMerged ? (
                                                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 rounded-sm text-white dark:bg-emerald-700">
                                                                                        {c.span} kolom
                                                                                    </span>

                                                                                ) : null}
                                                                            </div>
                                                                            
                                                                            </>

                                                                        ) : (
                                                                            <>
                                                                                 <div className="flex items-center gap-2">                                                             
                                                                                    <span className=" text-xs font-medium">{c.kode}</span>
                                                                                    <p className=" m-auto text-xs text-center">null</p>
                                                                                 </div>
                                                                                
                                                                                {isMerged ? (
                                                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 rounded-sm text-white dark:bg-emerald-700">
                                                                                        {c.span} kolom
                                                                                    </span>

                                                                                ) : null}
                                                                            </>
                                                                        )}
                                                                   
                                                                </div>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    
                                <button 
                                
                                    disabled={row.status !== 'maintenance'} 
                                    onClick={() => {
                                        setIsMesinMaintenanceModalOpen(true);
                                        setdataMesinMaintenance(row);
                                    }}
                                    className="flex-1 flex items-center justify-center text-center py-2 px-4 
                                                enabled:bg-amber-500 enabled:dark:bg-amber-700 text-white dark:text-gray-300 
                                                font-medium rounded-lg transition-colors
                                                enabled:hover:bg-amber-600 enabled:dark:hover:bg-amber-800 
                                                disabled:bg-amber-700  dark:disabled:bg-amber-900  disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                    <ToolCase size={18}/>
                                    </button>
                                    <button onClick={() =>{
                                        setIsMesinInfoModalOpen(true);
                                        setDataInfo(row);
                                        }} className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-blue-500 dark:bg-blue-700 text-white dark:text-gray-300 font-medium hover:bg-blue-600 dark:hover:bg-blue-800 cursor-pointer transition-colors rounded-lg"><Info size={18}/></button>
                                </div>
                            </div>
    
                        )})
                    )}
                 
                </div>
                <div className="relative bg-white dark:bg-slate-950 rounded-xl text-slate-700 dark:text-gray-300 border-2 border-blue-100 dark:border-blue-900">
                    <div className="w-full p-4 bg-blue-50/50 dark:bg-slate-800 rounded-t-xl flex justify-between">
                        <h2 className="font-bold">Log Mesin</h2>
                          <FilterDropdown activeFilter={activeLogFilter} onChange={setActiveLogFilter}  style={filterLogStyles} filter={filterLogTypes}/>
                    </div>
                    <div className="h-[300px] sm:h-[400px] lg:h-[500px] overflow-y-auto no-scrollbar">
                        { loadingLogs ? (
                            <>
                                <div className="animate-pulse p-3">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                                <div className="animate-pulse p-3 w-3/4">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                                <div className="animate-pulse p-3 w-1/2">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                            </>
                        ) : (
                            dataLogs.slice(0, 10).map((lg: any) => (
        
                                    <LogRow key={lg.id} log={lg} />
                            ))
                        )}
                        { dataLogs?.length === 0 && !loadingLogs && (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-400 text-sm">
                                Data tidak ditemukan
                            </div>
                        )}
                          {errorLogs && (
                
                            <div className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                                Gagal Memuat Data: {(error as any).message}
                            </div>
                        )}
                    </div>
                 
                        
       
                </div>
                <div className="relative bg-white dark:bg-slate-950 rounded-xl text-slate-700 dark:text-gray-300 border-2 border-blue-100 dark:border-blue-900">
                    <div className="w-full p-4 bg-blue-50/50 dark:bg-slate-800 rounded-t-xl flex justify-between">
                        <h2 className="font-bold">Tugas</h2>
                          <FilterDropdown activeFilter={prioritas} onChange={setPrioritas}  style={filterPrioritasStyles} filter={filterPrioritasTypes}/>
                    </div>
                    <div className="h-[500px] overflow-y-auto no-scrollbar">
                        { loadingTasks ? (
                            <>
                                <div className="animate-pulse p-3">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                                <div className="animate-pulse p-3 w-3/4">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                                <div className="animate-pulse p-3 w-1/2">
                                    <div className='bg-slate-100 dark:bg-slate-700 p-2 rounded-full'>

                                    </div>
                                </div>
                            </>
                        ) : (
                            dataTask?.data?.map((tsk: any) => 
                                {
                                const style = filterPrioritasStyles[tsk.prioritas as keyof typeof filterPrioritasStyles] || { label: "Unknown", dot: "bg-gray-400" };    

                                if(tsk.status === 'cancelled'){
                                    return null;
                                }
                                return(
                                
                                <div key={tsk.id} className={`border-b last:border-0 border-gray-300 dark:border-slate-700 p-3 ${tsk.status === 'done' && 'opacity-50 line-through'}`}>
                                    <div className='flex items-start gap-3'>
                                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style?.dot}`} />
                                            <span className="text-xs text-gray-400 font-mono pt-0.5 min-w-[68px] shrink-0">
                                              Tenggat : {dayjs(tsk.tenggat_waktu).format('dddd, DD MMMM YYYY HH:mm')}
                                            </span>
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${tsk.status === 'assigned' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : tsk.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : tsk.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' } `}>
                                                {tsk.status}
                                            </span>
                                    
                                        </div>
                                        <div className='flex gap-2 items-center mb-1 mx-5'>
                                         
                                                <span className="text-[12px] font-bold text-gray-400 dark:text-gray-400 font-mono truncate">{tsk.mesin_nama}</span>
                                       
                                     
                                           
                                            
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tsk.judul}</p>
                                
                                        </div>
                                </div>
                            )})
                        )}
                           { dataTask?.data?.length === 0 && !loadingTasks && (
                                <div className="text-center py-12 text-gray-400 dark:text-gray-400 text-sm">
                                    Data tidak ditemukan
                                </div>
                            )}
                          {errorTasks && (
                
                            <div className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                                Gagal Memuat Data: {(error as any).message}
                            </div>
                        )}
                    </div>
                 
                        
       
                </div>
            </div>
            <MesinInfoModal isOpen={isMesinInfoModalOpen} onClose={() => setIsMesinInfoModalOpen(false)} dataInfo={dataInfo}/>
            <MesinMaintenanceModal isOpen={isMesinMaintenanceModalOpen} onClose={() => setIsMesinMaintenanceModalOpen(false)} dataMesin={dataMesinMaintenance}/>
        </div>
    );
}