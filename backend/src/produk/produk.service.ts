// produk.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ProdukService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(page?: number, limit?: number, sortAsc?: boolean, sortKey?: string, search?: string, isActive?: string) {
    const supabase = this.supabaseService.getClient();
    try{

      let query = supabase
        .from('produk')
        .select('*')
       
      if(page && limit){
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to)
      }
      if(isActive && isActive != "all"){
        const aktif = isActive === "true";
        query = query.eq("is_active", aktif)
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

      if (error) {
        // Gunakan InternalServerErrorException karena ini biasanya masalah query/database
        throw new InternalServerErrorException(error.message);
      }
      
      const { data: stats, error:errorStats, count } = await supabase
      .from('produk')
      .select(`is_active`, { count: 'exact' });

      let countIsActive, countIsNonActive;
      if(!errorStats){
        countIsActive = stats.filter(u => u.is_active === true).length;
        countIsNonActive = stats.filter(u => u.is_active === false).length;
      }else{
        countIsActive = 0;
        countIsNonActive = 0;
      }
      return { 
        success: true,
        data,
        metadata: {
          totalData: count,
          totalIsActive: countIsActive,
          totalIsNonActive: countIsNonActive,
          currentPage: Number(page),
          totalPages: Math.ceil((count ?? 0) / (limit ?? 0)),
          pageSize: limit,
        }
      };
    }catch(err: any){

      throw err;
      // return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status};
    }
    
  }
  async add(body: any, file: Express.Multer.File){
    const supabase = this.supabaseService.getClient(); 

    const { nama, harga } = body;
     
    
    try{
      if (!file) throw new BadRequestException('File gambar harus diunggah');
      if (!nama || !harga) throw new NotFoundException('Data tidak lengkap');
      const randomUUID = crypto.randomUUID();
      const fileExt = file.originalname.split('.').pop();
      const folderName = randomUUID;
      const filePath = `uploads/${folderName}/${nama.replace(/\s+/g, '_')}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('gambar_produk') // Ganti dengan nama bucket Anda
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) throw new BadRequestException(storageError.message);

      const { data: urlData } = supabase.storage
        .from('gambar_produk')
        .getPublicUrl(filePath);

      // 3. Simpan Metadata ke Database
      const { error: dbError } = await supabase
        .from('produk') // Ganti dengan nama tabel Anda
        .insert({ 
            id: randomUUID,
            nama: nama, 
            harga: Number(harga), 
            img_url: urlData.publicUrl 
          })
        .select();

      if (dbError) throw new BadRequestException(dbError.message);
      return { success: true, message: "berhasil menambahkan data Produk", code: 200};
    }catch(err: any){
      throw err;
      // return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
    }
  }

  
  async update(id: string, body: any, file?: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();

    const {nama, harga} = body;

    const hargaNumber = Number(harga);
    
    try{
      if(!id || !nama || !harga){
        throw new NotFoundException("Data tidak lengkap");
      }
      const { data: existingProduct, error: fetchError } = await supabase
        .from('produk')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingProduct) {
        throw new BadRequestException('Produk tidak ditemukan');
      }

      let finalImageUrl = existingProduct.img_url;

      if (file) {
        const fileExt = file.originalname.split('.').pop();
        const filePath = `uploads/${id}/${nama.replace(/\s+/g, '_')}.${fileExt}`;      
        const BUCKET_NAME = 'gambar_produk';
        const oldImgPath = existingProduct.img_url.split(`${BUCKET_NAME}/`)[1];

        const { error : errorRemoveOldImg } = await supabase
          .storage
          .from(BUCKET_NAME)
          .remove([oldImgPath]);
        
        if(errorRemoveOldImg){
          throw new NotFoundException(errorRemoveOldImg.message);
        }

        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true, // Gunakan true agar bisa menimpa jika nama sama
          });

        if (storageError) throw new InternalServerErrorException(storageError.message);

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      // 3. Update data di database

      const now = new Date();
      const { error: dbError } = await supabase
        .from('produk')
        .update({
          ...(nama != existingProduct.nama && {nama}),
          ...(hargaNumber != existingProduct.harga && {harga: hargaNumber}),
          ...(file && {img_url: finalImageUrl}),
          updated_at: now.toISOString()
          
        })
        .eq('id', id) // Filter berdasarkan ID produk yang diedit
        .select();

      if (dbError) throw new BadRequestException(dbError.message);

      return {success: true, message: "berhasil Memperbarui data", code: 200};
    }catch(err: any){
      throw err;
      // return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
    }
  }

  async activateANDDeactivate(body: any[]) {
    const supabase = this.supabaseService.getClient();

    try{
      if (!body || body.length === 0) {
        throw new BadRequestException('ID produk tidak boleh kosong');
      }
      const adaYangAktif = body.some(item => item.is_active === true);  
      const adaYangNonAktif = body.some(item => item.is_active === false);
    // Gunakan .in() untuk menghapus semua ID dalam satu array sekaligus
      const updatePromises = body.map(row => 
          supabase
            .from("produk")
            .update({ is_active: !row.is_active })
            .eq('id', row.id)
        );
        const results = await Promise.all(updatePromises);
  
        const hasError = results.some(res => res.error !== null);
        if (hasError) {
          throw new BadRequestException("Ada beberapa data yang gagal diupdate");
        }
      const pesan = `Berhasil ${adaYangAktif && "Menonaktifkan"} ${adaYangAktif && adaYangNonAktif && "dan"} ${adaYangNonAktif && "Mengaktifkan"} produk`
      return {success: true, message: pesan, code: 200};
    }catch(err: any){
        throw err;
      //  return {success: false, message: err.response.message || "Kegagalan Sistem", code: err.status}
    }
    
  }
  
}