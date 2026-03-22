// produk.service.ts
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ProdukService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(search?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('produk')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

    // Jika ada parameter search, filter berdasarkan nama produk
    if (search) {
      query = query.ilike('nama', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      // Gunakan InternalServerErrorException karena ini biasanya masalah query/database
      throw new InternalServerErrorException(error.message);
    }
    
    return data;
  }
  async add(body: any, file: Express.Multer.File){
     const supabase = this.supabaseService.getClient();
     if (!file) throw new BadRequestException('File gambar harus diunggah');

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('gambar_produk') // Ganti dengan nama bucket Anda
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) throw new BadRequestException(storageError.message);

    // 2. Dapatkan Public URL
    const { data: urlData } = supabase.storage
      .from('gambar_produk')
      .getPublicUrl(filePath);

    // 3. Simpan Metadata ke Database
    const { data, error: dbError } = await supabase
      .from('produk') // Ganti dengan nama tabel Anda
      .insert({ 
          nama: body.nama, 
          harga: Number(body.harga), 
          img_url: urlData.publicUrl 
        })
      .select();

    if (dbError) throw new BadRequestException(dbError.message);

    return data;
  }

  
  async update(id: string, body: any, file?: Express.Multer.File) {
  const supabase = this.supabaseService.getClient();

  // 1. Ambil data lama untuk mendapatkan URL gambar lama (opsional, jika ingin hapus file lama)
  const { data: existingProduct, error: fetchError } = await supabase
    .from('produk')
    .select('img_url')
    .eq('id', id)
    .single();

  if (fetchError || !existingProduct) {
    throw new BadRequestException('Produk tidak ditemukan');
  }

  let finalImageUrl = existingProduct.img_url;

  // 2. Jika ada file baru diunggah, proses upload
  if (file) {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;
    const BUCKET_NAME = 'gambar_produk';

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Gunakan true agar bisa menimpa jika nama sama
      });

    if (storageError) throw new InternalServerErrorException(storageError.message);

    // Dapatkan URL gambar baru
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    finalImageUrl = urlData.publicUrl;

    /** * OPSIONAL: Hapus file lama di storage agar tidak menumpuk sampah
     * Anda perlu memparsing filePath lama dari img_url jika ingin melakukan ini.
     */
  }

  // 3. Update data di database
  const { data, error: dbError } = await supabase
    .from('produk')
    .update({
      nama: body.nama,
      harga: Number(body.harga),
      img_url: finalImageUrl,
    })
    .eq('id', id) // Filter berdasarkan ID produk yang diedit
    .select();

  if (dbError) throw new BadRequestException(dbError.message);

  return data;
}
  async delete(body: { id: string[] }) {
    const supabase = this.supabaseService.getClient();

    if (!body.id || body.id.length === 0) {
      throw new BadRequestException('ID produk tidak boleh kosong');
    }

    // Gunakan .in() untuk menghapus semua ID dalam satu array sekaligus
      const { error } = await supabase
        .from("produk")
        .update({
          is_active: false
        })
        .in('id', body.id); // Menghapus baris yang ID-nya ada di dalam array body.id

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Produk berhasil dihapus' };
  }
}