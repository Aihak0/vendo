
import { ChartSpline, Cannabis, Calendars, CalendarDays, CalendarSync, CalendarCog, ChevronLeft, ChevronRight, LogsIcon, SearchIcon, ShoppingBasket, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogMesin, getSumary } from '../../services/api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { type DateValueType } from "react-tailwindcss-datepicker";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import isoWeek from 'dayjs/plugin/isoWeek';

import { FilterDropdown } from '../../components/ui/dropdown/Dropdown';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)


import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from 'dayjs/plugin/advancedFormat';


import "dayjs/locale/id"; 

const filterLogStyles = {
  info:    { badge: "bg-blue-100 text-blue-800 dark:bg-gray-400/40 dark:text-gray-200 dark:border dark:border-gray-500",   dot: "bg-blue-400",   label: "Info" },
  online: { badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/40 dark:text-emerald-200 dark:border dark:border-emerald-500", dot: "bg-emerald-500",  label: "Online" },
  success: { badge: "bg-green-100 text-green-800 dark:bg-green-400/40 dark:text-green-200 dark:border dark:border-green-500", dot: "bg-green-500",  label: "Berhasil" },
  maintenance: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/40 dark:text-amber-200 dark:border dark:border-amber-500", dot: "bg-amber-400",  label: "Perawatan" },
  fail:   { badge: "bg-red-100 text-red-800 dark:bg-red-400/40 dark:text-red-200 dark:border dark:border-red-500",     dot: "bg-red-500",    label: "Fail" },
  offline:   { badge: "bg-red-100 text-red-800 dark:bg-red-400/40 dark:text-red-200 dark:border dark:border-red-500",     dot: "bg-red-500",    label: "Offline" },
  process:   { badge: "bg-gray-100 text-gray-600 dark:bg-gray-400/40 dark:text-gray-200 dark:border dark:border-gray-500",   dot: "bg-gray-400",   label: "Proses" },
  all:   { badge: "",   dot: "",   label: "Semua Status" },
};

const filterSumStyles = {
  hari: { label: "Hari ini", icon: <Cannabis size={14} className='text-gray-400' /> },
  minggu: { label: "Minggu ini", icon: <CalendarDays size={14} className='text-gray-400' /> },
  bulan: { label: "Bulan ini", icon: <Calendars size={14} className='text-gray-400' /> },
  tahun: { label: "Tahun ini", icon: <CalendarSync size={14} className='text-gray-400' /> },
  custom: { label: "Custom", icon: <CalendarCog size={14} className='text-gray-400' /> },
}
const filterSumTypes = ["hari", "minggu", "bulan", "tahun", "custom"];

const filterLogTypes = ["all", "info", "success", "maintenance", "fail", "process", "online", "offline"];

export default function Home() {
  dayjs.extend(isoWeek);
  dayjs.extend(utc);
  dayjs.extend(advancedFormat);
  dayjs.extend(timezone);


  dayjs.locale('id');

  const isDark = useIsDark()

  const { profile, loading: loadingAuth } = useAuth();
  const [activeLogFilter, setActiveLogFilter] = useState("all");

  const [activeSumFilter, setActiveSumFilter] = useState("bulan");

  const [summaryRange, setSummaryRange] = useState<DateValueType>({
        startDate: new Date(),
        endDate: new Date()
    });



  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);
  
  const [searchLogMesin, setSearchLogMesin] = useState("");

  const [dataSummarySekarang, setDataSummarySekarang] = useState<any>(null);
  const [dataSummaryKemarin, setDataSummaryKemarin] = useState<any>(null);

  const [labelChart, setLabelChart] = useState<string[]>([]);
  const [valueChart, setValueChart] = useState<number[]>([]);

  const yLabels = Array(7).fill(null);
  const xLabels = Array(11).fill(null);


  const { data: logMesin, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['logMesin', searchLogMesin, page, pageSize], 
    queryFn: () => getLogMesin(searchLogMesin, page, pageSize),
  });
  const { data: dataSummary, isLoading: isLoadingSummary, error: errorSummary } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['summary', summaryRange, activeSumFilter === 'custom' ? 'all-custom' : activeSumFilter], 
    queryFn: () => getSumary(activeSumFilter, summaryRange?.startDate, summaryRange?.endDate),
  });

  const chartData = {
    labels : labelChart,
    datasets: [
      {
        label: 'Omzet',
        data: valueChart,
        backgroundColor: '#2B7FFF',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => formatIDR.format(ctx.parsed.y) },
      },
    },
    scales: {
      x: {  grid: { display: false },
            ticks: { color: isDark ? '#99A1AF' : '#344054' },       // warna label X
            border: { color: isDark ? '#667085' : '#98A2B3' }, },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? '#364153' : '#E2E8F0' },  
        ticks: { 
          callback: (v: any) => formatIDR.format(v),
          color: isDark ? '#99A1AF' : '#344054',
        },
        border: { color: isDark ? '#667085' : '#98A2B3' },      
      },
    },
  }

  const formatIDR = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    // Jika ingin menghilangkan ,00 di belakang:
    // minimumFractionDigits: 0, 
  });
  
  useEffect(() => {
    console.log('dataSekarang:', dataSummarySekarang)
  }, [dataSummarySekarang])

  const getPrevKey = (activeSumFilter :any) => {
    const now = dayjs().tz("Asia/Jakarta");

    switch (activeSumFilter) {
      case "hari":
        return now.subtract(1, "day").format("YYYY-MM-DD");

      case "minggu":
        return now.subtract(1, "week").format("YYYY-[W]WW");

      case "bulan":
        return now.subtract(1, "month").format("YYYY-MM");

      case "tahun":
        return now.subtract(1, "year").format("YYYY");

      default:
        return now.format("YYYY-MM");
    }
  };

  const hitungPersen = (sekarang: number, kemarin: number) => {
    if (kemarin === 0) {
      if (sekarang === 0 ) return "0%"; // tetap 0% jika keduanya 0
      return `+100%`; // naik dari 0 → dianggap 100%
    }
    const angka = Math.round(((sekarang - kemarin) / kemarin) * 100);

    const prefix = angka > 0 ? "+" : "";
    return `${prefix}${angka}%`;
  };

  useEffect(() => {
    if (!dataSummary) return;

    const formatMap: Record<string, string> = {
      hari: "YYYY-MM-DD",
      minggu: "GGGG-[W]WW", // Format minggu standar ISO
      bulan: "YYYY-MM",
      tahun: "YYYY"
    };

    const currentFormat = formatMap[activeSumFilter] || "YYYY-MM";

    console.log("currentFormat:", currentFormat);
    const prevKey = getPrevKey(activeSumFilter);

    const nowKey = dayjs()
      .tz("Asia/Jakarta")
        .format(currentFormat);;

      console.log("prevKey:", prevKey);
      console.log("nowKey:", nowKey);
    
    
      const sortedEntries = Object.entries(dataSummary).sort(([a], [b]) =>
        a.localeCompare(b)
      );
      setLabelChart(sortedEntries.map(([key]) => key));
      setValueChart(Object.values(dataSummary as Record<string, any>).map((value) => value.totalOmset || 0));

      if(activeSumFilter === "custom"){
        const data:Record<string, { totalOmset: number;
          totalTransaksi: number;
          totalTransaksiGagal: number;
          totalTransaksiBerhasil: number;}> = dataSummary;
      const result = Object.values(data).reduce<Record<string, number>>(
        (acc, curr) => {
          Object.keys(curr).forEach((key) => {
            const k = key as keyof typeof curr;
            acc[k] = (acc[k] || 0) + curr[k];
          });
          return acc;
        },
        {}
      );

        setDataSummarySekarang(result);
      }else{
        setDataSummarySekarang(dataSummary[nowKey] || null);
      }

      setDataSummaryKemarin(dataSummary[prevKey] || null);
  }, [dataSummary]);

  return (
    <div className="p-6">
      
        <div className='flex items-center justify-between mb-10'>

          { loadingAuth ? (
            <div className="bg-white dark:bg-slate-800 py-3 px-15 rounded-lg animate-pulse"/>

          ) : (
            <h1 className="text-2xl font-bold  dark:text-gray-200">Hai {profile.nama} 👋</h1>

          )}

          <div className="flex gap-2 items-center">
            {activeSumFilter === "custom" && (
              <div className="flex items-center gap-2 px-4 py-0.5 rounded-lg border border-blue-100 bg-white dark:bg-slate-800 dark:border-blue-950">
                <Calendar className="w-4 h-4 text-gray-400" />
                {/* DatePicker di sini */}
                <DatePicker
                    selectsRange
                  startDate={summaryRange?.startDate}
                  endDate={summaryRange?.endDate}
                  className="bg-transparent rounded-lg outline-none text-xs text-gray-700 dark:text-gray-300 w-full "
                  wrapperClassName="w-full"

                  onChange={(dates: [Date | null, Date | null]) => {
                    const [start, end] = dates;
                    setSummaryRange({
                      startDate: start,
                      endDate: end
                    });
                  }}
                />
            </div>
            )}
              <FilterDropdown activeFilter={activeSumFilter} onChange={setActiveSumFilter}  style={filterSumStyles} filter={filterSumTypes} buttonStyle='border border-blue-100 dark:border-blue-950 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 text-gray-700 dark:text-gray-400 dark:hover:bg-slate-800/70'/>
          
          </div> 
        </div>
    
      {/* Placeholder grid seperti dashboard biasa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
          <div className="h-100 grid grid-rows-2 grid-flow-col gap-8">
            <div className='relative bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-950 rounded-lg flex-1 p-7'>
            
              <div className='flex gap-2 font-bold text-blue-500 dark:text-gray-500 relative items-center mb-9 z-10'>
                <ChartSpline  size={20}/>
                <h2 className='text-lg ' >OMSET</h2> 
              </div>
              {errorSummary && (
                  <div className="rounded-lg  mb-2 bg-blue-50 dark:bg-slate-700/80 w-40">
                      Gagal Memuat Data: {(error as any).message}
                  </div>
                
                )}
              { dataSummarySekarang ? (
                <>
                  <p className="text-2xl text-gray-700 dark:text-gray-300">{dataSummarySekarang && formatIDR.format(dataSummarySekarang.totalOmset || 0)}</p>
                  <span className="absolute top-3 right-5 text-[5.5rem] font-black text-blue-50 dark:text-slate-900 leading-none select-none pointer-events-none z-0"> { dataSummaryKemarin && hitungPersen(dataSummarySekarang.totalOmset, dataSummaryKemarin.totalOmset)}</span>
                  <p className='text-slate-300 dark:text-gray-500x'>Bulan ini</p>
                </>
                
              ): (
                <>
                  <div className="rounded-lg h-7 mb-2 animate-pulse bg-blue-50 dark:bg-slate-700/80 w-40"/>
                  <div className='rounded-lg h-4 animate-pulse bg-blue-50 dark:bg-slate-700/80 w-20'/>
                </>
              )}
              
             
            </div>
            <div className='relative bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-950 rounded-lg flex-1 p-7'>
              <div className='flex gap-2 font-bold text-blue-500 dark:text-gray-500 relative items-center mb-9 z-10'>
                <ShoppingBasket  size={20}/>
                <h2 className='text-lg ' >ORDER</h2> 
          
              </div>
               {errorSummary && (
                  <div className="rounded-lg  mb-2 bg-blue-50 dark:bg-slate-700/80 w-40">
                      Gagal Memuat Data: {(error as any).message}
                  </div>
                
                )}
                { dataSummarySekarang ? (
                <>
                  <p className="text-2xl text-gray-700 dark:text-gray-300">{dataSummarySekarang && dataSummarySekarang.totalTransaksi || 0}</p>
                  <span className="absolute top-3 right-5 text-[5.5rem] font-black text-blue-50 dark:text-slate-900 leading-none select-none pointer-events-none z-0"> { dataSummaryKemarin && hitungPersen(dataSummarySekarang.totalTransaksi, dataSummaryKemarin.totalTransaksi)}</span>
                  <p className='text-slate-300 dark:text-gray-500x'>Bulan ini</p>
                </>
                
              ): (
                <>
                  <div className="rounded-lg h-7 mb-2 animate-pulse bg-blue-50 dark:bg-slate-700/80 w-40"/>
                  <div className='rounded-lg h-4 animate-pulse bg-blue-50 dark:bg-slate-700/80 w-20'/>
                </>
              )}
            </div>
         
          </div>
          <div className="bg-white border-2 border-blue-100 dark:border-blue-950 dark:bg-slate-800 rounded-lg flex flex-col h-100 items-center justify-center col-span-2 p-6">
            <div className='flex  text-gray-900 dark:text-gray-300 justify-between items-center mb-5 w-full'>
              <div className='flex items-center gap-2 text-blue-500 dark:text-gray-300'>
                <LogsIcon size={19} />
                <h4 className=" font-bold text-xl ">Log</h4>
              </div>
              <div className='flex items-center gap-2 items-stretch'>
                  <FilterDropdown activeFilter={activeLogFilter} onChange={setActiveLogFilter}  style={filterLogStyles} filter={filterLogTypes}/>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                    <SearchIcon size={17} className='text-gray-400 dark:text-gray-400' />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari log..."
                    value={searchLogMesin}
                    onChange={(e) => setSearchLogMesin(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-blue-50/50 dark:bg-slate-900 dark:border-slate-700 dark:placeholder:text-gray-400 dark:focus:ring-blue-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-48 transition"
                    />
                </div>

              </div>
            </div>
            <div className="bg-blue-50/50 flex-1 dark:bg-slate-900 overflow-hidden  h-fit w-full relative">
              <div className="max-h-[420px] overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-12 text-sm text-gray-400">
                    Memuat log...
                  </div>
                  ) : (
                    logMesin.data.length === 0 ? (
                      <div className="text-center py-12 text-sm text-gray-400">
                        Tidak ada log yang cocok.
                      </div>
                    ) : (
                      logMesin.data.map((log: any) => <LogRow key={log.id} log={log} />)
                    )
                  )}
                  {error && (
                
                    <div className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                      Gagal Memuat Data: {(error as any).message}
                    </div>
                  )}
              </div>
              {isLoading ? null : (
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-blue-200 dark:border-slate-700 flex-wrap absolute bottom-0 left-0 right-0 bg-blue-100/50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                      
                      {logMesin.data.length === 0 ? "0 entries" : `${logMesin.metadata.awalEntri}–${logMesin.metadata.akhirEntri} dari ${logMesin.metadata.totalData}`}
                 
                  </span>
                 
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Per halaman</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                        }}
                        className="text-xs border border-blue-200 dark:border-slate-700 rounded-md px-2 py-1 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        {[5, 10, 20, 30].map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                        ))}
                        <option key={logMesin.metadata.totalData} value={logMesin.metadata.totalData}>
                            Semua
                        </option>
                      </select>
                    </div>

                </div>
    
                <Pagination page={page} totalPages={logMesin.metadata.totalPages} onPageChange={setPage} />
                
              </div>
              )}
            </div>
          </div>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-950 rounded-lg items-center justify-center p-7">
        <h2 className="text-lg font-bold text-blue-500 dark:text-gray-300 mb-3">STATISTIK OMSET</h2>
          { isLoadingSummary ? (
            <div className="py-6">
            <div className="flex items-end gap-0 h-80 relative">

              
              <div className="flex flex-col justify-between h-full pr-3 pb-6">
                {yLabels.map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-3 rounded bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
              <div className="flex-1 flex flex-col relative">

                {/* Grid lines */}
                <div className="flex-1 flex flex-col justify-between border-l border-gray-200">
                  {yLabels.map((_, i) => (
                    <div key={i} className="w-full h-px bg-gray-200" />
                  ))}
                </div>
                <div className="flex justify-around pt-2">
                  {xLabels.map((_, i) => (
                    <div
                      key={i}
                      className="w-11 h-3 rounded bg-gray-200 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          ): (

              <div className="relative w-full min-w-0 h-90">
                <Bar key={isDark ? 'dark' : 'light'} data={chartData} options={options} />
              </div>
          )}
          

      </div>
    </div>

  );
}

function LogRow({ log }: any) {
  const style = filterLogStyles[log.tipe as keyof typeof filterLogStyles] || { badge: "bg-gray-100 text-gray-600 dark:bg-gray-400/40 dark:text-gray-200 dark:border dark:border-gray-500", dot: "bg-gray-400" };
  return (
    <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-blue-200 dark:border-gray-700 hover:bg-blue-100/50 dark:hover:bg-slate-950 transition-colors duration-100 last:border-b-0">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <span className="text-xs text-gray-400 font-mono pt-0.5 min-w-[68px] shrink-0">
        {dayjs(log.created_at).format('dddd, DD MMMM YYYY HH:mm')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${style.badge}`}>
            {log.tipe}
          </span>
          <span className="text-[12px] font-bold text-gray-400 dark:text-gray-400 font-mono truncate">{log.mesin.nama} :</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{log.payload.message}</p>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: any) {
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };
 
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-slate-700 text-blue-300 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft />
      </button>
 
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-md text-xs font-medium transition ${
              p === page
                ? "bg-blue-600 text-white dark:bg-slate-800 "
                : "border-blue-400 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
 
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-slate-700 text-blue-300 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight />
      </button>
    </div>
  );
}

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, { attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return isDark
}