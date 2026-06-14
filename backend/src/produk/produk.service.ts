import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
// import * as path from 'path';
// import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { MinioService } from 'src/minio/minio.service';
import sharp from 'sharp';

@Injectable()
export class ProdukService {
  constructor(private databaseService: DatabaseService, private minioService: MinioService) {}

  async findAll(page?: number, limit?: number, sortAsc?: boolean, sortKey?: string, search?: string, isActive?: string) {
    const db = this.databaseService.getClient();
    try {
      const pageNum = page || 1;
      const limitNum = limit || 10;
      const { offset } = this.databaseService.getPaginationOffset(pageNum, limitNum);
      const orderDir = sortAsc ? 'ASC' : 'DESC';
      const sortColumn = sortKey || 'created_at';

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (isActive && isActive !== 'all') {
        const aktif = isActive === 'true';
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(aktif);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`nama ILIKE $${paramIndex}`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const mainQuery = `
        SELECT * FROM produk
        ${whereClause}
        ORDER BY ${sortColumn} ${orderDir}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limitNum, offset);

      const result = await db.query(mainQuery, queryParams);
      const data = result.rows;

      const countQuery = `SELECT COUNT(*) as total FROM produk ${whereClause}`;
      const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
      const count = parseInt(countResult.rows[0].total, 10);

      const statsQuery = `SELECT is_active, COUNT(*) as count FROM produk GROUP BY is_active`;
      const statsResult = await db.query(statsQuery);
      const countIsActive = statsResult.rows.find(r => r.is_active === true)?.count || 0;
      const countIsNonActive = statsResult.rows.find(r => r.is_active === false)?.count || 0;

      return {
        success: true,
        data,
        metadata: {
          totalData: count,
          totalIsActive: parseInt(countIsActive, 10),
          totalIsNonActive: parseInt(countIsNonActive, 10),
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          pageSize: limitNum,
        }
      };
    } catch (err: any) {
      throw err;
    }
  }

  async add(body: any, file: Express.Multer.File) {
    const db = this.databaseService.getClient();
    const { nama, harga } = body;

    try {
      if (!file) throw new BadRequestException('File gambar harus diunggah');
      if (!nama || !harga) throw new NotFoundException('Data tidak lengkap');

      const randomUUID = crypto.randomUUID();
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${randomUUID}-${nama.replace(/\s+/g, '_')}.jpg`;
      
      const objectName = `produk/upload/${fileName}`;
      const reducedJpgBuffer = `produk/reduced/${fileName}`;

      const originalJpgBuffer = await sharp(file.buffer)
        .jpeg({ quality: 90 }) // Convert ke JPG dengan kualitas tinggi
        .toBuffer();
        
      const reducedBuffer = await sharp(file.buffer)
        .resize(130, 130, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 }) // <-- WAJIB TAMBAHKAN INI untuk convert ke JPG asli
        .toBuffer();

      await this.minioService.uploadFile(
        'produk', // bucket
        `upload/${fileName}`,
          originalJpgBuffer,
        'image/jpeg',
      );
      
      await this.minioService.uploadFile(
        'produk', // bucket
        `reduced/${fileName}`,
        reducedBuffer,
        'image/jpeg',
      );

      const query = `
        INSERT INTO produk (id, nama, harga, img_url, reduced_img, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      await db.query(query, [randomUUID, nama, Number(harga), objectName, reducedJpgBuffer, true]);

      return { success: true, message: 'berhasil menambahkan data Produk', code: 200 };
    } catch (err: any) {
      throw err;
    }
  }

  async update(id: string, body: any, file?: Express.Multer.File) {
    const db = this.databaseService.getClient();
    const { nama, harga } = body;
    const hargaNumber = Number(harga);

    try {
      if (!id || !nama || !harga) {
        throw new NotFoundException('Data tidak lengkap');
      }

      const checkQuery = `SELECT * FROM produk WHERE id = $1`;
      const checkResult = await db.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        throw new BadRequestException('Produk tidak ditemukan');
      }

      const existingProduct = checkResult.rows[0];
      let finalImageUrl = existingProduct.img_url;
      let finalReducedImageUrl = existingProduct.reduced_img;

      if (file) {
        const fileName = `${id}-${Date.now()}.jpg`;
        const [bucket, ...objectParts] = existingProduct.img_url.split('/') ?? [];
        const objectName = objectParts.join('/');
        const [bucketReduced, ...objectPartsReduced] = existingProduct.reduced_img?.split('/') ?? [];
        const objectNameReduced = objectPartsReduced.join('/');

        if(objectParts && objectParts.length > 0){
          await this.minioService.deleteFile(
            bucket, // bucket
            objectName
          );
        }
        if (objectPartsReduced && objectPartsReduced.length > 0) {
          console.log("ke delete kan");
          await this.minioService.deleteFile(
            bucketReduced, // bucket
            objectNameReduced
          );
        }

        const originalJpgBuffer = await sharp(file.buffer)
        .jpeg({ quality: 90 }) // Convert ke JPG dengan kualitas tinggi
        .toBuffer();
        
        const reducedBuffer = await sharp(file.buffer)
          .resize(130, 130, { fit: 'cover', position: 'center' })
          .jpeg({ quality: 80 }) // <-- WAJIB TAMBAHKAN INI untuk convert ke JPG asli
          .toBuffer();


        await this.minioService.uploadFile(
          'produk', // bucket
          `upload/${fileName}`,
          originalJpgBuffer,
           'image/jpeg',
        );

        await this.minioService.uploadFile(
          'produk', // bucket
          `reduced/${fileName}`,
            reducedBuffer,
           'image/jpeg',
        );

        finalImageUrl = `produk/upload/${fileName}`;
        finalReducedImageUrl = `produk/reduced/${fileName}`;
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (nama !== existingProduct.nama) {
        updates.push(`nama = $${paramIndex}`);
        params.push(nama);
        paramIndex++;
      }

      if (hargaNumber !== existingProduct.harga) {
        updates.push(`harga = $${paramIndex}`);
        params.push(hargaNumber);
        paramIndex++;
      }

      if (file) {
        updates.push(`img_url = $${paramIndex} `);
        params.push(finalImageUrl);
        paramIndex++;
        updates.push(`reduced_img = $${paramIndex} `);
        params.push(finalReducedImageUrl);
        paramIndex++;
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const updateQuery = `
        UPDATE produk
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await db.query(updateQuery, params);

      return { success: true, message: 'berhasil Memperbarui data', code: 200 };
    } catch (err: any) {
      throw err;
    }
  }

  async activateANDDeactivate(body: any[]) {
    const db = this.databaseService.getClient();

    try {
      if (!body || body.length === 0) {
        throw new BadRequestException('ID produk tidak boleh kosong');
      }

      const adaYangAktif = body.some(item => item.is_active === true);
      const adaYangNonAktif = body.some(item => item.is_active === false);

      await db.query('BEGIN');

      const updatePromises = body.map(row =>
        db.query(
          `UPDATE produk SET is_active = $1, updated_at = NOW() WHERE id = $2`,
          [!row.is_active, row.id]
        )
      );

      await Promise.all(updatePromises);
      await db.query('COMMIT');

      const pesan = `Berhasil ${adaYangAktif ? 'Menonaktifkan' : ''} ${adaYangAktif && adaYangNonAktif ? 'dan' : ''} ${adaYangNonAktif ? 'Mengaktifkan' : ''} produk`;
      return { success: true, message: pesan.trim(), code: 200 };
    } catch (err: any) {
      await db.query('ROLLBACK');
      throw err;
    }
  }
}