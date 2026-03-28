import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { useAlert } from "../../UiElements/Alerts";
import { FolderPen, Square, Loader2, Circle, Plus, ChevronDown, UserRoundKey} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {  addUser } from "../../../services/api";

interface UserAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}
type UserRole = "ADMIN" | "TEKNISI";

function capitalizeFirstLetter(string: string) {
  if (!string) return string; // Handle empty or null strings
  // Get the first character and convert to uppercase
  const firstChar = string.charAt(0).toUpperCase();
  // Get the rest of the string starting from the second character (index 1)
  const restOfString = string.slice(1).toLowerCase(); // Ensure the rest is lowercase
  // Combine and return
  return firstChar + restOfString;
}

export function ProdukAdd ({isOpen, onClose} : UserAddModalProps){
    const queryClient = useQueryClient();
    const [isLoading, setLoading] = useState(false);

    const [error, setError] = useState<Record<string, any>>({});
    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const password = "Hako123";
    const [role, setRole] = useState<UserRole>('TEKNISI');

    const alert = useAlert();

    function validatetName(name: string) {
        const cleanName = name.trim();

        if (cleanName.length === 0) return "Tolong isi kolom ini";
        if (cleanName.length < 2) return "Nama Terlalu Singkat, jangan gunakan singkatan";
        if (cleanName.length > 100) return "Nama terlalu panjang (max. 100 karakter)";
        if (/[^aeiouy\s]{6,}/i.test(cleanName)) return "Nama terdeteksi sebagai karakter acak";

        const symbolCount = (cleanName.match(/[^a-zA-Z0-9\s]/g) || []).length;
        if (symbolCount > 3) return "Terlalu banyak simbol, gunakan nama yang wajar";

        // 4. Blacklist Kata Sampah
        const blacklist = ["test", "testing", "asdf", "nama produk", "coba", "jancok", "bnagsat", "biadab"];
        if (blacklist.some(word => cleanName.toLowerCase() === word)) return "Masukkan nama produk yang valid";

        return null;
    }

    function validateEmail(email: string) {
        const cleanEmail = email.trim();
        if (cleanEmail.length === 0) return "Tolong isi kolom ini";
        // Gunakan tanda ! (not)
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
            return "Email tidak valid";
        }

        return null;
    }

    function resetForm() {
        setNama("");
        setEmail("");
        setRole("TEKNISI");
        const errors = {
            nama: "",
            email: ""
        };
        setError(errors);
    }

      const mutation = useMutation({
        mutationFn: addUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            alert.success('berhasil menambah data', {title: "Berhasil"})
            onClose(); 
            resetForm(); 
        },
        onError: (err: any) => {
             alert.error(`Gagal simpan: ${err.message}`, { title: "Error" });
        },
        onSettled: () => {
            setLoading(false);
        }
        });

        async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        
        const errors = {
            nama: validatetName(nama),
            email: validateEmail(email)
            };

        setError(errors);

        const hasError = Object.values(errors).some(msg => msg !== null);
        
        if (hasError) return;

        setLoading(true);

        const payload ={
            email, 
            password, 
            full_name: nama, 
            role
        };

        mutation.mutate(payload);
        }

    return(
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-300/50 dark:bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                
                    <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-white text-left shadow-xl outline outline-white/10 transition-all h-fit w-fit ">
                        
                             <div className="flex flex-col w-fit px-1 min-w-md">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                        <Plus aria-hidden="true" className="size-6 text-green-400" />
                                    </div>

                                    <div className="flex items-stretch h-full ml-3">
                                        <DialogTitle className=" flex items-center text-base font-semibold">
                                            Tambahkan User
                                        </DialogTitle>
                                    </div>
                                </div>
                                <form onSubmit={handleAdd} className="py-2 space-y-5 min-h-67">
                                    <div className="mb-2">
                                        <label  className="block mb-2.5 text-sm font-medium text-xs">Nama</label>
                                        <div className="relative mb-1">
                                            <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={nama}
                                                onChange={(e) => 
                                                    setNama(e.target.value)}
                                                className={`shadow-xs w-full bg-blue-50/50 pl-11 pr-4 py-2 border-2 ${error.nama ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border-blue-100 focus:border-blue-400 focus:ring-blue-100`} text-sm focus:ring-4 outline-none transition duration-300 ease placeholder:text-slate-400 rounded`}
                                                placeholder="Masukkan Nama "
                                            
                                            />
                                        </div>
                                        {error.nama && <p className="text-red-500 text-sm text-shadow-md px-1">{error.nama}</p>}
                                    </div>
                                    <div className="mb-2">
                                        <label  className="block mb-2.5 text-sm font-medium text-xs">Email</label>
                                        <div className="relative mb-1 ">
                                            <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={(e) => 
                                                    setEmail(e.target.value)}
                                                className={`shadow-xs w-full bg-blue-50/50 pl-11 pr-4 py-2 border-2 ${error.email ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border-blue-100 focus:border-blue-400 focus:ring-blue-100`} text-sm focus:ring-4 outline-none transition duration-300 ease placeholder:text-slate-400 rounded`}
                                                placeholder="Masukkan Email "
                                            
                                                />
                                        </div>
                                        {error.email && <p className="text-red-500 text-sm text-shadow-md px-1">{error.email}</p>}
                                    </div>
                                    
                                        <div className="mb-6">
                                        <label className="block mb-2.5 text-sm font-medium text-xs">Role</label>
                                        <div className="relative flex-1">
                                            <UserRoundKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"/>
                                            <select name="produk_id" value={role || ""} onChange={(e) => setRole(e.target.value as UserRole)} className="shadow-xs w-full bg-blue-50/50 pl-11 pr-4 py-2 border-2 border-blue-100 focus:border-blue-400 focus:ring-blue-100 text-sm focus:ring-4 outline-none transition duration-300 ease placeholder:text-slate-400 rounded appearance-none">
                                                <option value="" disabled>Pilih Role</option>
                                                {["TEKNISI", "ADMIN"].map((p) => (
                                                    <option key={p} value={p}>
                                                        {capitalizeFirstLetter(p)}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={17} className="absolute top-2.5 right-2.5 text-gray-500"/>
                                        </div>
                                    </div>
                                        <div className="flex bottom-0 w-full">
                                            <button
                                                type="button"
                                                data-autofocus
                                                onClick={() => {onClose(); resetForm();}}
                                                className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 text-white font-medium hover:bg-gray-600 cursor-pointer transition-colors rounded-l"
                                                >
                                                <Square/>
                                            </button>
                                            <button
                                                type="submit"

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
                                </form>
                            </div>
                            </DialogPanel>
                        </div>
                        </div>
                    </Dialog>
    );
}