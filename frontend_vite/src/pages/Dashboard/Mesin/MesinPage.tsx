import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMesin, getProducts } from '../../../services/api';
import { Plus, Search, Filter, PenLine, Trash, Table} from 'lucide-react';
import { MesinAdd } from './Add';
import { ProdukEdit} from './Edit';
import { MesinDelete } from './Delete';
import { MesinSlot } from './Slots';
import { useState } from 'react';
import CustomDropdown, {type DropdownItem} from '../../../components/ui/dropdown/Dropdown';

export default function MesinPage() {
  const queryClient = useQueryClient();
  const [ openModalAdd, setOpenModalAdd] = useState(false);
  const [ openModalEdit, setOpenModalEdit] = useState(false);
  const [ openModalDelete, setOpenModalDelete] = useState(false);
  const [ openModalSlot, setOpenModalSlot] = useState(false);
  const [ dataSlot, setDataSSlot] = useState();
  const [ dataEdit, setDataEdit] = useState();
  const [ dataDelete, setDataDelete] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
   const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
   const columns = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama" },
    { key: "lokasi", label: "Lokasi" },
    { key: "status", label: "Status" },
  ];

    const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };


  const { data: mesin, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['mesin', searchTerm], 
    queryFn: () => getMesin(searchTerm),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };

  const toggleSelect = (id: string) =>
      setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelected(selected.length === mesin.length ? [] : mesin.map((r:any) => r.id));


  if (isLoading) return <div className="p-10 text-white bg-[#121212] min-h-screen">Loading...</div>;
  
  if (error) return <div className="p-10 text-red-500 bg-[#121212] min-h-screen">Gagal memuat data: {(error as any).message}</div>;

  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PRODUK</h1>
          <p className="text-slate-500 text-sm mt-1">0  dari 10 karyawan ditampilkan</p>  
        </div>
        
    
      </div>

      {/* 2. Content Section */}
      
  
        {/* Header */}
        <div className="mb-6">

      
        </div>

        {/* Card */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          
            <div className="relative">
             <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <input 
                  type="text" 
                  placeholder="Cari produk dan tekan enter..." 
                  className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Cari
              </button>
            </form>
            </div>
            <div className="flex gap-3">
              {selected.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{selected.length} dipilih</span>
                  <button onClick={() => {
                            setDataDelete(selected);
                            setOpenModalDelete(true);
                          }} 
                          className="text-sm text-red-500 hover:text-red-700 font-medium transition">Hapus</button>
                </div>
              )}
             <button onClick={() => setOpenModalAdd(true)} className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition text-white">
                <Plus size={24} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border  rounded-lg">
                <Filter size={18} />
                <span>semua</span>
              </button>

            
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === mesin.length && mesin.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-violet-500 cursor-pointer"
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <span className="text-slate-300 group-hover:text-slate-500 transition">
                          {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mesin.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                ) : (
                  mesin.map((row: any) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50 ${selected.includes(row.id) ? "bg-violet-50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-violet-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{row.kode}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {row.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{row.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{row.lokasi}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium `}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setDataEdit(row);
                            setOpenModalEdit(true);

                          }} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                            <PenLine size={14}/>
                          </button>
                          <button onClick={() => {setOpenModalSlot(true); setDataSSlot(row)}} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-red-50 transition">
                            <Table size={14}/>
                          </button>
                          <button onClick={() => {
                                            setDataDelete([row.id]);
                                            setOpenModalDelete(true);
                                          }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Menampilkan {mesin.length} entri</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((p) => (
                <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === 1 ? "bg-violet-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
      </div>
    </div>
    <MesinAdd
      isOpen={openModalAdd}
      onClose={() => {
        setOpenModalAdd(false);
      }}
    />
    <ProdukEdit
      isOpen={openModalEdit}
      onClose={() => {
        setOpenModalEdit(false);
      }}
      dataEdit={dataEdit || null}
    />
    <MesinDelete
      isOpen={openModalDelete}
      onClose={() => {
        setOpenModalDelete(false);
      }}
      dataDelete={dataDelete}
    />
    <MesinSlot
      isOpen={openModalSlot}
      onClose={() => {
        setOpenModalSlot(false);
      }}
      dataSlot={dataSlot || null}
    />
    </>
  );
}