import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeStatusTask, getMyTask } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import { Calendar, Cog, CircleSlash2 } from "lucide-react";
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TaskCancelModal } from "./TaskCancel";

import "dayjs/locale/id"; 
import { useAlert } from "../../UiElements/Alert";


export default function TaskPage(){
    dayjs.extend(utc);
    dayjs.extend(timezone);


    dayjs.locale('id');

    const { profile } = useAuth();
     const queryClient = useQueryClient();
     const alert = useAlert();   
    const { data, isLoading, error } = useQuery({
        // Gunakan profile?.user_id langsung di queryKey
        queryKey: ['MyTask', profile?.id],
        
        // Fungsi hanya akan dijalankan jika profile?.user_id ada
        queryFn: () => getMyTask(profile.id, undefined),
        

        enabled: !!profile?.id, 
    });


    const [ isTaskCancelModalOpen, setIsTaskCancelModalOpen] = useState(false);
    const [ reason, setReason] = useState("");
    const [ dataCancel, setDataCancel] = useState<any>(null);
    const [isLoadingCancel, setIsLoadingCancel] = useState(false);

    const mutation = useMutation({
      
    mutationFn: changeStatusTask, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['MyTask'] });
            alert.success("Task berhasil diperbarui");
            setIsTaskCancelModalOpen(false);
        },
        onError: (err: any) => {
            alert.error(err.message || "Gagal memperbarui Data");
        },
        onSettled: () => setIsLoadingCancel(false)
    });

    const handleChangeStatus = (id: string, status: string) => {
        setIsLoadingCancel(true);
        mutation.mutate({ id, status, reason });

    }
    return ( 
        <div className="">
            <div className="grid grid-cols-4 gap-6 ">
                <div className="col-span-2 grid grid-cols-2 gap-6">
                       
                    
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
                        data.data.map((row: any) => {
                            
                            return(
                            <div key={row.id} className="bg-white dark:bg-slate-800 rounded-lg h-fit p-5 text-slate-700 dark:text-gray-300 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-bold">{row.judul}</h2>
                                 
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.status === 'done' ? 'text-green-500 bg-green-500/20' : row.status === 'cancelled' ? 'text-red-500 bg-red-500/20' : row.status === 'assigned' ? 'text-amber-500 bg-amber-500/20' : row.status === 'in_progress' ? 'text-blue-500 bg-blue-500/20' : 'text-slate-500 bg-slate-500/20' } `}>
                                            {row.status}
                                        </span>
                    
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 mb-3"> 
                                    <Calendar size={17}/>
                                    <p className="text-sm">{dayjs(row.tenggat_waktu).format('dddd, DD MMMM YYYY HH:mm')}</p>
                                </div>
                                <div className="flex items-center mb-3 gap-2">
                                    <div className="flex items-center gap-2 text-gray-400 "> 
                                        <Cog size={17}/>
                                        <p className="text-sm">{row.mesin.nama}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.mesin.status === 'online' ? 'text-green-500 bg-green-500/20' : row.mesin.status === 'offline' ? 'text-red-500 bg-red-500/20' : row.mesin.status === 'maintenance' ? 'text-amber-500 bg-amber-500/20' : 'text-slate-500 bg-slate-500/20' } `}>
                                        {row.mesin.status}
                                    </span>
                    
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.prioritas === 'low' ? 'text-blue-500 bg-blue-500/20' : row.prioritas === 'urgent' ? 'text-red-500 bg-red-500/20' : row.prioritas === 'medium' ? 'text-yellow-500 bg-yellow-500/20' : row.status === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' } `}>
                                        {row.prioritas}
                                    </span>
                                    
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.tipe_tugas === 'restock' ? `text-emerald-500 bg-emerald-500/20` :  row.tipe_tugas === 'inspection' ? `text-blue-500 bg-blue-500/20` : row.tipe_tugas === 'repair' ? `text-yellow-500 bg-yellow-500/20` : `text-slate-500 bg-slate-500/20`} `}>
                                        {row.tipe_tugas}
                                    </span>
                                    
                                </div>
                                { row.status === 'cancelled' && (
                                    <div className="p-3 bg-red-100 dark:bg-red-700/20 text-red-700 dark:text-red-300 rounded">
                                        <p className="flex text-sm gap-2"><p className="text-gray-400">Alasan Pembatalan: </p> {row.metadata.reason}</p>
                                    </div>
                                )}
                                { row.status === 'done' && (
                                    <div className="p-3 bg-green-100 dark:bg-green-700/20 text-green-700 dark:text-green-300 rounded">
                                        <p className="flex text-sm gap-2">Tugas Selesai</p>
                                    </div>
                                )}
                                { (row.status !== 'cancelled' && row.status !== 'done') && (
                                <div className="flex items-center gap-2">
                                    <button
                                    disabled={row.status !== 'in_progress' } 
                                    onClick={() => {
                                        setDataCancel(row);
                                        setIsTaskCancelModalOpen(true);
                                    }}
                                    className=" flex items-center justify-center text-center py-2 px-4 bg-red-500 dark:bg-red-700 text-white dark:text-gray-300 font-medium hover:bg-red-600 dark:hover:bg-red-800 cursor-pointer transition-colors rounded-lg
                                    disabled:bg-red-700 disabled:dark:bg-red-900 disabled:cursor-not-allowed disabled:opacity-70"><CircleSlash2 size={18}/></button>
                                    
                                <button 
                                
                                    disabled={row.mesin.status !== 'maintenance'} 
                                    onClick={() => {
                                        handleChangeStatus(row.id, row.status === 'in_progress' ? 'done' : 'in_progress');
                                    }}
                                    className={`flex-1 flex items-center justify-center text-center py-2 px-4 
                                                font-medium rounded-lg transition-colors
                                                ${row.status === 'in_progress' ? 'enabled:bg-green-500 enabled:dark:bg-green-700 enabled:hover:bg-green-600 enabled:dark:hover:bg-green-800 disabled:bg-green-700  dark:disabled:bg-green-900' : 'enabled:bg-blue-500 enabled:dark:bg-blue-700 enabled:hover:bg-blue-600 enabled:dark:hover:bg-blue-800 disabled:bg-blue-700  dark:disabled:bg-blue-900'}
                                                text-white dark:text-gray-300 
                                                disabled:cursor-not-allowed disabled:opacity-70 text-sm`}
                                    >
                                        {row.status === 'in_progress' ? 'Set Done' : 'Set In Progress'}
                                    </button>
                                </div>
                                )}
                            </div>
    
                        )})
                    )}
                     { data?.data?.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-400 dark:text-gray-400 text-sm">
                                    Data tidak ditemukan
                                </div>
                            )}
                    {error && (
                
                            <div className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                                Gagal Memuat Data: {(error as any).message}
                            </div>
                        )}
                </div>
            </div>
          
          <TaskCancelModal isOpen={isTaskCancelModalOpen} onClose={() => setIsTaskCancelModalOpen(false)} setReason={setReason} onCancel={handleChangeStatus} dataCancel={dataCancel}  isLoading={isLoadingCancel}/>
        </div>
    );
}