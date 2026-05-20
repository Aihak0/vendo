import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Request } from 'express';

@Injectable()
export class UserService {
    constructor(private supabaseService: SupabaseService){}

    async findAll(page?: number, limit?: number, sortAsc?: boolean, sortKey?: string, search?: string, role?: string ) {
      const supabase = this.supabaseService.getClient();
      try{

        let query = supabase
          .from('user_profiles')
          .select(`*`)

          
        if(page && limit){ 
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to)
        }
        if(role && role != "all"){
          query = query.eq("role", role);
        }
        if (sortKey){
            query = query.order(sortKey, { ascending: sortAsc });
        }else{
            query = query.order('created_at', { ascending: false });
          }
        if (search) {
          query = query.ilike('nama', `%${search}%`);
        }
        
        const { data, error } = await query;
        
        const { data: stats, error:errorStats, count } = await supabase
          .from('user_profiles')
          .select(`
            role
          `, { count: 'exact' });
  
          let countAdmin;
          let countTeknisi
        if(!errorStats){
          countAdmin = stats.filter(u => u.role === 'admin').length;
          countTeknisi = stats.filter(u => u.role === 'teknisi').length;
        }else{
          countAdmin = 0;
          countTeknisi = 0;
        }
        if (error) {
          throw new InternalServerErrorException(error.message);
        }
        
        return {
          success: true,
          data,
          metadata: {
            totalData: count,
            totalDataAdmin: countAdmin,
            totalDataTeknisi: countTeknisi,
            currentPage: Number(page),
            totalPages: Math.ceil((count ?? 0) / (limit || 0)),
            pageSize: limit,
          }
        };
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }
    async getUserProfiles(id: string){
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if(error){
        throw new InternalServerErrorException(error.message || "Gagal mengambil data profile");
      }
      return data;
    }
    // user.service.ts 
    async registerUser(userData: any, pasFoto: Express.Multer.File) {
      const supabase = this.supabaseService.getClient();
      const { email, password, full_name, role } = userData;
      
      try {
        
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { full_name },
          app_metadata: { role: role },
          email_confirm: true
        });
        
        if (authError || !authData.user) {
          throw new BadRequestException(authError?.message || 'Gagal membuat akun auth');
        }
        
        let urlPasfoto = "";
        if(pasFoto){
          const fileExt = pasFoto.originalname.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `pasfoto/${authData.user.id}/${fileName}`;
          const {error: errorPasfoto} = await supabase.
          storage.from("gambar_private")
          .upload(filePath, pasFoto.buffer, {
            contentType: pasFoto.mimetype,
            upsert: false,
          })

          if (errorPasfoto) throw new BadRequestException(errorPasfoto.message);

          
          const { data: urlData } = supabase.storage
          .from('gambar_private')
          .getPublicUrl(filePath);

          urlPasfoto = urlData.publicUrl

          const updatedMetadata = {
            ...authData.user.user_metadata, 
            avatar_url: urlPasfoto
          };

          const { error } = await supabase.auth.admin.updateUserById(authData.user.id, {
            user_metadata: updatedMetadata
          });

          if (error) throw new InternalServerErrorException("gagal mengupdate user metadata");
        }
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            nama: full_name,
            role: role,
            email: email,
            is_default_password: true,
            urlPasfoto
        });
 
        if (profileError) {
    
          console.error("Gagal buat profil:", profileError.message);
          throw new InternalServerErrorException("Gagal membuat profil pengguna");
        }
   
       
        return { success: true, message: "berhasil menambahkan data", code: 200 };
      } catch (err: any) {
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }
    async editUser(id: string, userData: any, pasFoto?: Express.Multer.File){
      const supabase = this.supabaseService.getClient();
      const {nama, email, role} = userData;
      try{
        let urlPasfoto;
        if(pasFoto){
          const fileExt = pasFoto.originalname.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `pasfoto/${id}/${fileName}`;
          const { error: errorImage } = await supabase.storage
          .from("gambar_private").upload(filePath, pasFoto.buffer, {
            contentType: pasFoto.mimetype,
            upsert: false
          })

          if(errorImage){
            throw new InternalServerErrorException(errorImage.message, "Kegagalan Sistem");
          }

          const { data: dataImage } = supabase.storage.
          from("gambar_private")
          .getPublicUrl(filePath);

          urlPasfoto = dataImage.publicUrl;
        } 
        
        const { data: dataUpdateuserProfile, error: errUpdateUserProfule } = await supabase
        .from("user_profiles")
        .update({
          nama: nama,
          email: email,
          ...(pasFoto && { urlPasfoto:  urlPasfoto })
        })
        .eq("user_id", id)
        .select()
        .single();

        if(errUpdateUserProfule){
          throw new InternalServerErrorException(errUpdateUserProfule.message || "gagal Memperbarui data User")
        }

        const { data: user, error: fetchError } = await supabase.auth.admin.getUserById(id);
        if(fetchError) throw new InternalServerErrorException(fetchError.message || "Gagal Mengambil data User sebelumnya");
        const {error : errUpdateAuthUser } = await supabase.auth.admin.updateUserById(dataUpdateuserProfile?.user_id, {
          email: dataUpdateuserProfile.email,
          user_metadata: {
            ...user?.user?.user_metadata,
            full_name: dataUpdateuserProfile.nama,
            avatar_url: urlPasfoto
          }
        })
        if(errUpdateAuthUser) throw new InternalServerErrorException(errUpdateAuthUser.message || "Gagal Memperbarui info user");

        return { success: true, message: "berhasil mengubah data User", code: 200}
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
    }

    
    async updaetProfileByOwn(accessToken: string, id: string, req: Request,  nama?: string, password?: string, pasFoto?: Express.Multer.File ){
      const supabase = this.supabaseService.getClient();

      // 1. SET SESSION TERLEBIH DAHULU MENGGUNAKAN ACCESS TOKEN DARI FRONTEND
      // Ini krusial agar metode supabase.auth.updateUser() tahu sesi siapa yang sedang berjal
      try {
        let urlPasfoto: string | undefined;

        // Proses Upload Pas Foto
        if (pasFoto) {
          const fileExt = pasFoto.originalname.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `pasfoto/${id}/${fileName}`;

          const { error: errorPasfoto } = await supabase.storage
            .from("gambar_private")
            .upload(filePath, pasFoto.buffer, {
              contentType: pasFoto.mimetype,
              upsert: true,
            });

          if (errorPasfoto) throw new BadRequestException(errorPasfoto.message);

          const { data: urlData } = supabase.storage
            .from('gambar_private')
            .getPublicUrl(filePath);

          urlPasfoto = urlData.publicUrl;
        }

        // 2. SEKARANG INI AKAN BERJALAN AMAN TANPA ERROR "SESSION MISSING"
          if (password) {
            const userSupabase = this.supabaseService.getClientForUser(req);

            const { error: errUpdatePassword } = await userSupabase.auth.updateUser({ password });
            
          if (errUpdatePassword) {
            // GANTI InternalServerErrorException MENJADI BadRequestException
            throw new BadRequestException(errUpdatePassword.message);
          }
        }
        // Update data profil ke tabel user_profiles
        if (nama || urlPasfoto || password) {
          console.log("ga masuk sini?");
          const { error: errUpdateUser } = await supabase
            .from("user_profiles")
            .update({
              ...(nama && { nama }),
              ...(urlPasfoto && { urlPasfoto }),
              ...(password && { is_default_password: false }) // Matikan flag password default
            })
            .eq("user_id", id);

          if (errUpdateUser) {
            throw new InternalServerErrorException("Gagal mengubah data profil di database");
          }
        }

        return { success: true, message: "Berhasil Diperbarui", code: 200 };
      } catch (err: any) {
        console.error("DETAIL ERROR 400:", JSON.stringify(err, null, 2)); 
        throw err;
      }
    }
    async changeRole(id:string, changeTo: string){
      const supabase = this.supabaseService.getClient();
      try{
        const { data: dataChange, error: errChange } = await supabase
          .from("user_profiles") 
          .update({
            role: changeTo
          })
          .eq("user_id", id)
          .select()
          .single();
          
        if(errChange) new InternalServerErrorException("Gagal Mengubah role.");

        return { success: true, message: `berhasil Mengubah Role ${dataChange.nama}`, code:200 };
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }

    }
  async deactivateUser(body: any[]){
      const supabase = this.supabaseService.getClient();
      try{
        
        if (!body || body.length === 0) {
          throw new BadRequestException('Data Tidak Ditemukan');
        }
    
  
        // 2. Update satu per satu secara paralel
        const updatePromises = body.map(user => 
          supabase
            .from("user_profiles")
            .update({ is_active: !user.is_active })
            .eq('user_id', user.user_id)
        );
        const results = await Promise.all(updatePromises);
  
        const hasError = results.some(res => res.error !== null);
        if (hasError) {
          throw new BadRequestException("Ada beberapa data yang gagal diupdate");
        }
        return {success: true,  message: `User Berhasil Dinonaktifkan`, code: 200 };
      }catch(err: any){
        return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
      }
  }
  
}
