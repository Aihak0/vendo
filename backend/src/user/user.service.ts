import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class UserService {
    constructor(private supabaseService: SupabaseService){}

    async findAll(page: number, limit: number, search?: string) {
      const supabase = this.supabaseService.getClient();
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      let query = supabase
        .from('user_profiles')
        .select(`*`, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false }); // Urutkan dari yang terbaru
  
      // Jika ada parameter search, filter berdasarkan nama produk
      if (search) {
        query = query.ilike('nama', `%${search}%`);
      }
  
      const { data, error, count } = await query;

      const { data: stats, error:errorStats } = await supabase
        .from('user_profiles')
        .select(`
          role
        `);

        let countAdmin;
        let countTeknisi
      if(!errorStats){
        countAdmin = stats.filter(u => u.role === 'ADMIN').length;
        countTeknisi = stats.filter(u => u.role === 'TEKNISI').length;
      }else{
        countAdmin = 0;
        countTeknisi = 0;
      }
      if (error) {
        // Gunakan InternalServerErrorException karena ini biasanya masalah query/database
        throw new InternalServerErrorException(error.message);
      }
      
      return {
        data,
          metadata: {
          totalData: count,
          totalDataAdmin: countAdmin,
          totalDataTeknisi: countTeknisi,
          currentPage: page,
          totalPages: Math.ceil((count ?? 0) / limit),
          pageSize: limit,
        }
      };
    }

    // user.service.ts
    async registerUser(userData: any) {
      const supabase = this.supabaseService.getClient();
      const { email, password, full_name, role } = userData;
      
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { full_name, role },
          email_confirm: true
        });
        
       if (authError || !authData.user) {
          throw new BadRequestException(authError?.message || 'Gagal membuat akun auth');
        }
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            nama: full_name,
            role: role,
            email: email,
            is_default_password: true
        });

        if (profileError) {
          // Di sini kelebihannya: Anda bisa handle jika profile gagal
          // Misalnya: hapus user auth yang baru dibuat agar tidak inkonsisten
          console.error("Gagal buat profil:", profileError.message);
          throw new InternalServerErrorException("Gagal membuat profil pengguna");
        }
   

        // return { message: 'User berhasil didaftarkan', user: authData.user };
       
        return { success: true, message: "berhasil menambahkan data" };
      } catch (err) {
          console.error("Critical Error:", err);
          throw err;
      }
    }
  async changeRole(id:string, changeTo: string){
    const supabase = this.supabaseService.getClient();

    const { data: dataChange, error: errChange } = await supabase
    .from("user_profiles") 
    .update({
      role: changeTo
    })
    .eq("user_id", id)
    .select()
    .single();
    if(errChange) new InternalServerErrorException("Gagal Mengubah role.");

    return { success: true, message: `berhasil Mengubah Role ${dataChange.nama}` };
  }
  async deactivateUser(body: any[]){
      const supabase = this.supabaseService.getClient();
  
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
      return {success: true,  message: `User Berhasil Dinonaktifkan` };
  }
}
