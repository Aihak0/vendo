import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useAlert } from "../../UiElements/Alerts";
import { changeRole, deleteProduct } from "../../../services/api";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { Shredder, Square, Loader2, Trash, ArrowUp, ArrowDown, Circle } from "lucide-react";

interface UserChangeRoleModalProps{
    isOpen: boolean;
    onClose: () =>void;
    dataToChange: {
        data: Record<string, any>, 
        changeToRole: string
    }
}
export function UserChangeRole({ isOpen, onClose, dataToChange}: UserChangeRoleModalProps){
    const [isLoading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const alert = useAlert();
    // Di dalam komponen ProdukDelete
    
    const mutation = useMutation({
  // Kita bungkus dataDelete ke dalam properti 'id' sesuai kontrak backend
    mutationFn: (changeTo: string) => changeRole(dataToChange.data.user_id, changeTo ), 
  
    onSuccess: (data) => {
        alert.success(data.message || 'Produk berhasil dihapus');
        queryClient.invalidateQueries({ queryKey: ['user'] });
        onClose();
    },
    onError: (err: any) => {
        alert.error(err.response?.data?.message || 'Gagal Mengubah Role', { title: "Error" });
    },
    onSettled: () => {
        setLoading(false);
    }
    });

    const handleChngeRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataToChange || dataToChange.data.length === 0) return;
        
        setLoading(true);
        mutation.mutate(dataToChange.changeToRole); // Mengirim array string ID
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
                            className="relative transform overflow-hidden rounded-lg bg-zinc-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-150 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                            <div className="bg-zinc-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${dataToChange.changeToRole == "ADMIN" ? `bg-green-500/10` : `bg-rose-500/10`}  sm:mx-0 sm:size-10`}>
                                    { dataToChange.changeToRole == "ADMIN" ? (
                                        <ArrowUp aria-hidden="true" className="size-6 text-green-400" />
                                    ) : (
                                        <ArrowDown aria-hidden="true" className="size-6 text-rose-400" />
                                    )}
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Ubah Role User
                                    </DialogTitle>
                                    <div className="mt-2">
                                    <p className="text-sm text-gray-400">
                                        Ubah role {dataToChange.data.role} { dataToChange.data.nama } | { dataToChange.data.email } ke role { dataToChange.changeToRole }
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
                                                handleChngeRole(e);
                                        }}
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-r transition-colors
                                                ${ isLoading
                                                    ? 'bg-blue-900 cursor-not-allowed' // Style saat tombol mati
                                                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer' // Style saat tombol aktif
                                                } text-white`}
                                    >
                                    {isLoading ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    )  : (
                                    <Circle/>
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