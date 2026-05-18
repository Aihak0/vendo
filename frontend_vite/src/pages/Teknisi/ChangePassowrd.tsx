import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { Circle, Loader2, Lock, Repeat } from "lucide-react";
import { useState } from "react";
import { updateUserByOwn } from "../../services/api";
import { useAlert } from "../UiElements/Alert";
import { useAuth } from "../../context/AuthContext";


export default function ChangePassword({isOpen}: {isOpen: boolean}){
    const { user, refreshProfile } = useAuth();
    const alert = useAlert();
    const [isLoading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [ulangiPassword, setUlangiPassword] = useState("");
    const [ error, setError ] = useState("");

     const mutation = useMutation({
            mutationFn: (fd: FormData) => {
                // Kita gunakan optional chaining di sini, 
                // tapi kita pastikan user_id ada sebelum mutasi jalan
                if (!user?.id) throw new Error("ID user tidak ditemukan");
                return updateUserByOwn(user.id, fd);
            },
            onSuccess: async (s: any) => {
                // Tambahkan async di atas, lalu await di sini
                await refreshProfile();
                alert.success(s.message);
            },
            onError: (err: any) => {
                setError(err.response.data.message);
                alert.error(err.response.data.message || "Gagal memperbarui User");
            },
            onSettled: () => setLoading(false)
        });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if(password !== ulangiPassword){
            setError("Password dan konfirmasi password tidak cocok");
            setLoading(false);
            return;
        }
        const formData = new FormData();
        formData.append("password", password);
        mutation.mutate(formData);
    }
    return (
        <Dialog open={ isOpen } onClose={() => {}} className="relative z-50">
            <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"/>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0 ">
                        <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 dark:outline-blue-950 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-100 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                        >
                        <div className="p-6 space-y-5">
                        <div className="bg-white dark:bg-slate-800 ">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-500/10 sm:mx-0 sm:size-10">
                                    <Lock aria-hidden="true" className="size-6 text-red-500" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <DialogTitle as="h3" className="text-base font-semibold dark:text-gray-200">
                                    Ubah Password
                                </DialogTitle>
                                <div className="mt-2">
                                <p className="text-sm text-gray-400">
                                    Pasword akun anda harus diubah untuk melanjutkan.
                                </p>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="mb-0">
                            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
                            <label  className="block mb-2.5 text-sm text-xs text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <div className="relative mb-3 ">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => 
                                        setPassword(e.target.value)}
                                    className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all`}
                                    placeholder="Masukkan Password "
                                
                                />
                            
                            </div>
                        </div> 
                        <div className="mb-0">
                            <label  className="block mb-2.5 text-sm text-xs text-xs text-gray-700 dark:text-gray-300">Ulangi Password</label>
                            <div className="relative mb-3 ">
                                <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={ulangiPassword}
                                    onChange={(e) => 
                                        setUlangiPassword(e.target.value)}
                                    className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all`}
                                    placeholder="Ulangi Password "
                                
                                />
                            
                            </div>
                        </div> 
                            <div className="flex">                      
                                <button
                                    type= "button"
                                    onClick={(e) => {
                                            e.preventDefault(); 
                                            handleChangePassword(e);
                                    }}
                                    disabled={ isLoading}
                                    className={`flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-r-lg transition-colors border dark:border-blue-700 border-blue-500
                                                ${isLoading
                                                    ? 'bg-blue-900 cursor-not-allowed' // Style saat tombol mati
                                                    : 'bg-blue-500 dark:bg-blue-700 hover:bg-blue-600 dark:hover:bg-blue-800 cursor-pointer ' // Style saat tombol aktif
                                                } text-white`}
                                    >
                                        {isLoading ? (
                                                <Loader2 size={24} className="animate-spin" />
                                        )  : (
                                            <Circle />
                                        )}
                                </button> 
                            </div>
                        </div>
                  
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}