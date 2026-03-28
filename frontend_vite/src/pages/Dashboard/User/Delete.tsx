import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAlert } from "../../UiElements/Alerts";
import { deactivateUser, deleteProduct } from "../../../services/api";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { Activity, Square, Loader2, TrendingUpDown, CircleSlash, CircleOff } from "lucide-react";

interface ProdukDeleteModalProps{
    isOpen: boolean;
    onClose: () =>void;
    dataDeactivate: any[]
}
export function ProdukDelete({ isOpen, onClose, dataDeactivate}: ProdukDeleteModalProps){
    const [isLoading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const alert = useAlert();
    const adaYangAktif = dataDeactivate.some(item => item.is_active === true);  
    const adaYangNonAktif = dataDeactivate.some(item => item.is_active === false);
    const totalAktif = dataDeactivate.filter(item => item.is_active === true).length;
    const totalNonAktif = dataDeactivate.filter(item => item.is_active === false).length;
    // Di dalam komponen ProdukDelete
    
    const mutation = useMutation({
  // Kita bungkus dataDelete ke dalam properti 'id' sesuai kontrak backend
    mutationFn: deactivateUser, 
  
    onSuccess: (data) => {
        alert.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['user'] });
        onClose();
    },
    onError: (err: any) => {
        alert.error(err.response?.data?.message || 'Gagal menonaktifkan', { title: "Error" });
    },
    onSettled: () => {
        setLoading(false);
    }
    });

    const handleNonActive = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataDeactivate || dataDeactivate.length === 0) return;
        
        setLoading(true);
        mutation.mutate(dataDeactivate); // Mengirim array string ID
    };
 return (
    <>
        <Dialog open={ isOpen } onClose={onClose} className="relative z-50">
                <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-zinc-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-150 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                            <div className="bg-whitedark:bg-zinc-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${ adaYangAktif && adaYangNonAktif ? `bg-amber-500/10` : adaYangAktif ? `bg-rose-500/10` : `bg-green-500/10` } sm:mx-0 sm:size-10`}>
                                    { adaYangAktif && adaYangNonAktif ? <TrendingUpDown aria-hidden="true" className="size-6 text-amber-400" /> : adaYangAktif ? <CircleOff aria-hidden="true" className="size-6 text-rose-400" /> : <Activity aria-hidden="true" className="size-6 text-green-400" /> }
                                    
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold dark:text-white">
                                        { adaYangAktif && "Nonaktifkan " }
                                        { adaYangAktif && adaYangNonAktif && "Dan " }
                                        { adaYangNonAktif && "Aktifkan " }
                                        User
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-400">
                                            { adaYangAktif && `Nonaktifkan ${totalAktif} ` }
                                            { adaYangAktif && adaYangNonAktif && "Dan " }
                                            { adaYangNonAktif &&`Aktifkan ${ totalNonAktif } ` }
                                             User?
                                        </p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div>
                                <div className="p-6 space-y-5">
                                    <div className="flex">
                                        <button
                                            type="button"
                                            data-autofocus
                                            onClick={() => {onClose()}}
                                            className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 text-white font-medium hover:bg-gray-600 cursor-pointer transition-colors rounded-l"
                                            >
                                            <Square/>
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={(e) => {
                                                        e.preventDefault(); 
                                                        handleNonActive(e);
                                                }}
                                            disabled={isLoading}
                                            className={`flex-1 flex items-center justify-center py-2 px-4 text-white font-medium rounded-r transition-colors
                                                        ${ isLoading
                                                            ? 'bg-rose-900 cursor-not-allowed' // Style saat tombol mati
                                                            : 'bg-rose-600 hover:bg-rose-700 cursor-pointer' // Style saat tombol aktif
                                                        } text-white`}
                                            >
                                            {isLoading ? (
                                                <Loader2 size={24} className="animate-spin" />
                                            )  : (
                                                <CircleSlash/>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </DialogPanel>
                        </div>
                        </div>
                    </Dialog>
    </>
 );
} 