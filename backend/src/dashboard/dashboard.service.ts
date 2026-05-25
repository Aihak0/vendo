import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs'; // Berubah: bersihkan path import
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DatabaseService } from 'src/database/database.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class DashboardService {
    constructor(private databaseService: DatabaseService){}

    async getDataDashboard(filter: string, dari?: Date, sampai?: Date){
        const db = this.databaseService.getClient(); // Asumsi: mengembalikan objek Pool dari 'pg'
        
        // Catatan: Jika ingin menggunakan zona Jakarta secara konsisten, 
        // pastikan set up timezone di objek dayjs di bawah ini jika diperlukan.
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

        const p_end = endDate;
        const p_priode = filter === "custom" ? "hari" : filter;
        const p_start = startDate;

        // 1. Query Transaksi Summary (Memanggil Stored Function)
        const queryGetTransaksiSummary = `
            SELECT * FROM get_transaksi_summary(
                p_end => $1,
                p_priode => $2,
                p_start => $3
            );
        `;
        
        // 2. Query Logs (Mengganti sintaks Supabase menjadi INNER JOIN dan LIMIT)
        // Sesuaikan nama kolom join (misal: log_mesin.mesin_id = mesin.id)
        const queryGetLogs = `
            SELECT log_mesin.*, mesin.nama as nama_mesin, mesin.status as status_mesin 
            FROM log_mesin 
            INNER JOIN mesin ON log_mesin.mesin_id = mesin.id
            ORDER BY log_mesin.created_at DESC 
            LIMIT 5;
        `;
        
        // 3. Query Mesin (Memperbaiki typo user_profiles)
        const queryGetMesin = `
            SELECT 
                mesin.id, 
                mesin.nama, 
                mesin.status, 
                mesin.latitude, 
                mesin.longitude, 
                user_profiles.nama AS nama_teknisi, 
                user_profiles.email, 
                user_profiles."urlPasfoto" 
            FROM mesin 
            INNER JOIN mesin_teknisi ON mesin.id = mesin_teknisi.mesin_id 
            INNER JOIN user_profiles ON mesin_teknisi.teknisi_id = user_profiles.user_id;
        `;
        
        // Eksekusi semua query ke Postgres lokal
        // Menggunakan Promise.all agar berjalan paralel dan lebih cepat
        const [resSummary, resLogs, resMesin] = await Promise.all([
            db.query(queryGetTransaksiSummary, [p_end, p_priode, p_start]),
            db.query(queryGetLogs),
            db.query(queryGetMesin)
        ]);
    
        return {
            data_summary: resSummary.rows,
            data_log: resLogs.rows,
            data_mesin: resMesin.rows
        };
    }
}