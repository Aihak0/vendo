import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PergerakanStockService {
    constructor(private databaseService: DatabaseService) {}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, tipePerubahan?: string) {
        const db = this.databaseService.getClient();
        try {
          const { offset } = this.databaseService.getPaginationOffset(page, limit);
          const orderDir = sortAsc ? 'ASC' : 'DESC';
          const sortColumn = sortKey || 'created_at';

          let whereConditions: string[] = [];
          let queryParams: any[] = [];
          let paramIndex = 1;

          if (tipePerubahan && tipePerubahan !== 'all') {
            whereConditions.push(`ps.tipe_perubahan = $${paramIndex}`);
            queryParams.push(tipePerubahan);
            paramIndex++;
          }

          if (search) {
            whereConditions.push(`(ps.nama_mesin ILIKE $${paramIndex} OR ps.nama_produk ILIKE $${paramIndex} OR ps.kode_slot ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            queryParams.push(`%${search}%`);
            queryParams.push(`%${search}%`);
            paramIndex += 3;
          }

          const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

          const mainQuery = `
            SELECT 
              ps.*, 
              CASE 
                WHEN P.id IS NOT NULL THEN 
                  jsonb_build_object(
                      'id', P.id,
                      'nama', P.nama,
                      'harga', p.harga,
                      'img_url', p.img_url
                  )
                  ELSE NULL 
              END AS produk
            FROM pergerakan_stok ps
            LEFT JOIN produk p ON ps.produk_id = p.id
            ${whereClause}
            ORDER BY ps.${sortColumn} ${orderDir}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
          `;
          queryParams.push(limit, offset);

          const result = await db.query(mainQuery, queryParams);
          const data = result.rows;

          const countQuery = `SELECT COUNT(*) as total FROM pergerakan_stok ps ${whereClause}`;
          const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
          const count = parseInt(countResult.rows[0].total, 10);

          const statsQuery = `SELECT tipe_perubahan, COUNT(*) as count FROM pergerakan_stok GROUP BY tipe_perubahan`;
          const statsResult = await db.query(statsQuery);
          const countPenjualan = statsResult.rows.find(r => r.tipe_perubahan === 'sale')?.count || 0;
          const countRestock = statsResult.rows.find(r => r.tipe_perubahan === 'restock')?.count || 0;
          const countAdjustment = statsResult.rows.find(r => r.tipe_perubahan === 'adjust')?.count || 0;

          return {
              success: true,
              data,
              metadata: {
                  totalData: count,
                  totalDataPenjualan: parseInt(countPenjualan, 10),
                  totalDataRestock: parseInt(countRestock, 10),
                  totalDataAdjustment: parseInt(countAdjustment, 10),
                  currentPage: page,
                  totalPages: Math.ceil(count / limit),
                  pageSize: limit,
              }
          };
        } catch (err: any) {
          throw new InternalServerErrorException(err.message || 'Gagal mengambil data pergerakan stock');
        }
      }
}
