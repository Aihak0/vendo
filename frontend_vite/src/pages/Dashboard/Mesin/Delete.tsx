import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAlert } from "../../UiElements/Alert";
import { deleteMesin } from "../../../services/api";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { Shredder, Square, Loader2, Trash } from "lucide-react";
import { type MesinDeleteModalProps } from "./Interface";

export function MesinDelete({ isOpen, onClose, dataDelete}: MesinDeleteModalProps){
    const [isLoading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const alert = useAlert();
    
    const mutation = useMutation({
        // Kita bungkus dataDelete ke dalam properti 'id' sesuai kontrak backend
    mutationFn: (ids: string[]) => deleteMesin({ id: ids }), 
  
    onSuccess: () => {
        alert.success('Mesin berhasil dihapus');
        queryClient.invalidateQueries({ queryKey: ['mesin'] });
        onClose();
    },
    onError: (err: any) => {
        alert.error(err.response?.data?.message || 'Gagal menghapus', { title: "Error" });
    },
    onSettled: () => {
        setLoading(false);
    }
    });

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataDelete || dataDelete.length === 0) return;
        
        setLoading(true);
        mutation.mutate(dataDelete); // Mengirim array string ID
    };
 return (
    <>
        <Dialog open={ isOpen } onClose={onClose} className="relative z-50">
                <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0 ">
                            <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 dark:outline-blue-950 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-100 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-500/10 sm:mx-0 sm:size-10">
                                        <Shredder aria-hidden="true" className="size-6 text-red-500" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold dark:text-gray-200">
                                        Hapus { dataDelete?.length } Mesin?
                                    </DialogTitle>
                                    <div className="mt-2">
                                    <p className="text-sm text-gray-400">
                                        Mesin berikut akan dihapus permanen.
                                
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
                                        onClick={() => onClose()}
                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-400 dark:bg-slate-700 text-white rounded-l-lg font-medium hover:bg-gray-500 dark:hover:bg-slate-800 cursor-pointer transition-colors border dark:border-slate-700 border-gray-400"
                                        >
                                        <Square/>
                                    </button>
                                
                                    <button
                                        type= "button"
                                        onClick={(e) => {
                                                e.preventDefault(); 
                                                handleDelete(e);
                                        }}
                                        disabled={ isLoading}
                                        className={`flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-r-lg transition-colors border dark:border-red-700 border-red-500
                                                    ${isLoading
                                                        ? 'bg-red-900 cursor-not-allowed' // Style saat tombol mati
                                                        : 'bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-800 cursor-pointer ' // Style saat tombol aktif
                                                    } text-white`}
                                        >
                                            {isLoading ? (
                                                 <Loader2 size={24} className="animate-spin" />
                                            )  : (
                                                <Trash />
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