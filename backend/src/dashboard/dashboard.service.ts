import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import dayjs from 'node_modules/dayjs';
import { SupabaseService } from 'src/supabase/supabase.service';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class DashboardService {
    constructor(private supabaseService: SupabaseService){}

    async getDataDashboard(filter: string, dari?: Date, sampai?: Date){
        const supabase = this.supabaseService.getClient()
        
        const now = dayjs().tz("Asia/Jakarta");
    
        let startDate, endDate;
        if(filter === "custom"){
            startDate = dayjs.tz(dari, "Asia/Jakarta").startOf('day').format();
            endDate = dayjs.tz(sampai, "Asia/Jakarta").add(1, "day").startOf('day').format();
        }
        if(filter === "hari"){
            startDate = dayjs().startOf('week').format();
            endDate = dayjs().endOf('week').add(1, 'day').format();
        }
        if(filter === "minggu"){
            startDate = dayjs().startOf('month').format();
            endDate = dayjs().endOf('month').format();
        }
        if(filter === "bulan"){ 
            startDate = dayjs().startOf('year').format();
            endDate = dayjs().add(1, "year").startOf('year').format();
        }
        if(filter === "tahun"){
            endDate = dayjs().add(1, "year").startOf('year').format();
            startDate = dayjs().subtract(4, 'year').startOf('year').format();
        }
        const { data: dataTransaksiSummary, error: errTransaksiSummary } = await supabase.rpc('get_transaksi_summary', {
            p_end: endDate,
            p_priode: filter === "custom" ? "hari" : filter,
            p_start: startDate,
        })
    
    
        if (errTransaksiSummary || (dataTransaksiSummary && dataTransaksiSummary.success === false)) {
            throw new InternalServerErrorException(errTransaksiSummary?.message || errTransaksiSummary?.message || "Gagal mengambil data summary");
        }

        const { data: dataLog, error: errLog} = await supabase
          .from('log_mesin')
          .select(`*, mesin!inner(*)`, { count: 'exact' })
          .range(0, 5)
          .order('created_at', { ascending: false }); 

        if(errLog){
            throw new InternalServerErrorException(errLog.message || "Gagal Mengambil datalog");
        }

        const { data: dataMesin, error: errMesin } = await supabase
        .from('mesin')
        .select("id, nama, status, latitude, longitude, user_profiles(nama, email, urlPasfoto)");
        
        if(errMesin){
            throw new InternalServerErrorException(errMesin.message || "Gagal Mengambil datalog");
        }
        
        return{
            data_summary: dataTransaksiSummary,
            data_log: dataLog,
            data_mesin: dataMesin
        }
    }
}
