import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAlert } from "../../UiElements/Alert";
import { deleteProduct } from "../../../services/api";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { Shredder, Square, Loader2, Trash } from "lucide-react";

interface ProdukDeleteModalProps{
    isOpen: boolean;
    onClose: () =>void;
    dataDelete: string[]
}
export function ProdukDelete({ isOpen, onClose, dataDelete}: ProdukDeleteModalProps){
    const [isLoading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const alert = useAlert();
    // Di dalam komponen ProdukDelete
    
    const mutation = useMutation({
  // Kita bungkus dataDelete ke dalam properti 'id' sesuai kontrak backend
    mutationFn: (ids: string[]) => deleteProduct({ id: ids }), 
  
    onSuccess: () => {
        alert.success('Produk berhasil dihapus');
        queryClient.invalidateQueries({ queryKey: ['products'] });
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
        <Dialog open={ isOpen } onClose={onClose} className="relative z-10">
                <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-zinc-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-150 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                            <div className="bg-zinc-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-500/10 sm:mx-0 sm:size-10">
                                    <Shredder aria-hidden="true" className="size-6 text-rose-400" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Hapus Bisnis
                                    </DialogTitle>
                                    <div className="mt-2">
                                    <p className="text-sm text-gray-400">
                                        Hapus { dataDelete?.length } Produk/Jasa?
                                
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
                                        className="flex-1 flex items-center justify-center text-center py-3 px-4 bg-zinc-600 text-white rounded-l font-medium hover:bg-zinc-700 cursor-pointer transition-colors"
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
                                        className={`flex-1 flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-medium rounded-r transition-colors
                                                    ${isLoading
                                                        ? 'bg-red-900 cursor-not-allowed' // Style saat tombol mati
                                                        : 'bg-red-600 hover:bg-red-700 cursor-pointer' // Style saat tombol aktif
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