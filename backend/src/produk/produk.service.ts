// produk.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import sharp from 'sharp';

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
  async add(body: any, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient(); 

    const { nama, harga } = body;
    
    try {
      if (!file) throw new BadRequestException('File gambar harus diunggah');
      if (!nama || !harga) throw new NotFoundException('Data tidak lengkap');
      
      const randomUUID = crypto.randomUUID();
      const folderName = randomUUID;
      const sanitizedNama = nama.replace(/\s+/g, '_');
      
      // Path untuk file original
      const filePath = `uploads/${folderName}/${sanitizedNama}.jpg`;
      // Path untuk file yang diperkecil (130x130)
      const reducedFilePath = `reduced/${folderName}/${sanitizedNama}.jpg`;

      // --- 1. UPLOAD FILE ORIGINAL (TIDAK BERUBAH) ---

      const originalJpgBuffer = await sharp(file.buffer)
        .jpeg({ quality: 90 }) // Convert ke JPG dengan kualitas tinggi
        .toBuffer();
        
      const { error: storageError } = await supabase.storage
        .from('gambar_produk')
        .upload(filePath, originalJpgBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (storageError) throw new BadRequestException(storageError.message);

      // --- 2. PROSES RESIZE & UPLOAD FILE REDUCED ---
      // Mengubah ukuran gambar menjadi 130x130 menggunakan sharp
      const reducedBuffer = await sharp(file.buffer)
        .resize(130, 130, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 }) // <-- WAJIB TAMBAHKAN INI untuk convert ke JPG asli
        .toBuffer();

      // Unggah gambar yang sudah diperkecil ke folder reduced/
      const { error: reducedStorageError } = await supabase.storage
        .from('gambar_produk')
        .upload(reducedFilePath, reducedBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (reducedStorageError) throw new BadRequestException(reducedStorageError.message);

      // --- 3. AMBIL PUBLIC URL FILE ORIGINAL ---
      const { data: urlData } = supabase.storage
        .from('gambar_produk')
        .getPublicUrl(filePath);

      const { data: reducedUrlData } = supabase.storage
        .from('gambar_produk')
        .getPublicUrl(reducedFilePath);

      // --- 4. SIMPAN METADATA KE DATABASE ---
      const { error: dbError } = await supabase
        .from('produk')
        .insert({ 
            id: randomUUID,
            nama: nama, 
            harga: Number(harga), 
            img_url: urlData.publicUrl, // Menyimpan URL original (bisa diganti reduced jika mau)
            reduced_img: reducedUrlData.publicUrl // Menyimpan URL gambar yang diperkecil
          })
        .select();

      if (dbError) throw new BadRequestException(dbError.message);
      
      return { success: true, message: "berhasil menambahkan data Produk", code: 200};
      
    } catch(err: any) {
      throw err;
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
      let finalReducedImageUrl = existingProduct.reduced_img;

      if (file) {
        const filePath = `uploads/${id}/${nama.replace(/\s+/g, '_')}.jpg`;      
        const BUCKET_NAME = 'gambar_produk';
        const oldImgPath = existingProduct.img_url?.split(`${BUCKET_NAME}/`)[1] ?? null;
        const oldReducedImgPath = existingProduct.reduced_img?.split(`${BUCKET_NAME}/`)[1] ?? null;
        const reducedFilePath = `reduced/${id}/${nama.replace(/\s+/g, '_')}.jpg`;
        if(oldImgPath){
          const { error : errorRemoveOldImg } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([oldImgPath]);
          
          if(errorRemoveOldImg){
            throw new NotFoundException(errorRemoveOldImg.message);
          }
        }

        if(oldReducedImgPath){
          const { error : errorRemoveOldReducedImg } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([oldReducedImgPath]);
          
          if(errorRemoveOldReducedImg){
            throw new NotFoundException(errorRemoveOldReducedImg.message);
          }
        }
        
        const originalJpgBuffer = await sharp(file.buffer)
        .jpeg({ quality: 90 }) // Convert ke JPG dengan kualitas tinggi
        .toBuffer();

        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, originalJpgBuffer, {
            contentType: 'image/jpeg',
            upsert: true, // Gunakan true agar bisa menimpa jika nama sama
          });

        if (storageError) throw new InternalServerErrorException(storageError.message);
          const reducedBuffer = await sharp(file.buffer)
          .resize(130, 130, { fit: 'cover', position: 'center' })
          .jpeg({ quality: 80 }) // <-- WAJIB TAMBAHKAN INI untuk convert ke JPG asli
          .toBuffer();

        // Unggah gambar yang sudah diperkecil ke folder reduced/
        const { error: reducedStorageError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(reducedFilePath, reducedBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

      if (reducedStorageError) throw new BadRequestException(reducedStorageError.message);

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
        const { data: reducedUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(reducedFilePath);

        finalImageUrl = urlData.publicUrl;
        finalReducedImageUrl = reducedUrlData.publicUrl;
      }

      // 3. Update data di database

      const now = new Date();
      const { error: dbError } = await supabase
        .from('produk')
        .update({
          ...(nama != existingProduct.nama && {nama}),
          ...(hargaNumber != existingProduct.harga && {harga: hargaNumber}),
          ...(file && {img_url: finalImageUrl, reduced_img: finalReducedImageUrl}),
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