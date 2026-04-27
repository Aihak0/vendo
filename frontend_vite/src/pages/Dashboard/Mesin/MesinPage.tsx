import { useQuery } from '@tanstack/react-query';
import { getMesin } from '../../../services/api';
import { Plus, Search, ChevronDown, PenLine, Trash, Table, Wifi, WifiOff, Wrench} from 'lucide-react';
import { MesinAdd } from './Add';
import { ProdukEdit} from './Edit';
import { MesinDelete } from './Delete';
import { MesinSlot } from './Slots';
import { useEffect, useState } from 'react';
import { FilterDropdown } from '../../../components/ui/dropdown/Dropdown';



const filterStatusStyles = {
  online: { label: "Online", icon: <Wifi size={14} className='text-gray-400' /> },
  offline: { label: "Offline", icon: <WifiOff size={14} className='text-gray-400' /> },
  maintenance: { label: "Maintenance", icon: <Wrench size={14} className='text-gray-400' /> },
  all: { label: "Semua Status", icon: <Wrench size={14} className='text-gray-400' />}
}
const filterStatusTypes = ["all", "online", "offline", "maintenance"];

export default function MesinPage() {
  const [ openModalAdd, setOpenModalAdd] = useState(false);
  const [ openModalEdit, setOpenModalEdit] = useState(false);
  const [ openModalDelete, setOpenModalDelete] = useState(false);
  const [ openModalSlot, setOpenModalSlot] = useState(false);
  const [ dataSlot, setDataSSlot] = useState();
  const [ dataEdit, setDataEdit] = useState();
  const [ dataDelete, setDataDelete] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeStatus, setActiveStatus] = useState("all");

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    queryKey: ['mesin', page, limit, sortKey, sortAsc, searchTerm, activeStatus], 
    queryFn: () => getMesin(page, limit, sortKey, sortAsc, searchTerm, activeStatus),
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
    setSelected(selected.length === mesin.data.length ? [] : mesin.data.map((r:any) => r.id));
  const handleReset = () => {
    setInputValue('');
    setSearchTerm('');
    setActiveStatus("all");
    setSortKey(null);
    setSortAsc(true);
    setPage(1);
    setLimit(10);
    setSelected([]);
  }
  useEffect(() => {
    setSelected([]);
  }, [mesin])
  
  if (error) return <div className="p-10 text-red-500 bg-[#121212] min-h-screen">Gagal memuat data: {(error as any).message}</div>;

  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-300">MESIN</h1>
          { isLoading ? (
            <div className=' px-20 py-2 bg-slate-800 mt-1 rounded-full'/>
          ) : (
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{mesin.data.length} dari {mesin.metadata.totalData} mesin ditampilkan</p>  
          )}
        </div>
        
    
      </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-blue-100 dark:border-blue-950 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-blue-900">
          
            <div className="flex gap-2">
               <FilterDropdown activeFilter={activeStatus} onChange={setActiveStatus}  style={filterStatusStyles} filter={filterStatusTypes}/>
               <div className="relative">
                <select
                    className={`overflow-hidden appearance-none transition duration-300 ease-in-out truncate p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none dark:text-gray-200 bg-blue-50/50 dark:bg-slate-900 cursor-pointer`}
                    value={limit}
                    onChange={(e) => {
                    setLimit(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 30].map((n) => (
                    <option key={n} value={n}>
                        {n}
                    </option>
                    ))}
                    { isLoading ? <option value={limit}>Loading...</option> :  <option key={mesin.metadata?.totalData} value={mesin.metadata?.totalData}>
                        Semua
                    </option> }
                   
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2`}>
                    <ChevronDown size={12}/>
                </div>
              </div>
             <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <input 
                  type="text" 
                  placeholder="Cari mesin dan tekan enter..." 
                  className="transition duration-300 ease-in-out pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none dark:text-gray-200 bg-blue-50/50 dark:bg-slate-900"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                
              </div>
              
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Cari
              </button>
            </form>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Reset semua
              </button>
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
             <button onClick={() => setOpenModalAdd(true)} className="p-1 bg-green-500 dark:bg-green-900 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition text-white dark:text-green-400">
                <Plus size={24} />
              </button>

            
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-700 border-b border-blue-100 dark:border-blue-900">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      disabled={isLoading || mesin?.data?.length === 0}
                      checked={selected.length === mesin?.data?.length && mesin?.data?.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 cursor-pointer rounded border transition-all duration-200
                                        appearance-none 
                                        bg-white border-slate-300 
                                        checked:bg-blue-500 checked:border-blue-500
                                        checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                                        bg-center bg-no-repeat bg-[length:12px_12px]
                                        dark:bg-slate-900 dark:border-slate-700 
                                        dark:checked:bg-blue-600 dark:checked:border-blue-600"
                    />
                  </th>
                  {columns.map((col) => 
                  {
                    const isSortable = col.key !== "lokasi";
                    const onClickProps = isSortable ? { onClick: () => toggleSort(col.key) } : {};
                  return (  
                    <th
                      key={col.key}
                      {...onClickProps}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {isSortable && (
                        <span className="text-slate-500 dark:text-gray-400 group-hover:text-slate-500 transition">
                          {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                        </span>
                        )}
                      </div>
                    </th>
                  )})}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && (
                  <>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length + 2} className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length + 1} className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length } className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  </>
                )}
                {error && (
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length + 2} className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                      Gagal Memuat Data: {(error as any).message}
                    </td>
                  </tr>
                )}
                {mesin?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="text-center py-12 text-slate-400 text-sm">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                ) : (
                  mesin?.data?.map((row: any) => {
                    const lokasiLengkap = [row.desa, row.kecamatan, row.kabupaten].filter(Boolean).join(', ')
                    return (
                    <tr
                      key={row.id}
                      className={`transition-colors border-b border-slate-200 dark:border-blue-900 hover:bg-slate-50 dark:hover:bg-slate-700 ${selected.includes(row.id) ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className={ `w-4 h-4 cursor-pointer rounded border transition-all duration-200
                                        appearance-none 
                                        bg-white border-slate-300 
                                        checked:bg-blue-500 checked:border-blue-500
                                        checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                                        bg-center bg-no-repeat bg-[length:12px_12px]
                                        dark:bg-slate-900 dark:border-slate-700 
                                        dark:checked:bg-blue-600 dark:checked:border-blue-600`}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">{row.kode.slice(0, 8)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {row.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-gray-300">{row.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">{lokasiLengkap}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : row.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' } `}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setDataEdit(row);
                            setOpenModalEdit(true);

                          }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
                            <PenLine size={14}/>
                          </button>
                          <button onClick={() => {setOpenModalSlot(true); setDataSSlot(row)}} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-red-50 dark:hover:bg-slate-800 transition">
                            <Table size={14}/>
                          </button>
                          <button onClick={() => {
                                            setDataDelete([row.id]);
                                            setOpenModalDelete(true);
                                          }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50  dark:hover:bg-slate-800 transition">
                            <Trash size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <span className="text-xs text-slate-400">Menampilkan {mesin?.data?.length} entri</span>
            <div className="flex gap-1">
              {Array.from({ length: mesin?.metadata?.totalPages }, (_, i)  => {
                const p = i+1;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === mesin?.metadata?.currentPage ? "bg-blue-600 dark:bg-slate-900 text-gray-300" : "text-slate-500 hover:bg-slate-100"}`}>
                  {p}
                </button>
              )})}
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