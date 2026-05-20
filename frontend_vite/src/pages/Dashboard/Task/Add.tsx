import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useEffect } from "react";
import { useAlert } from "../../UiElements/Alert";
import { FolderPen, Square, Loader2, Plus, Circle, ChevronDown, Check, X, Calendar} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTask, getMesin, getUser } from "../../../services/api";
import { type TaskAddModalProps } from "./Interface";
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { DatePicker, registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import locale Indonesia dari date-fns
import { id } from 'date-fns/locale/id'; 

// Langkah krusial: Daftarkan locale dengan nama "id"
registerLocale('id', id);


export function TaskAdd ({isOpen, onClose} : TaskAddModalProps){
    const { data: mesin, isLoading: loadingMesin , error: errorMesin} = useQuery({
        // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
        queryKey: ['mesin'], 
        queryFn: () => getMesin()
    });

    const { data: teknisi, isLoading: loadingTeknisi , error: errorTeknisi} = useQuery({
        // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
        queryKey: ['teknisi'], 
        queryFn: () => getUser(undefined, undefined, undefined, undefined, undefined, "teknisi")
    });

    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    // const [error, setError] = useState<Record<string, any>>({});
    const [judul, setJudul] = useState("");
    const [prioritas, setPrioritas] = useState<"low" | "medium" | "high" | "urgent">("low");
    const [tipeTugas, setTipeTugas] = useState<"restock" | "inspection" | "repair">("inspection");
    const [tenggatWaktu, setTenggatWaktu] = useState<Date | null>(new Date());
    const [selectedMesin, setSelectedMesin] = useState<any>(null);

    const [taskTeknisi, setTaskTeknisi] = useState<any>([]);


    const alert = useAlert();

    function resetForm() {
        setJudul("");
        setPrioritas("low");
        setTenggatWaktu(null);
        setTipeTugas("inspection");
        setSelectedMesin(null);
        setTaskTeknisi([]);
    }

    
    const mutation = useMutation({
        mutationFn: addTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskManajement'] });
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
        setLoading(true);

        const IdTeknisi = taskTeknisi.map((t: any) => t.user_id);
        const payload = {
            judul,
            prioritas,
            ditugaskan_ke: IdTeknisi,
            mesin_id: selectedMesin?.id,
            tipe_tugas: tipeTugas,
            tenggat_waktu: tenggatWaktu
        };
        mutation.mutate(payload);
    }

    useEffect(() => {
        resetForm();
    },[]);

    useEffect(() => {
        console.log("Tenggat waktu berubah:", tenggatWaktu?.toLocaleString());
    }, [tenggatWaktu])
    return(
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-zinc-900/50 transition-opacity"/>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                
                    <DialogPanel className="flex  p-6 transform  rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-blue-50 dark:outline-blue-950 transition-all h-fit mt-10 mb-10">
                         
                        {/* Form Section */}
                        <div className="flex flex-col px-1 w-[460px] shrink-0 ">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                    <Plus aria-hidden="true" className="size-6 text-green-400" />
                                </div>

                                <div className="flex items-stretch h-full ml-3">
                                    <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        Tambahkan Task
                                    </DialogTitle>
                                </div>
                            </div>
                            <form onSubmit={handleAdd} className="py-2 space-y-5 min-h-55 text-base dark:text-gray-400">
                                <div className="mb-0">
                                    <label  className="block mb-2.5 text-sm text-xs">Tugas</label>
                                    <div className="relative mb-3 ">
                                        <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={judul}
                                            onChange={(e) => 
                                                setJudul(e.target.value)}
                                            className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all`}
                                            placeholder="Masukkan Tugas "
                                        
                                        />
                                    
                                    </div>
                                </div> 
                                <div className="mb-3">

                                <Listbox value={tipeTugas} onChange={setTipeTugas} >
                                        <Label className="block font-medium text-xs m-0">Tipe Tugas</Label>
                                        <div className="relative mt-2 cursor-pointer m-0">
                                        <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-blue-50/50 dark:bg-slate-900 py-1.5 pr-2 pl-3 text-left dark:text-white border border-blue-100 dark:border-slate-700 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6 cursor-pointer">
                                            <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6 ">
                                            { tipeTugas ? (
                                                <>
                                                    <span className="block truncate">{tipeTugas}</span>
                                               
                                                </>

                                            ) : (
                                                <span className="block truncate cursor-pointer text-gray-400 dark:text-gray-500">Pilih tipe tugas</span>
                                            )}
                                            </span>
                                            <ChevronDown
                                                aria-hidden="true"
                                                className="col-start-1 row-start-1 size-5 self-center justify-self-end text-blue-300 dark:text-gray-400 sm:size-4"
                                                />
                                        </ListboxButton>

                                        <ListboxOptions
                                            transition
                                            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base border border-blue-100 dark:border-slate-700 shadow-lg data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                                        >
                                            
                                            {["restock", "inspection", "repair"].map((m) => (
                                                <ListboxOption
                                                key={m}
                                                value={m}
                                                className="group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-blue-500 dark:data-focus:bg-blue-950 data-focus:outline-hidden cursor-pointer"
                                                >
                                                <div className="flex items-center">
                                                    <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">{m}</span>
                                         
                                                </div>

                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                                                    <Check aria-hidden="true" className="size-4" />
                                                </span>
                                                </ListboxOption>
                                            ))}
                                            
                                            
                                        </ListboxOptions>
                                        </div>
                                    </Listbox>
                                </div>
                                <div className="mb-3">
                                    <Listbox value={prioritas} onChange={setPrioritas} >
                                        <Label className="block font-medium text-xs m-0">Urgensi</Label>
                                        <div className="relative mt-2 cursor-pointer m-0">
                                        <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-blue-50/50 dark:bg-slate-900 py-1.5 pr-2 pl-3 text-left dark:text-white border border-blue-100 dark:border-slate-700 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6 cursor-pointer">
                                            <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6 ">
                                            { prioritas ? (
                                                <>
                                                    <span className="block truncate">{prioritas}</span>
                                               
                                                </>

                                            ) : (
                                                <span className="block truncate cursor-pointer text-gray-400 dark:text-gray-500">Pilih tipe tugas</span>
                                            )}
                                            </span>
                                            <ChevronDown
                                                aria-hidden="true"
                                                className="col-start-1 row-start-1 size-5 self-center justify-self-end text-blue-300 dark:text-gray-400 sm:size-4"
                                                />
                                        </ListboxButton>

                                        <ListboxOptions
                                            transition
                                            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base border border-blue-100 dark:border-slate-700 shadow-lg data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                                        >
                                            
                                            {["low", "medium", "high", "urgent"].map((m) => (
                                                <ListboxOption
                                                key={m}
                                                value={m}
                                                className=" group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-blue-500 dark:data-focus:bg-blue-950 data-focus:outline-hidden cursor-pointer"
                                                >
                                                    <div className="flex items-center ">
                                                        <div className={`${m === "low" ? "bg-green-500" : m === "medium" ? "bg-yellow-500" : m === "high" ? "bg-orange-500" : "bg-red-500"} p-1 rounded-full`}/>
                                                        <div className="flex items-center">
                                                            <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">{m}</span>
                                                
                                                        </div>
                                                    </div>

                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                                                        <Check aria-hidden="true" className="size-4" />
                                                    </span>
                                                </ListboxOption>
                                            ))}
                                            
                                            
                                        </ListboxOptions>
                                        </div>
                                    </Listbox>
                                </div>
                                <div className="mb-3">
                                    <Listbox value={taskTeknisi} onChange={setTaskTeknisi} multiple>
                                        <Label className="block font-medium text-xs">Teknisi</Label>
                                        <div className="relative mt-2 cursor-pointer">
                                        <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-blue-50/50 dark:bg-slate-900 py-1.5 pr-2 pl-3 text-left dark:text-white border border-blue-100 dark:border-slate-700 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6 cursor-pointer min-h-9">
                                            <span className="col-start-1 row-start-1 flex flex-wrap items-center gap-1.5 pr-6">
                                            {taskTeknisi.length > 0 ? (
                                                taskTeknisi.map((t: any) => (
                                                <span
                                                    key={t.user_id}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                                                >
                                                    <img
                                                    alt=""
                                                    src={t.urlPasfoto}
                                                    className="size-4 shrink-0 rounded-full bg-gray-700 outline -outline-offset-1 outline-white/10"
                                                    />
                                                    <span>{t.nama}</span>
                                                    {/* Tombol hapus per item */}
                                                    <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Jangan trigger Listbox
                                                        setTaskTeknisi((prev: any[]) =>
                                                        prev.filter((item) => item.user_id !== t.user_id)
                                                        );
                                                    }}
                                                    className="ml-0.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                                                    >
                                                    <X className="size-3" aria-hidden="true" />
                                                    </button>
                                                </span>
                                                ))
                                            ) : (
                                                <span className="block truncate cursor-pointer text-gray-400 dark:text-gray-500">
                                                Pilih teknisi
                                                </span>
                                            )}
                                            </span>
                                            <ChevronDown
                                            aria-hidden="true"
                                            className="col-start-1 row-start-1 size-5 self-center justify-self-end text-blue-300 dark:text-gray-400 sm:size-4"
                                            />
                                        </ListboxButton>

                                        <ListboxOptions
                                            transition
                                            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base border border-blue-100 dark:border-slate-700 shadow-lg data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                                        >
                                            {loadingTeknisi ? (
                                            <ListboxOption
                                                value=""
                                                className="group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-slate-500 data-focus:outline-hidden cursor-pointer"
                                            >
                                                <div className="flex items-center">
                                                <span className="ml-3 block truncate font-normal">loading data...</span>
                                                </div>
                                            </ListboxOption>
                                            ) : (
                                            teknisi.data.map((t: any) => (
                                                <ListboxOption
                                                key={t.user_id}
                                                value={t}
                                                className="group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-blue-500 dark:data-focus:bg-blue-950 data-focus:outline-hidden cursor-pointer"
                                                >
                                                <div className="flex items-center">
                                                    <img
                                                    alt=""
                                                    src={t.urlPasfoto}
                                                    className="size-5 shrink-0 rounded-full outline -outline-offset-1 outline-white/10"
                                                    />
                                                    <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">
                                                    {t.nama}
                                                    </span>
                                                    <span className="ml-3 block truncate text-gray-500 text-xs font-normal group-data-selected:font-semibold">
                                                    {t.email}
                                                    </span>
                                                </div>

                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                                                    <Check aria-hidden="true" className="size-4" />
                                                </span>
                                                </ListboxOption>
                                            ))
                                            )}

                                            {errorTeknisi && (
                                            <ListboxOption
                                                value=""
                                                className="group relative cursor-default py-2 pr-9 pl-3 text-red-500 select-none data-focus:bg-indigo-500 data-focus:outline-hidden"
                                            >
                                                <div className="flex items-center">
                                                <span className="ml-3 block truncate font-normal">Gagal Mengambil data</span>
                                                </div>
                                            </ListboxOption>
                                            )}
                                        </ListboxOptions>
                                        </div>
                                    </Listbox>
                                </div>
        
                                <div className="mb-3">
                                    <Listbox value={selectedMesin} onChange={setSelectedMesin} >
                                        <Label className="block font-medium text-xs">Mesin</Label>
                                        <div className="relative mt-2 cursor-pointer">
                                        <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-blue-50/50 dark:bg-slate-900 py-1.5 pr-2 pl-3 text-left dark:text-white border border-blue-100 dark:border-slate-700 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm/6 cursor-pointer">
                                            <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6 ">
                                            { selectedMesin ? (
                                                <>
                                                    <span className="block truncate">{selectedMesin.nama}</span>
                                               
                                                </>

                                            ) : (
                                                <span className="block truncate cursor-pointer text-gray-400 dark:text-gray-500">Pilih mesin</span>
                                            )}
                                            </span>
                                            <ChevronDown
                                                aria-hidden="true"
                                                className="col-start-1 row-start-1 size-5 self-center justify-self-end text-blue-300 dark:text-gray-400 sm:size-4"
                                                />
                                        </ListboxButton>

                                        <ListboxOptions
                                            transition
                                            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base border border-blue-100 dark:border-slate-700 shadow-lg data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                                        >
                                            {loadingMesin ? (
                                            <ListboxOption

                                                value=''
                                                className="group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-slate-500 data-focus:outline-hidden cursor-pointer"
                                            >
                                                <div className="flex items-center">
                                                
                                                <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">loading data...</span>
                                                </div>

                                                
                                            </ListboxOption>
                                            ): (
                                            mesin.data.map((m: any) => (
                                                <ListboxOption
                                                key={m.mesin_id}
                                                value={m}
                                                className="group relative cursor-default py-2 pr-9 pl-3 dark:text-white select-none data-focus:bg-blue-500 dark:data-focus:bg-blue-950 data-focus:outline-hidden cursor-pointer"
                                                >
                                                <div className="flex items-center">
                                                    <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">{m.nama}</span>
                                         
                                                </div>

                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                                                    <Check aria-hidden="true" className="size-4" />
                                                </span>
                                                </ListboxOption>
                                            ))
                                            
                                            )}
                                            { errorMesin && (
                                                <ListboxOption

                                                value=''
                                                className="group relative cursor-default py-2 pr-9 pl-3 text-red-500 select-none data-focus:bg-indigo-500 data-focus:outline-hidden"
                                            >
                                                <div className="flex items-center">
                                                
                                                <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">Gagal Mengambil data</span>
                                                </div>

                                                
                                            </ListboxOption>
                                            )}
                                            
                                        </ListboxOptions>
                                        </div>
                                    </Listbox>
                                    
                                </div>
                                <div className="mb-0">
                                    <label  className="block mb-2.5 text-sm text-xs">Tenggat waktu</label>
                                 
                                    <div className=" relative mb-3 flex items-center gap-2 px-4 py-0.5 rounded border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        {/* DatePicker di sini */}
                                       <DatePicker 
                                            selected={tenggatWaktu}
                                            locale="id" // Ubah ke ID
                                            showTimeSelect
                                            timeFormat="HH:mm" // Format 24 jam lebih umum di Indonesia
                                            timeIntervals={15}
                                            dateFormat="dd/MM/yyyy HH:mm" // Format: 20/05/2026 00:00
                                            placeholderText="Pilih tanggal dan waktu"
                                            onChange={setTenggatWaktu} 
                                            className="bg-transparent rounded outline-none text-xs text-gray-700 dark:text-gray-300 w-full pl-6 px-4 py-2"
                                            wrapperClassName="w-full"
                                            >
                                            <div style={{ color: "red", fontSize: "10px", padding: "5px" }}>
                                                Jangan lupa cek tenggat waktu!
                                            </div>
                                        </DatePicker>
                                    
                                    </div>
                                </div> 
                                <div className="flex bottom-0 w-full">
    
                                    <button
                                        type="button"
                                        data-autofocus
                                        onClick={() => onClose()}
                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-l-lg"
                                        >
                                        <Square/>
                                    </button>
                                    <button
                                        type="submit"

                                        disabled={loading}
                                        className={`flex-1 flex items-center justify-center py-2 px-4 text-white font-medium rounded-r-lg transition-colors
                                                    ${ loading
                                                        ? 'bg-blue-900 dark:bg-blue-950 cursor-not-allowed' // Style saat tombol mati
                                                        : 'bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 cursor-pointer dark:hover:bg-blue-900' // Style saat tombol aktif
                                                    } text-white`}
                                        >
                                        {loading ? (
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