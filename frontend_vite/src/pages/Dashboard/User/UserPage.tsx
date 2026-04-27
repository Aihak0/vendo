import { useQuery } from '@tanstack/react-query';
import { getUser } from '../../../services/api';
import { Plus, Search, PenLine, Activity, CircleSlash, ChevronDown, ArrowUp, ArrowDown, UserStar, UserCog, GalleryHorizontalEnd} from 'lucide-react';
import { ProdukAdd } from './Add';
import { ProdukEdit} from './Edit';
import { ProdukDelete } from './Delete';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
import { UserChangeRole } from './ChangeRole';
import { useAuth } from '../../../context/AuthContext';
import { FilterDropdown } from '../../../components/ui/dropdown/Dropdown';

const filterRoleStyles = {
  admin: { label: "Admin", icon: <UserStar size={14} className='text-gray-400' /> },
  teknisi: { label: "Teknisi", icon: <UserCog size={14} className='text-gray-400' /> },
  all: { label: "Semua Role", icon: <GalleryHorizontalEnd size={14} className='text-gray-400' />}
}
const filterRoleTypes = ["all", "teknisi", "admin"];


export default function UserPage() {
  dayjs.extend(relativeTime);
  dayjs.locale('id'); 
  const {profile} = useAuth(); 
  const [ openModalAdd, setOpenModalAdd] = useState(false);
  const [ openModalEdit, setOpenModalEdit] = useState(false);
  const [ openModalDelete, setOpenModalDelete] = useState(false);
  const [ dataEdit, setDataEdit] = useState();
  const [ dataChange, setDataChange] = useState<{data: any, changeToRole: string} | null>(null);
  const [ openModalConfirmChangeRole, setopenModalConfirmChangeRole] = useState(false);
  const [ dataActivateorDeactivateUser, setDataDeactivate] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeRole, setActiveRole] = useState("all")
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<any[]>([]);
  
  const columns = [
    { key: "nama", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "last_signin", label: "Terakhir login" },
    { key: "is_default_password", label: "Password Bawaan" },
  ];
  const { data: user, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['user', searchTerm, page, limit, sortAsc, sortKey, activeRole], 
    queryFn: () => getUser(page, limit, sortAsc, sortKey, searchTerm, activeRole),
  });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };
  const handleReset = () => {
    setPage(1);
    setLimit(10);
    setActiveRole("all");
    setSortAsc(true);
    setSortKey(null);
    setInputValue("");
    setSearchTerm("");
    setSelected([]);
  }
  const toggleSelect = (user_id: string, is_active: boolean) =>
    setSelected((prev) =>
    prev.some(item => item.user_id === user_id) ? prev.filter((x) => x.user_id !== user_id) : [...prev, { user_id: user_id, is_active: is_active }]
  );

  const toggleAll = () => setSelected(selected.length === user.data.length ? [] : user.data.map((r:any) => ({ user_id: r.user_id, is_active: r.is_active })));

  useEffect(() => {
    console.log("Selected => ", selected)
  })
  useEffect(() => {
    setSelected([]); // atau null, tergantung tipe data state kamu
}, [user]);
  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-300">USER</h1>
            { isLoading ? (
              <div className=' px-20 py-2 bg-slate-800 mt-1 rounded-full'/>
            ) : (
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{user.data.length} dari {user.metadata.totalData} User ditampilkan</p>  
            )}

        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-blue-100 dark:border-blue-950 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-blue-900">
        
          <div className="flex gap-2">
            <FilterDropdown activeFilter={activeRole} onChange={setActiveRole}  style={filterRoleStyles} filter={filterRoleTypes}/>
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
                  { isLoading ? <option value={limit}>Loading...</option> :  <option key={user.metadata?.totalData} value={user.metadata?.totalData}>
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
                          setDataDeactivate(selected);
                          setOpenModalDelete(true);
                        }} 
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition">Nonaktifkan</button>
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
              <tr className={`bg-slate-100/50 dark:bg-slate-700 border-b border-blue-100 dark:border-blue-900`}>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    disabled={isLoading || user?.data?.length === 0}
                    checked={selected.length === user?.data?.length && user?.data?.length > 0}
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
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <span className="text-slate-500 dark:text-gray-400 group-hover:text-slate-500 transition">
                        {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>
                ))}
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
              {user?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                user?.data?.map((row: any) => (
                  
                  <tr
                    key={row.user_id}
                    className={`transition-colors border-b border-slate-200 ${row.is_active ? "hover:bg-slate-50 dark:hover:bg-slate-700": "bg-slate-900"} dark:border-blue-900  ${selected.some(item => item.user_id === row.user_id) ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.some(item => item.user_id === row.user_id)}
                        onChange={() => toggleSelect(row.user_id, row.is_active)}
                        className="w-4 h-4 cursor-pointer rounded border transition-all duration-200
                                        appearance-none 
                                        bg-white border-slate-300 
                                        checked:bg-blue-500 checked:border-blue-500
                                        checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                                        bg-center bg-no-repeat bg-[length:12px_12px]
                                        dark:bg-slate-900 dark:border-slate-700 
                                        dark:checked:bg-blue-600 dark:checked:border-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      
                      {row.urlPasfoto ? (
                        <div className="flex items-center gap-3">
                          <img src={row.urlPasfoto} className='w-9 h-9 rounded-full' alt="" />
                          <span className="text-sm font-medium text-slate-800 dark:text-gray-300">{row.nama}</span>
                        </div>
                      ) : 
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {row.nama.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-gray-300">{row.nama}</span>
                        </div>
                      }
                    </td>

                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">{row.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ row.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' } `}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">{row.last_signin === null ? ("Tidak Pernah login") : dayjs(row.last_signin).fromNow()}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">{row.is_default_password ? ("Ya") : "Tidak"}</td>
                    <td className="px-4 py-3.5">
                      { profile.user_id !== row.user_id && (

                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setDataEdit(row);
                            setOpenModalEdit(true);

                          }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
                            <PenLine size={14}/>
                          </button>
                          <button onClick={() => {
                                            setDataDeactivate([{user_id: row.user_id, is_active: row.is_active}]);
                                            setOpenModalDelete(true);
                                          }}
                                  className={`p-1.5 rounded-lg text-slate-400 ${ row.is_active ? `hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800` : `hover:text-emerald-500 hover:bg-emerald-100/60 dark:hover:bg-slate-800`}  transition`}>
                            { row.is_active ? (
                              <CircleSlash size={14}/>
                            ) : (
                              <Activity size={14}/>
                            )}
                          </button>
                          {((row.role === "admin" && Number(user.metadata.totalDataAdmin) > 1) || (row.role === "teknisi")) && (
                            <button onClick={() => {
                                        const targetRole = row.role === "teknisi" ? "admin" : "teknisi";
                                        setDataChange({ data: row, changeToRole: targetRole });
                                        setopenModalConfirmChangeRole(true);
                                      }}
                                    className={`p-1.5 rounded-lg text-slate-400 ${row.role === "admin" ? `hover:text-yellow-600 hover:bg-yellow-100/60 dark:hover:bg-slate-800` : `hover:text-green-600 hover:bg-green-100/60 dark:hover:bg-slate-800`}  transition`}>
                              {row.role === "teknisi" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
                            </button>
                          )}
                        
                        </div>
                      ) }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">Menampilkan {user?.data?.length} entri</span>
          <div className="flex gap-1">
            {Array.from({ length: user?.metadata?.totalPages }, (_, i)  => {
              const p = i+1;
            return (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === user?.metadata?.currentPage ? "bg-blue-600 dark:bg-slate-900 text-gray-300" : "text-slate-500 hover:bg-slate-100"}`}>
                {p}
              </button>
            )})}
          </div>
        </div>
    </div>
    </div>
    <ProdukAdd
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
    <ProdukDelete
      isOpen={openModalDelete}
      onClose={() => {
        setOpenModalDelete(false);
      }}
      dataDeactivate={dataActivateorDeactivateUser}
    />
  {dataChange && (
    <UserChangeRole
      isOpen={openModalConfirmChangeRole}
      onClose={() => {
        setopenModalConfirmChangeRole(false);
      }}
      dataToChange={dataChange} // TypeScript sekarang tahu dataChange pasti bukan null
    />
  )}
    </>
  );
}