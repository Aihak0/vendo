import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserByOwn } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "./UiElements/Alert";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, } from "@headlessui/react";
import { Circle, Loader2, Lock, Repeat, Square, UserPen } from "lucide-react";

export default function ProfilePage(){
    const {data, isLoading, error} = useQuery({
        queryKey: ["userProfile"],
        queryFn: getUserProfile
    
    });
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [openChangeProfile, setOpenChangeProfile] = useState(false);

    return (
        <div className="p-4 text-gray-700 dark:text-gray-400">
            {isLoading ? (
                <>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 rounded-full w-16 h-16" />
                    <div>
                        <h1 className="text-2xl font-bold">Profile</h1>
                        
                    </div>
                </div>
                <p>This is the profile page.</p>
                </>

            ): (
                <>
                    <div className="flex items-center gap-6 mb-6">
                        <img src={data.urlPasfoto} className="w-30 h-30 rounded-full" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-gray-300">{data.nama}</h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ data.role === 'admin' ? 'text-green-500 bg-green-500/20' : data.role === 'teknisi' ? 'text-blue-500 bg-blue-500/20' : 'text-slate-500 bg-slate-500/20' } `}>
                                    {data.role}
                                </span>
                            </div>
                            <p>{data.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="bg-slate-800 hover:bg-slate-700 text-sm text-gray-400 font-semibold py-1 px-2 rounded"
                            onClick={() => setOpenChangeProfile(true)}
                        >
                            Edit Profile
                        </button>

                        <button 
                            className="bg-slate-800 hover:bg-slate-700 text-sm text-gray-400 font-semibold py-1 px-2 rounded"
                            onClick={() => setOpenChangePassword(true)}
                        >
                            Ubah Password
                        </button>
                    </div>
                </>

            )}
            {error && <p className="text-red-500">{error.message}</p>}
            <ChangePassword isOpen={openChangePassword} onClose={() => setOpenChangePassword(false)}/>
            <EditProfileModal isOpen={openChangeProfile} onClose={() => setOpenChangeProfile(false)} dataProfile={data} />
        </div>
    )
}
function EditProfileModal({isOpen, onClose, dataProfile}: {isOpen: boolean; onClose: () => void; dataProfile: any}){
    const { user, refreshProfile } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [nama, setNama] = useState("");
    const alert = useAlert();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (dataProfile && isOpen) {
            setNama(dataProfile.nama);
            setPreviewUrl(dataProfile.urlPasfoto); 
            setFile(null);
            
        }
    }, [dataProfile, isOpen]);

    const resetForm = () => {
        setNama("");
        setFile(null);
        setPreviewUrl(null);
    }

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith('image/')) {
            alert.error('Hanya file gambar yang diperbolehkan', { title: "Error" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setFile(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // --- Reset / remove preview ---
    const removeImage = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
        fileInputRef.current.value = '';
        }
    };

    const mutation = useMutation({
        mutationFn: (fd: FormData) => {
            if (!user?.id) throw new Error("ID user tidak ditemukan");
            return updateUserByOwn(user.id, fd);
        },
        onSuccess: async (s: any) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            // Tambahkan async di atas, lalu await di sini
            await refreshProfile();
            alert.success(s.message);
            onClose();
        },
        onError: (err: any) => {
            alert.error(err.response.data.message || "Gagal memperbarui User");
        },
        onSettled: () => setLoading(false)
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData();
        formData.append("nama", nama);
        if(file){
            formData.append('pasFoto', file);
        }else{
            formData.append('pasFoto', '')
        }
        mutation.mutate(formData);
    }
    return (
        <Dialog open={ isOpen } onClose={onClose} className="relative z-50">
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
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 sm:mx-0 sm:size-10">
                                    <UserPen aria-hidden="true" className="size-6 text-blue-500" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <DialogTitle as="h3" className="text-base font-semibold dark:text-gray-200">
                                    Ubah Profile
                                </DialogTitle>
                                <div className="mt-2">
                                <p className="text-sm text-gray-400">
                                     Informasi yang Anda tambahkan di sini dapat dilihat oleh siapa pun yang dapat melihat profil Anda.

                                </p>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="mb-0">
                            <div className="w-full max-w-md mb-2">
                                <label  className="block mb-2.5 text-sm font-medium text-xs text-gray-700 dark:text-gray-300">Pasfoto</label>
                                {!previewUrl ? (
                                    // Dropzone kosong
                                    <div
                                        className={`
                                        relative flex flex-col items-center justify-center w-full h-64 
                                        border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                                        ${
                                        isDragging
                                            ? 'border-blue-500 dark:border-blue-300 bg-blue-50/60 dark:bg-slate-800 shadow-lg scale-[1.02]'
                                            : 'border-gray-300 dark:border-blue-900 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 hover:bg-slate-950 hover:border-gray-400 dark:hover:border-blue-800'
                                        }
                                    `}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleClick}
                                    >
                                    <input
                                        ref={fileInputRef}
                                        id="dropzone-file"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleChange}
                                    />

                                    <svg
                                        className={`w-12 h-12 mb-4 transition-colors ${
                                        isDragging ? 'text-blue-500' : 'text-gray-400'
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>

                                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                                        {isDragging ? (
                                        <span className="text-blue-600">Lepaskan gambar di sini</span>
                                        ) : (
                                        <>
                                            <span className="font-semibold text-blue-600">Klik</span> atau drag & drop
                                        </>
                                        )}
                                    </p>

                                    <p className="text-xs text-gray-500 dark:text-gray-600">
                                        PNG, JPG, GIF, WEBP (maks. 10MB disarankan)
                                    </p>
                                    </div>
                                ) : (
                                    // Tampilan preview
                                    <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-blue-800 shadow-sm group">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Overlay + tombol hapus */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                        onClick={removeImage}
                                        className="px-5 py-2.5 bg-white dark:bg-red-950 text-red-600 dark:text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900 active:bg-red-100 transition-colors shadow-md"
                                        >
                                        Hapus Gambar
                                        </button>
                                    </div>

                                    {/* Tombol ganti gambar (pojok kanan atas) */}
                                    <label
                                        htmlFor="dropzone-file"
                                        className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-gray-900 hover:bg-white text-gray-700 dark:text-gray-300 text-sm rounded-md cursor-pointer shadow-sm transition-colors"
                                    >
                                        Ganti
                                        <input
                                        ref={fileInputRef}
                                        id="dropzone-file"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleChange}
                                        />
                                    </label>
                                    </div>
                                )}
                            </div>

                            <label  className="block mb-2.5 text-sm text-xs text-gray-700 dark:text-gray-300">
                                Nama
                            </label>
                            <div className="relative mb-3 ">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={nama}
                                    onChange={(e) => 
                                        setNama(e.target.value)}
                                    className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all`}
                                    placeholder="Masukkan Nama "
                                
                                />
                            
                            </div>
                        </div> 
                        
                            <div className="flex"> 
                                  <button
                                    type="button"
                                    data-autofocus
                                    onClick={() => {
                                        onClose();
                                        resetForm();
                                    }}
                                    className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-l-lg"
                                    >
                                    <Square/>
                                </button>                     
                                <button
                                    type= "button"
                                    onClick={(e) => {
                                            e.preventDefault(); 
                                            handleSubmit(e);
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
function ChangePassword({isOpen, onClose}: {isOpen: boolean; onClose: () => void}){
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
    const resetForm = () => {
        setPassword("");
        setUlangiPassword("");
        setError("");
    }
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
        <Dialog open={ isOpen } onClose={onClose} className="relative z-50">
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
                                    Pasword anda akan diubah.
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
                                <button
                                    type="button"
                                    data-autofocus
                                    onClick={() => {
                                        onClose();
                                        resetForm();
                                    }}
                                    className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-lg"
                                    >
                                    <Square/>
                                </button>
                            </div>
                        </div>
                  
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}