import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class TaskService {
    constructor(private supabaseService: SupabaseService) {}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, status?: string, prioritas?: string) {
        const supabase = this.supabaseService.getClient();
        try{
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            let query = supabase
            .from('task')
            .select(`*, mesin(id, nama), ...task_teknisi(ditugaskan_ke:user_profiles(user_id, nama, email, user_id, urlPasfoto))`)
            .range(from, to)
            console.log("prioritas", prioritas)

            if(status && status != "all"){
                query = query.eq("status", status)
            }
            if(prioritas && prioritas != "all"){
                query = query.eq("prioritas", prioritas)
            }
            if (sortKey){
                query = query.order(sortKey, { ascending: sortAsc });
            }else{
                query = query.order('created_at', { ascending: false });
            }

            if (search) {
                // Pastikan searchQuery sudah mengandung wildcard
                const queryPattern = `%${search}%`;

                // Gunakan format: "kolom.operator.value,kolom.operator.value"
                query = query.or(`mesin_nama.ilike.%${queryPattern}%,order_id.ilike.%${queryPattern}%`);
            }

            const { data, error } = await query;

            const { data: stats, error:errorStats , count} = await supabase
            .from('task')
            .select(`
                status
            `, { count: 'exact' });

            let countPending;
            let countInProgress;
            let countAssigned
            let countDone;
            let countCancelled;
            if(!errorStats){
                countPending = stats.filter(u => u.status === 'pending').length;
                countInProgress = stats.filter(u => u.status === 'in_progress').length;
                countAssigned = stats.filter(u => u.status === 'assigned').length;
                countDone = stats.filter(u => u.status === 'done').length;
                countCancelled = stats.filter(u => u.status === 'cancelled').length;
            }else{
                countPending=0;
                countInProgress=0;
                countAssigned=0;
                countDone=0;
                countCancelled=0;
            }
            if (error) {
                throw new InternalServerErrorException(error.message);
            }
            
            
            return {
                success: true,
                data,
                metadata: {
                    totalData: count,
                    totalDataPending: countPending,
                    totalDataInProgress: countInProgress,
                    totalDataAssigned: countAssigned,
                    totalDataDone: countDone,
                    totalDataCancelled: countCancelled,
                    currentPage: page,
                    totalPages: Math.ceil((count ?? 0) / limit),
                    pageSize: limit,
                }
            };
        }catch(err: any){
            // console.log(err);
            throw err;
            // return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
        }

    }
    async add(body: any){
        const supabase = this.supabaseService.getClient(); 
    
        const { judul, prioritas, ditugaskan_ke, mesin_id, tenggat_waktu, tipe_tugas } = body;
         
        try{
            const { data: dataInserttask, error: dbError } = await supabase
                .from('task') // Ganti dengan nama tabel Anda
                .insert({ 
                    judul, 
                    prioritas,
                    mesin_id,
                    tenggat_waktu,
                    tipe_tugas,
                    dibuat_oleh: "admin",
                    status: "assigned"
                })
                .select("id")
                .single();
             
            if (dbError) throw new BadRequestException(dbError.message);
            const { error: errorInsertTaskTeknisi } = await supabase
            .from('task_teknisi') // Ganti dengan nama tabel Anda
            .insert(
                ditugaskan_ke.map(teknisi_id => ( {
                    task_id: dataInserttask.id,
                    teknisi_id: teknisi_id
                }))
            )
            if (errorInsertTaskTeknisi) throw new BadRequestException(errorInsertTaskTeknisi.message);
            return { success: true, message: "berhasil menambahkan data task", code: 200};
        }catch(err: any){
            // console.log("errorneee",err);
            throw err;
        }
    }
    async update(id: string, body: any){
        const supabase = this.supabaseService.getClient(); 
        const { judul, prioritas, ditugaskan_ke, mesin_id, tenggat_waktu, tipe_tugas } = body;

        // console.log("id", id);
        try{
            const { data: oldData, error:errorOldData } = await supabase.from('task')
                .select('*, ...task_teknisi(ditugaskan_ke:user_profiles(nama, email, user_id, urlPasfoto))')
                .eq('id', id)
                .single();
            const { data: dataOldTaskTeknisi, error: errorOldTaskTeknisi } = await supabase.from('task_teknisi')
                .select('id, teknisi_id')
                .eq('task_id', id);

            if(errorOldData) throw new BadRequestException(errorOldData.message);
            if(errorOldTaskTeknisi) throw new BadRequestException(errorOldTaskTeknisi.message);

            let taskTeknisiToUpsert: any[] = [];
            const taskTeknsiisDelete = dataOldTaskTeknisi?.filter(old => !ditugaskan_ke.map(t => t).includes(old.teknisi_id)) || [];
            ditugaskan_ke.forEach((item) => {
                const old = dataOldTaskTeknisi?.find(old => old.teknisi_id === item);
                if (!old) {
                    taskTeknisiToUpsert.push({
                        task_id: id,
                        teknisi_id: item
                    });
                }
            });

            if(taskTeknisiToUpsert.length> 0){
                const { error: errorUpsertTaskTeknisi } = await supabase.from('task_teknisi')
                    .upsert(taskTeknisiToUpsert, { onConflict: 'task_id, teknisi_id' });
                if(errorUpsertTaskTeknisi) throw new BadRequestException(errorUpsertTaskTeknisi.message);
            }

            if(taskTeknsiisDelete.length > 0){
                const deleteIds = taskTeknsiisDelete.map(item => item.id);
                const { error: errorDeleteTaskTeknisi } = await supabase.from('task_teknisi')
                    .delete()
                    .in('id', deleteIds);
                if(errorDeleteTaskTeknisi) throw new BadRequestException(errorDeleteTaskTeknisi.message);
            }
            if(oldData.dibuat_oleh === 'system'){
                const { count, error } = await supabase
                    .from('task_teknisi')
                    .select('teknisi_id', { count: 'exact', head: true }) // Gunakan head: true jika hanya butuh angkanya saja
                    .eq('task_id', id);
                const totalTeknisi = count ?? 0;

                console.log("total teknisi", totalTeknisi);
                const { error: errorUpdateTask } = await supabase.from('task')
                    .update({ 
                        tenggat_waktu,
                        ...(!error && totalTeknisi != 0 && dataOldTaskTeknisi.length != 0 && { status: "assigned" })
                }).eq('id', id);

                if(errorUpdateTask) throw new BadRequestException(errorUpdateTask.message);
            }else{
                // console.log("masuk sini")
                const { error: errorUpdateTask } = await supabase.from('task')
                    .update({ 
                        judul, 
                        prioritas,
                        mesin_id,
                        tenggat_waktu,
                        tipe_tugas,
                    }).eq('id', id);

                if(errorUpdateTask) throw new BadRequestException(errorUpdateTask.message);
            }
          
        }catch(err: any){
            // console.log(err);
            throw err;
        }
    }

    async updateStatus(id: string, status: string){
        const supabase = this.supabaseService.getClient();
        try{
            if(status != 'canceled' && status != 'done' && status != 'in_progress' && status != 'assigned'){
                throw new BadRequestException("status tidak valid");
            }
            const { error } = await supabase.from('task')
                .update({ status })
                .eq('id', id);
            if (error) throw new BadRequestException(error.message);
            return { success: true, message: "berhasil memperbarui status task", code: 200};
        }catch(err: any){
            throw err;
        }
    }

    async delete(body: { id: string[] }){
        const supabase = this.supabaseService.getClient();
        try{
            const { error } = await supabase.from('task')
                .delete()
                .in('id', body.id);
            if (error) throw new BadRequestException(error.message);
            return { success: true, message: "berhasil menghapus task", code: 200};
        }catch(err: any){
            throw err;
        }
    }   
}
