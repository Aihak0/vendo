import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useRef, useEffect, useCallback, type MouseEvent } from "react";
import { useAlert } from "../../UiElements/Alert";
import { FolderPen, Square, Loader2, Plus, Locate, Circle, ChevronsDown} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMesin } from "../../../services/api";
import { type DragState, type SlotRow, type MesinAddModalProps } from "./Interface";
import { colToLetter, getDragState } from "./proses";




export function MesinAdd ({isOpen, onClose} : MesinAddModalProps){
    const dragRef = useRef<DragState>({ active: false, startR: null, startC: null, curC: null });
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const [, setTick] = useState<number>(0);
    // const [error, setError] = useState<Record<string, any>>({});
    const [nama, setNama] = useState("");
    const [lokasi, setLokasi] = useState("");

    const [rows, setRows] = useState<number>();

    const [slot, setSlot] = useState<SlotRow[]>([]);
    
    const totalSlot = slot.reduce((sum, row) => sum + row.col.length, 0);
    const [statusSlot, setStatusSlot] = useState<string>(
      "Seret slot ke kiri atau kanan untuk menggabungkan."
    );

    const alert = useAlert();

    function resetForm() {
        setNama("");
        setLokasi("");
    }

    const handleSetRows = (newRowCount: number) => {
        setRows(newRowCount);
    
        setSlot((prevSlots: any[]) => {
          const currentCount = prevSlots.length;
    
          if (newRowCount > currentCount) {
            // --- PENAMBAHAN BARIS ---
            const additionalRows = [];
            for (let r = currentCount; r < newRowCount; r++) {
              additionalRows.push({
                row_number: r + 1,
                col: [{
                  kode: `${colToLetter(r)}1`,
                  col_number: 1,
                  span: 1,
                  gabungan: []
                }]
              });
            }
            // Gabungkan data lama dengan baris baru
            return [...prevSlots, ...additionalRows];
    
          } else if (newRowCount < currentCount) {
            // --- PENGURANGAN BARIS ---
            // Ambil data dari indeks 0 sampai jumlah baris baru
            return prevSlots.slice(0, newRowCount);
    
          } else {
            // Jika jumlahnya sama, jangan ubah apa-apa
            return prevSlots;
          }
        });
    };

    const handleReset = () => {
        setRows(1);
        let newRow =[];
        for (let r = 0; r < 1; r++) {
            newRow.push({
            row_number: r + 1,
            col: [{
                    kode: `${colToLetter(r)}1`,
                    col_number: 1,
                    span: 1,
                    gabungan: []
                }]
            });
        }
        setSlot(newRow);
        setStatusSlot("Grid direset.");
    };

    const handleSplit = (rowNumber: number, colNumber: number) => {
        setSlot(prev => prev.map(row => {
            if (row.row_number !== rowNumber) return row;

            const target = row.col.find(c => c.col_number === colNumber);
            if (!target || target.span <= 1) return row;

            const addCount = target.span - 1;
            const lastColNumber = row.col[row.col.length - 1].col_number;
            const rowLetter = colToLetter(row.row_number - 1);

            // reset span di target
            const resetCols = row.col.map(c =>
                c.col_number === colNumber ? { ...c, span: 1 } : c
            );

            // tambah kolom baru di akhir
            const newCols = Array.from({ length: addCount }, (_, i) => ({
                col_number: lastColNumber + i + 1,
                kode: `${rowLetter}${lastColNumber + i + 1}`,
                span: 1,
                gabungan: []
            }));

            return { ...row, col: [...resetCols, ...newCols] };
        }));
    };

    const handleAddColumnToRow = (rnum: number) => {
        // 1. Cek apakah baris (row) tersebut sudah ada di dalam state
        const rowExists = slot.find((item) => item.row_number === rnum);
    
        if (!rowExists) {
          // Jika baris belum ada, tambahkan baris baru ke dalam array
          const newRow = {
            row_number: rnum,
            col: [{
              kode: `${colToLetter(rnum-1)}1`,
              col_number: 1,
              span: 1,
              gabungan: []
            }]
          };
          setSlot([...slot, newRow]);
        } else {
          // Jika baris sudah ada, update baris tersebut menggunakan .map()
          const updatedSlot = slot.map((item) => {
            if (item.row_number === rnum ) {
              const nextColNumber = item.col.length + 1;
              return {
                ...item,
                col: [
                  ...item.col,
                  {
                    kode: `${colToLetter(item.row_number-1)}${nextColNumber}`,
                    col_number: nextColNumber,
                    span: 1,
                    gabungan: []
                  }
                ]
              };
            }
            return item; 
          });
    
          setSlot(updatedSlot);
        }
    };

    const forceUpdate = () => setTick((t) => t + 1);
    const handleMouseUp = useCallback(() => {
        const { active, startR, startC, curC } = dragRef.current;
        if (!active) return;
        dragRef.current = { active: false, startR: null, startC: null, curC: null };
    
        if (startR === null || startC === null || curC === null || startC === curC) {
          forceUpdate();
          return;
        }
    
        const cStart = Math.min(startC, curC);
        const cEnd = Math.max(startC, curC);
        let gabungan = [];
    
        for(let i = cStart; i <= cEnd; i++){
          gabungan.push(`${colToLetter(startR-1)}${i}`);
        }
    
        setSlot(prev => prev.map(row => {
            if (row.row_number !== startR) return row;
        
            const span = cEnd - cStart + 1;
            const mergeCount = span - 1; // jumlah kolom yang akan dihapus dari akhir
        
            // 1. set span di cStart
            const updatedCols = row.col.map(c =>
            c.col_number === cStart ? { ...c, span, gabungan: gabungan} : c
            );
        
            // 2. hapus (mergeCount) kolom dari akhir row
            const trimmed = updatedCols.slice(0, updatedCols.length - mergeCount);
        
            return { ...row, col: trimmed };
        }));
    
        setStatusSlot(`Digabung: baris ${startR} kolom ${cStart}–${cEnd}`);
        console.log(gabungan);
    }, []);

    const handleMouseLeave = () => {
        if (!dragRef.current.active) return;
        dragRef.current = { active: false, startR: null, startC: null, curC: null };
        forceUpdate();
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>, rowNum: number, colNum: number) => {
        e.preventDefault();
        dragRef.current = { active: true, startR: rowNum, startC: colNum, curC: colNum };
        forceUpdate();
    };
    
    const handleMouseEnter = (rowNum: number, colNum: number) => {
        if (!dragRef.current.active || rowNum !== dragRef.current.startR) return;
        dragRef.current.curC = colNum;
        forceUpdate();
    };


    
    const mutation = useMutation({
        mutationFn: addMesin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mesin'] });
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

        const payload = {
            nama: nama,
            lokasi: lokasi,
            rows: rows, 
            total_slot: totalSlot, 
            slots: slot
        };
        mutation.mutate(payload);
    }

    useEffect(() => {
        handleReset();
    },[]);

    return(
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
            <DialogBackdrop className="fixed inset-0 bg-zinc-900/50 transition-opacity"/>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                
                    <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-gray-100 text-left shadow-xl outline outline-white/10 transition-all h-fit w-fit ">
                        
                        {/* Form Section */}
                        <div className="flex flex-col w-fit px-1 min-w-md">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                    <Plus aria-hidden="true" className="size-6 text-green-400" />
                                </div>

                                <div className="flex items-stretch h-full ml-3">
                                    <DialogTitle className=" flex items-center text-base font-semibold">
                                        Tambahkan Mesin
                                    </DialogTitle>
                                </div>
                            </div>
                            <form onSubmit={handleAdd} className="py-2 space-y-5 min-h-55 relative">
                                <div className="mb-0">
                                    <label  className="block mb-2.5 text-sm font-medium text-xs">Nama Mesin</label>
                                    <div className="relative mb-3 ">
                                        <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={nama}
                                            onChange={(e) => 
                                                setNama(e.target.value)}
                                            className={`shadow-xs w-full pl-11 pr-4 py-2 border border-transparent placeholder:text-stone-400 focus-visible:ring-transparent text-sm  focus-visible:outline-none bg-gray-200 rounded`}
                                            placeholder="Masukkan Nama "
                                        
                                        />
                                    
                                    </div>
                                </div> 
                                
                                <div className="mb-0">
                                    <label  className="block mb-2.5 text-sm font-medium text-xs">Lokasi</label>
                                    <div className="relative mb-3">
                                        <Locate className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={lokasi}
                                            onChange={(e) => 
                                                setLokasi(e.target.value)}
                                            className={`shadow-xs w-full pl-11 pr-4 py-2 border border-transparent placeholder:text-stone-400 focus-visible:ring-transparent text-sm  focus-visible:outline-none bg-gray-200 rounded`}
                                            placeholder="Lokasi Mesin"
                                        
                                        />
                                    
                                    </div>
                                </div>
                                
                                <div className="flex absolute bottom-0 w-full">
    
                                    <button
                                        type="button"
                                        data-autofocus
                                        onClick={() => onClose()}
                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 text-white font-medium hover:bg-gray-600 cursor-pointer transition-colors rounded-l"
                                        >
                                        <Square/>
                                    </button>
                                    <button
                                        type="submit"

                                        disabled={loading}
                                        className={`flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 text-white font-medium rounded-r transition-colors
                                                    ${ loading
                                                        ? 'bg-blue-900 cursor-not-allowed' // Style saat tombol mati
                                                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer' // Style saat tombol aktif
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
                        
                        <div className="flex flex-1 flex-col ml-6 ">
                            <div className="flex">
                                <div className=" mb-3">
                                    <DialogTitle className="text-base text-xl">
                                        Slot Mesin
                                    </DialogTitle>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Seret slot ke kiri atau kanan untuk menggabungkan. Klik slot hijau untuk memisahkan.
                                    </p>
                                </div>
                            </div>
                
                            <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
                                <div className="flex justify-between">
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="text-sm text-gray-500">Baris</label>
                                    <div className="relative">
                                        <select
                                            className={`overflow-hidden pr-8 truncate h-full appearance-none block px-3 py-1 bg-zinc-50 border border-gray-300 text-xs rounded-base focus:outline-hidden focus:ring-0 shadow-xs placeholder:text-body rounded-md cursor-pointer`}
                                            value={rows}
                                            onChange={(e) => {
                                            handleSetRows(Number(e.target.value));
                                            }}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                            ))}
                                        </select>
                                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2`}>
                                            <ChevronsDown size={12}/>
                                        </div>
                                    </div>
                                    <button onClick={handleReset} className="py-1 px-3 bg-amber-400 text-xs rounded text-white hover:bg-amber-500 shadow-md shadow-amber-300/50">
                                    Reset semua
                                    </button>
                                </div>
                                <div className="flex text-xs text-gray-400 items-center">
                                    Total Slot : {totalSlot}
                                </div>
                                </div>
                        
                                <div className="w-full flex flex-col gap-2">
                                {slot.map((s) => (
                                    <div key={s.row_number} className="flex justify-between gap-2">
                                    <div className="flex w-full gap-2">
                                        {s.col
                                        
                                        .map(c => {
                                            const dragState = getDragState(dragRef.current, s.row_number, c.col_number);
                                            const isMerged = c.span > 1;
                                            const totalCols = s.col.length;
                                            const widthPercent = (c.span / totalCols) * 100;

                                            return (
                                            <div
                                                key={c.col_number}
                                                style={{ width: `calc(${widthPercent}% - ${(8 * (totalCols - c.span)) / totalCols}px)` }}
                                                className={`
                                                min-h-20 flex flex-col items-center justify-center gap-1
                                                rounded-lg border-[1.5px] text-center px-3 py-2
                                                transition-colors duration-100 select-none relative
                                                ${isMerged
                                                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 cursor-pointer"
                                                    : dragState === "drag-start"
                                                    ? "bg-blue-50 border-blue-400 text-blue-700 cursor-crosshair"
                                                    : dragState === "drag-over"
                                                    ? "bg-blue-200 border-blue-400 text-blue-900 cursor-crosshair"
                                                    : "bg-white border-gray-300 text-gray-400 cursor-crosshair"
                                                }
                                                `}
                                                onMouseDown={!isMerged ? (e) => handleMouseDown(e, s.row_number, c.col_number) : undefined}
                                                onMouseEnter={!isMerged ? () => handleMouseEnter(s.row_number, c.col_number) : undefined}
                                                onClick={isMerged ? () => handleSplit(s.row_number, c.col_number) : undefined}
                                            >
                                                {isMerged ? (
                                                <>
                                                    <span className="text-xs font-medium">{c.kode}</span>
                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 absolute right-1 top-1 rounded-sm text-white">
                                                    {c.span} kolom
                                                    </span>
                                                    <span className="text-[10px] text-emerald-700 opacity-70">klik untuk pisah</span>
                                                </>
                                                ) : (
                                                <span className="text-xs">{c.kode}</span>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <button
                                        type="button"
                                        onClick={() => handleAddColumnToRow(s.row_number)}
                                        className="text-body bg-neutral-200 border border-zinc-300 hover:bg-neutral-300 text-sm px-2 py-2.5 rounded h-full"
                                        >
                                        <Plus size={20}/>
                                
                                        </button>
                                    </div>
                                    </div>
                                ))}
                                </div>
                                {/* Status */}
                                <div style={{ marginTop: "1rem", fontSize: 13, color: "#6b7280", minHeight: 20 }}>
                                {statusSlot}
                                </div>
                            </div>
                                    
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}