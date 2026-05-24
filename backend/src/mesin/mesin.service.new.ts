import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MesinService {
    constructor(private databaseService: DatabaseService,
       @Inject('HIVE_CLIENT') private client: ClientProxy,
    ){}

    private async sendMqtt(topic: string, payload: any, qos: 0 | 1 | 2 = 1) {
      try {
        await this.client.connect();
        
        const record = new MqttRecordBuilder(payload)
          .setQoS(qos)
          .build();
  
        await lastValueFrom(this.client.emit(topic, record));
        console.log(`[MQTT] Terkirim ke ${topic} dengan QoS ${qos}`);
      } catch (error: any) {
        console.error(`[MQTT] Gagal kirim ke ${topic}:`, error.message);
      }
    }

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, status?: string) {
        const db = this.databaseService.getClient();
        try {
          const { offset } = this.databaseService.getPaginationOffset(page, limit);
          const orderDir = sortAsc ? 'ASC' : 'DESC';
          const sortColumn = sortKey || 'created_at';

          let whereConditions: string[] = [];
          let queryParams: any[] = [];
          let paramIndex = 1;

          if (status && status !== 'all') {
            whereConditions.push(`m.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
          }

          if (search) {
            whereConditions.push(`m.nama ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
          }

          const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

          const mainQuery = `
            SELECT 
              m.*,
              json_agg(DISTINCT jsonb_build_object('id', s.id, 'kode', s.kode, 'produk_id', s.produk_id)) as slots,
              json_agg(DISTINCT jsonb_build_object('teknisi_id', mt.teknisi_id, 'nama', up.nama, 'email', up.email, 'urlPasfoto', up.url_pasfoto)) as teknisi
            FROM mesin m
            LEFT JOIN slot s ON m.id = s.mesin_id
            LEFT JOIN mesin_teknisi mt ON m.id = mt.mesin_id
            LEFT JOIN user_profiles up ON mt.teknisi_id = up.user_id
            ${whereClause}
            GROUP BY m.id
            ORDER BY m.${sortColumn} ${orderDir}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
          `;
          queryParams.push(limit, offset);

          const result = await db.query(mainQuery, queryParams);
          const data = result.rows;

          const countQuery = `SELECT COUNT(*) as total FROM mesin m ${whereClause}`;
          const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
          const count = parseInt(countResult.rows[0].total, 10);

          const statsQuery = `SELECT status, COUNT(*) as count FROM mesin GROUP BY status`;
          const statsResult = await db.query(statsQuery);
          const countOnline = statsResult.rows.find(r => r.status === 'online')?.count || 0;
          const countOffline = statsResult.rows.find(r => r.status === 'offline')?.count || 0;
          const countMaintenance = statsResult.rows.find(r => r.status === 'maintenance')?.count || 0;

          return {
            success: true,
            code: 200,
            data,
            metadata: {
              totalData: count,
              totalDataOnline: parseInt(countOnline, 10),
              totalDataOffline: parseInt(countOffline, 10),
              totalDataMaintenance: parseInt(countMaintenance, 10),
              currentPage: page,
              totalPages: Math.ceil(count / limit),
              pageSize: limit,
            }
          };
        } catch (err: any) {
          throw new InternalServerErrorException(err.message || 'Gagal mengambil data mesin');
        }
    }

    async findManagedMesin(teknisi_id: string) {
      const db = this.databaseService.getClient();
      if (!teknisi_id) throw new BadRequestException('Pengenal tidak valid');

      try {
        const query = `
          SELECT m.*, json_agg(jsonb_build_object('id', s.id, 'kode', s.kode, 'produk_id', s.produk_id, 'produk_nama', p.nama, 'produk_img', p.img_url)) as slots
          FROM mesin m
          LEFT JOIN mesin_teknisi mt ON m.id = mt.mesin_id
          LEFT JOIN slot s ON m.id = s.mesin_id
          LEFT JOIN produk p ON s.produk_id = p.id
          WHERE mt.teknisi_id = $1
          GROUP BY m.id
        `;
        
        const result = await db.query(query, [teknisi_id]);
        return result.rows;
      } catch (err: any) {
        console.error('Error fetching managed mesin for teknisi:', err);
        throw new InternalServerErrorException(err.message || 'Data tidak ditemukan');
      }
    }

    async findManagedMesinLog(teknisi_id: string, filter?: string) {
      const db = this.databaseService.getClient();
      if (!teknisi_id) throw new BadRequestException('Pengenal tidak valid');

      try {
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        whereConditions.push(`mt.teknisi_id = $${paramIndex}`);
        queryParams.push(teknisi_id);
        paramIndex++;

        if (filter && filter !== 'all') {
          whereConditions.push(`lm.tipe = $${paramIndex}`);
          queryParams.push(filter);
          paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
          SELECT lm.*
          FROM log_mesin lm
          INNER JOIN mesin m ON lm.mesin_id = m.id
          INNER JOIN mesin_teknisi mt ON m.id = mt.mesin_id
          WHERE ${whereClause}
          ORDER BY lm.created_at DESC
        `;

        const result = await db.query(query, queryParams);
        return result.rows;
      } catch (err: any) {
        console.error('Error fetching log_mesin for teknisi:', err);
        throw new InternalServerErrorException(err.message || 'Gagal mengambil data log');
      }
    }

    async findAllLogs(page: number, limit: number, search?: string, filter?: string) {
      const db = this.databaseService.getClient();
      try {
        const { offset } = this.databaseService.getPaginationOffset(page, limit);

        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        if (filter && filter !== 'all') {
          whereConditions.push(`lm.tipe = $${paramIndex}`);
          queryParams.push(filter);
          paramIndex++;
        }

        if (search) {
          whereConditions.push(`m.nama ILIKE $${paramIndex}`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const mainQuery = `
          SELECT lm.*, m.nama as mesin_nama
          FROM log_mesin lm
          INNER JOIN mesin m ON lm.mesin_id = m.id
          ${whereClause}
          ORDER BY lm.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(limit, offset);

        const result = await db.query(mainQuery, queryParams);
        const data = result.rows;

        const countQuery = `SELECT COUNT(*) as total FROM log_mesin lm INNER JOIN mesin m ON lm.mesin_id = m.id ${whereClause}`;
        const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
        const count = parseInt(countResult.rows[0].total, 10);

        const statsQuery = `SELECT tipe, COUNT(*) as count FROM log_mesin GROUP BY tipe`;
        const statsResult = await db.query(statsQuery);
        const countInfo = statsResult.rows.find(r => r.tipe === 'info')?.count || 0;
        const countSuccess = statsResult.rows.find(r => r.tipe === 'success')?.count || 0;
        const countWarning = statsResult.rows.find(r => r.tipe === 'warning')?.count || 0;
        const countError = statsResult.rows.find(r => r.tipe === 'error')?.count || 0;
        const countDebug = statsResult.rows.find(r => r.tipe === 'debug')?.count || 0;

        return {
          success: true,
          code: 200,
          data,
          metadata: {
            totalData: count,
            awalEntri: offset + 1,
            akhirEntri: Math.min(offset + limit, count),
            totalDataInfo: parseInt(countInfo, 10),
            totalDataSuccess: parseInt(countSuccess, 10),
            totalDataWarning: parseInt(countWarning, 10),
            totalDataError: parseInt(countError, 10),
            totalDataDebug: parseInt(countDebug, 10),
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            pageSize: limit,
          }
        };
      } catch (err: any) {
        throw new InternalServerErrorException(err.message || 'Gagal mengambil data log');
      }
    }

    async add(body: any) {
      const db = this.databaseService.getClient();
      try {
        const { nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos, slots, teknisi } = body;

        await db.query('BEGIN');

        // Insert mesin
        const insertMesinQuery = `
          INSERT INTO mesin (nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'online', NOW())
          RETURNING id
        `;

        const mesinResult = await db.query(insertMesinQuery, [
          nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos
        ]);

        if (mesinResult.rows.length === 0) {
          throw new InternalServerErrorException('Gagal menambah mesin');
        }

        const mesinId = mesinResult.rows[0].id;

        // Insert slots
        if (slots && Array.isArray(slots)) {
          for (const slotData of slots) {
            const insertSlotQuery = `
              INSERT INTO slot (mesin_id, kode, produk_id, created_at)
              VALUES ($1, $2, $3, NOW())
            `;
            await db.query(insertSlotQuery, [mesinId, slotData.kode, slotData.produk_id]);
          }
        }

        // Insert teknisi
        if (teknisi && Array.isArray(teknisi)) {
          for (const tek of teknisi) {
            const insertTeknisiQuery = `
              INSERT INTO mesin_teknisi (mesin_id, teknisi_id, created_at)
              VALUES ($1, $2, NOW())
            `;
            await db.query(insertTeknisiQuery, [mesinId, tek]);
          }
        }

        await db.query('COMMIT');

        return { success: true, message: 'Berhasil menambah data mesin', code: 200 };
      } catch (err: any) {
        await db.query('ROLLBACK');
        throw err;
      }
    }

    async update(id: string, body: any) {
      const db = this.databaseService.getClient();

      try {
        await db.query('BEGIN');

        const { nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos, slots, teknisi } = body;

        const updateMesinQuery = `
          UPDATE mesin
          SET nama = $1, rows = $2, total_slot = $3, latitude = $4, longitude = $5, 
              desa = $6, kecamatan = $7, kabupaten = $8, provinsi = $9, negara = $10, kode_pos = $11, updated_at = NOW()
          WHERE id = $12
        `;

        await db.query(updateMesinQuery, [
          nama, rows, total_slot, latitude, longitude, desa, kecamatan, kabupaten, provinsi, negara, kode_pos, id
        ]);

        // Delete old slots dan insert new ones
        await db.query(`DELETE FROM slot WHERE mesin_id = $1`, [id]);
        
        if (slots && Array.isArray(slots)) {
          for (const slotData of slots) {
            const insertSlotQuery = `
              INSERT INTO slot (mesin_id, kode, produk_id, created_at)
              VALUES ($1, $2, $3, NOW())
            `;
            await db.query(insertSlotQuery, [id, slotData.kode, slotData.produk_id]);
          }
        }

        // Delete old teknisi dan insert new ones
        await db.query(`DELETE FROM mesin_teknisi WHERE mesin_id = $1`, [id]);
        
        if (teknisi && Array.isArray(teknisi)) {
          for (const tek of teknisi) {
            const insertTeknisiQuery = `
              INSERT INTO mesin_teknisi (mesin_id, teknisi_id, created_at)
              VALUES ($1, $2, NOW())
            `;
            await db.query(insertTeknisiQuery, [id, tek]);
          }
        }

        await db.query('COMMIT');

        return { success: true, message: 'Berhasil memperbarui data mesin', code: 200 };
      } catch (err: any) {
        await db.query('ROLLBACK');
        throw err;
      }
    }
}
