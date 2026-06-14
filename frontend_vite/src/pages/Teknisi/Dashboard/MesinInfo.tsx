import { useEffect, useState } from "react";
import type { MesinInfoModalProps } from "./interface";
import type { SlotRow } from "../../Dashboard/Mesin/Interface";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Info, Square } from "lucide-react";
import { MapContainer } from "../../../components/MapLokasi";

export function MesinInfoModal({isOpen, onClose, dataInfo}: MesinInfoModalProps){

    
    const [slot, setSlot] = useState<SlotRow[]>([]);
    

    useEffect(() => {
          if (dataInfo && isOpen) {
              const slots = dataInfo.slots;
              const groupedByRow = slots.reduce((acc:SlotRow[], curr) => {
                const rowNum = curr.metadata.row_number;
  
                // Cari apakah row_number ini sudah ada di accumulator
                let row = acc.find((r) => r.row_number === rowNum);
  
                // Jika belum ada, buat baris baru
                if (!row) {
                  row = {
                    row_number: rowNum,
                    col: [],
                  };
                  acc.push(row);
                }
  
                // Masukkan data slot ke dalam array 'col'
                row.col.push({
                  kode: curr.kode,
                  col_number: curr.metadata.col_number,
                  span: curr.metadata.span,
                  gabungan: curr.metadata.gabungan,
                  stock: curr.stock || 0,
                  ...(curr.produk && {
                    produk_id: curr.produk_id,
                    produk: curr.produk
                  }),
                });
  
                // Urutkan kolom berdasarkan col_number agar rapi
                row.col.sort((a, b) => a.col_number - b.col_number);
  
                return acc;
              }, []);
  
              groupedByRow.sort((a, b) => a.row_number - b.row_number);
  
              setSlot(groupedByRow);
          }
      }, [dataInfo, isOpen]);

      return(
         <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                  <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-blue-50 dark:outline-blue-950 transition-all h-fit mt-10 mb-10 ">
                      
                      {/* Form Section */}
                    <div className="flex flex-col w-fit px-1 min-w-md">
                        <div className="sm:flex sm:items-start mb-3">
                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 sm:mx-0 sm:size-10">
                                <Info aria-hidden="true" className="size-6 text-blue-400" />
                            </div>
                            <div className="items-stretch h-full ml-3 max-w-101">
                                { dataInfo ? (
                                    <>
                                    <div className="flex items-center justify-between">
                                      <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        {dataInfo?.nama}
                                      </DialogTitle>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dataInfo.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : dataInfo.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }`} >
                                        {dataInfo.status}
                                      </span>
                                    </div>
                                    <div className="text-gray-400 flex items-center">
                                      <p className="text-sm text-blue-400 dark:text-blue-500">{dataInfo.kode}</p>

                                    </div>
                                    <p className="text-sm text-gray-400">{[
                                                                                    dataInfo.desa,
                                                                                    dataInfo.kecamatan,
                                                                                    dataInfo.kabupaten,
                                                                                    dataInfo.provinsi,
                                                                                    dataInfo.negara,
                                                                                    dataInfo.kodePos,
                                                                                ]
                                                                                .filter(Boolean)
                                                                                .join(", ")}</p>
                                    </>
                                ): (
                                    <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        Mesin tidak ditemukan
                                    </DialogTitle>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center  mb-3 gap-2 items-stretch">
                          <div className="rounded-lg flex flex-1 items-center justify-between text-slate-600 dark:text-gray-300 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-600 px-5 py-1">
                            <label className="text-slate-500 dark:text-gray-400">slot kosong </label>
                            <span className="">{dataInfo?.slots?.filter(item => item.produk_id === null).length || 0}</span>
                          </div>
                          <div className="rounded-lg flex-1  flex items-center justify-between text-slate-600 dark:text-gray-300 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-500 px-5 py-1">
                            <label className="text-red-400 dark:text-red-600">stok kosong </label>
                            <span className="">{dataInfo?.slots?.filter(item => item.stock === 0).length || 0}</span>
                          </div>
                          <div className="rounded-lg flex flex-1  items-center justify-between text-slate-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-500 px-5 py-1">
                            <label className="text-yellow-400 dark:text-yellow-600 ">stok hampir habis</label>
                            <span className="">{dataInfo?.slots?.filter(item => item.stock < 2 && item.stock != 0).length || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="rounded-lg  flex items-center gap-2 text-slate-600 dark:text-gray-300 bg-blue-50/50 dark:bg-slate-900 px-5 py-1 border border-blue-100 dark:border-blue-900">
                            <label className="text-slate-500 dark:text-gray-400">total baris :</label>
                            <span className="">{dataInfo?.row_slots}</span>
                          </div>
                          <div className="rounded-lg  flex items-center gap-2 text-slate-600 dark:text-gray-300 bg-blue-50/50 dark:bg-slate-900 px-5 py-1 border border-blue-100 dark:border-blue-900">
                            <label className="text-slate-500 dark:text-gray-400">total slot :</label>
                            <span className="">{dataInfo?.total_slot}</span>
                          </div>
                        </div>
                         <div className="flex items-center gap-3 py-1 mb-2">
                            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                                <span className="block text-sm text-xs text-slate-300 dark:text-slate-500">
                                    Slot Mesin
                                </span>
                            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                        </div>
                        <div className="w-full flex flex-col gap-2 mb-2">
                          {slot.map((s) => (
                            <div key={s.row_number} className="flex justify-between gap-2">
                              <div className="flex w-full gap-2">
                                {s.col
                                  
                                  .map(c => {
                                    const isMerged = c.span > 1;
                                    const totalCols = s.col.length;
                                    const widthPercent = (c.span / totalCols) * 100;

                                    return (
                                      <div
                                        key={c.col_number}
                                        style={{ width: `calc(${widthPercent}% - ${(8 * (totalCols - c.span)) / totalCols}px)` }}
                                        className={`
                                          min-h-10 flex flex-col items-center justify-center gap-1 group inline-block
                                          rounded-lg border-[1.5px] text-center px-3 py-2
                                          transition-colors duration-100 select-none relative
                                          ${c.produk && c.stock === 0 ? 'bg-red-200 dark:bg-red-950  border-red-300 dark:border-red-700 text-red-500' :  c.produk &&  c.stock  && c.max_stock && c.stock / c.max_stock * 100  <= 50 ? 'bg-yellow-200 dark:bg-yellow-950  border-yellow-300 dark:border-yellow-700 text-yellow-500' : c.produk && c.stock && c.stock > 5 ? 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-400 ' : 
                                             "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 "
                                          }
                                        `}
                                      
                                      >
                                        {isMerged ? (
                                          <>
                                            <span className="text-xs font-medium">{c.kode}</span>
                                            <span className="text-[8px] py-0.5 px-2 bg-emerald-500 dark:bg-emerald-700 absolute right-1 top-1 rounded-sm text-white">
                                              {c.span} kolom
                                            </span>
                                            
                                          </>
                                        ) : (
                                          <span className="text-xs">{c.kode}</span>
                                        )}

                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50">
                                          { c.produk ? (
                                            <>
                                                <div className="relative p-2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-950 rounded border border-blue-400 dark:border-blue-800 shadow-xl whitespace-nowrap">
                                                  <p className="text-gray-500 dark:text-gray-400">
                                                    Produk: {c.produk.nama }
                                                  </p>
                                                  <p className="font-bold">
                                                    Stok: { c.stock }
                                                  </p>
        
                                                </div>
                                                <div className="w-3 h-3 z-10 -mt-[6.5px] rotate-45 bg-white dark:bg-slate-950 border-r border-b border-blue-400 dark:border-blue-800 shadow-lg"></div>
                                            </>
                                            ): (
                                              <>
                                              <span className="relative p-2 text-xs text-gray-500 bg-white dark:bg-slate-950 rounded border border-blue-400 dark:border-blue-800 shadow-xl whitespace-nowrap">
                                                Kosong
                                              </span>
  
                            
                                              <div className="w-3 h-3 z-10 -mt-[6.5px] rotate-45 bg-white dark:bg-slate-950 border-r border-b border-blue-400 dark:border-blue-800 shadow-lg"></div>
                                              </>

                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                              
                        </div>
                        <div className="flex items-center gap-3 py-1 mb-2">
                          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                              <span className="block text-sm text-xs text-slate-300 dark:text-slate-500">
                                  Pin Point
                              </span>
                          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                        </div>
                        <div className="relative mb-3">
                          { dataInfo && (
                            <MapContainer locations={[{id: dataInfo?.id, nama: dataInfo?.nama, status: dataInfo?.status, latitude: dataInfo?.latitude, longitude: dataInfo?.longitude}]}/>
                          )}
                        </div>
                        <button
                            type="button"
                            data-autofocus
                            onClick={() => onClose()}
                            className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-lg"
                            >
                            <Square/>
                        </button>
                    </div>
                  </DialogPanel>
              </div>
            </div>
        </Dialog>
      );

}