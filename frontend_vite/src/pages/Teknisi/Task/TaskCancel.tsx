

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CircleSlash2, Info, Square } from "lucide-react";

interface TaskCancelModalProps {
    isOpen: boolean;
    onClose: () => void; 
    setReason: (reason: string) => void;
    onCancel: (id: string, status: string) => void;
    dataCancel: any;
    isLoading: boolean;
  } 

export function TaskCancelModal({isOpen, onClose, setReason, onCancel, dataCancel, isLoading}: TaskCancelModalProps){
        if(!isOpen) return null;
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
                                  <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                      Kenapa inngin membatalkan task ini?
                                  </DialogTitle>
                            </div>
                        </div>
                        
                        <textarea onChange={(e) => setReason(e.target.value)} placeholder="Masukkan alasan pembatalan task" className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4 dark:bg-slate-700 dark:text-gray-300"/>   
                       
                        <button
                            type="button"
                            disabled={!dataCancel || isLoading}
                            data-autofocus
                            onClick={() => {
                              onCancel(dataCancel.id, 'cancelled');
                            }}
                            className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-red-500 dark:bg-red-600 text-white dark:text-gray-300 font-medium hover:bg-red-600 dark:hover:bg-red-700 cursor-pointer transition-colors
                            disabled:bg-red-700  dark:disabled:bg-red-900  disabled:cursor-not-allowed disabled:opacity-70 rounded-lg"
                            >
                            <CircleSlash2 />
                        </button>
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