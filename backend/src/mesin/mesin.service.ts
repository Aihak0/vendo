import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { DatabaseService } from 'src/database/database.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class MesinService {
    constructor(private databaseService: DatabaseService,
       @Inject('HIVE_CLIENT') private client: ClientProxy, private configService: ConfigService
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
          
          const orderDir = sortAsc ? 'ASC' : 'DESC';
          const sortColumn = sortKey || 'created_at';
          
          let whereConditions: string[] = [];
          let queryParams: any[] = [];
          let paramIndex = 1;
          
          const hasPagination =
            limit !== undefined &&
            limit !== null &&
            !isNaN(Number(limit));

          let paginationQuery = '';

          if (hasPagination) {
            const limitNum = Number(limit);
            const pageNum = Number(page) || 1;
            const offset = (pageNum - 1) * limitNum;

            paginationQuery = `
              LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limitNum, offset);
          }
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
              COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object(
                    'id', s.id,
                    'kode', s.kode,
                    'produk_id', s.produk_id,
                    'stock', s.stock,
                    'metadata', s.metadata,
                    'max_stock', s.max_stock
                  )
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'
              ) as slots,
              COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object(
                    'teknisi_id', mt.teknisi_id,
                    'nama', up.username,
                    'email', up.email,
                    'urlPasfoto', up."urlPasfoto"
                  )
                ) FILTER (WHERE mt.teknisi_id IS NOT NULL),
                '[]'
              ) as teknisi
            FROM mesin m
            LEFT JOIN slot s ON m.id = s.mesin_id
            LEFT JOIN mesin_teknisi mt ON m.id = mt.mesin_id
            LEFT JOIN users up ON mt.teknisi_id = up.id
            ${whereClause}
            GROUP BY m.id
            ORDER BY m.${sortColumn} ${orderDir}
            ${paginationQuery}
          `;
        
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
          console.log("err;ror mesin", err);
          throw new InternalServerErrorException(err.message || 'Gagal mengambil data mesin');
        }
    }

    async findManagedMesin(teknisi_id: string) {
      const db = this.databaseService.getClient();
      if (!teknisi_id) throw new BadRequestException('Pengenal tidak valid');

      try {
        const query = `
          SELECT m.*, 
            COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object(
                    'id', s.id,
                    'kode', s.kode,
                    'produk_id', s.produk_id,
                    'stock', s.stock,
                    'metadata', s.metadata,
                    'max_stock', s.max_stock,
                    
                  
                    'produk', CASE 
                      WHEN p.id IS NOT NULL THEN 
                        jsonb_build_object(
                          'id', p.id,
                          'nama', p.nama, 
                          'harga', p.harga,
                          'img_url', p.img_url
                        )
                      ELSE NULL 
                    END
                  )
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'
              ) as slots
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
          SELECT lm.*,
           CASE 
                WHEN m.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', m.id,
                    'nama', m.nama,
                    'status', m.status
                )
                ELSE NULL 
            END AS mesin
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
          SELECT lm.*,
          CASE 
                WHEN m.id IS NOT NULL THEN 
                jsonb_build_object(
                    'id', m.id,
                    'nama', m.nama,
                    'status', m.status
                )
                ELSE NULL 
            END AS mesin
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
        const {
          nama,
          rows,
          total_slot,
          latitude,
          longitude,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          negara,
          kode_pos,
          slots,
          teknisi,
        } = body;

        const query = `
          SELECT * FROM tambah_mesin_dengan_slot(
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13
          )
        `;

        const values = [
          nama,
          rows,
          total_slot,
          latitude,
          longitude,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          negara,
          kode_pos,
          JSON.stringify(teknisi),
          JSON.stringify(slots),
        ];

        const result = await db.query(query, values);

        const dataInsert = result.rows[0].tambah_mesin_dengan_slot

        console.log(result)
        if (!dataInsert.success) {
          throw new InternalServerErrorException(dataInsert.error);
        }

        return {
          success: true,
          message: 'Berhasil menambah data mesin',
          code: 200,
        };
      } catch (err: any) {
        console.log(err);
        throw err
      }

    }

    async update(id: string, body: any) {
      const db = this.databaseService.getClient();
      console.log(body);

      try {
        // =========================
        // AMBIL DATA LAMA
        // =========================

        const oldMesinResult = await db.query(
          `SELECT * FROM mesin WHERE id = $1 LIMIT 1`,
          [id]
        );

        const oldSlotsResult = await db.query(
          `SELECT * FROM slot WHERE mesin_id = $1`,
          [id]
        );

        const oldTeknisiResult = await db.query(
          `
          SELECT 
            mt.*,
            json_build_object(
              'nama', up.nama,
              'email', up.email,
              'urlPasfoto', up."urlPasfoto"
            ) as users
          FROM mesin_teknisi mt
          LEFT JOIN users up
            ON up.id = mt.teknisi_id
          WHERE mt.mesin_id = $1
          `,
          [id]
        );

        const oldMesin = oldMesinResult.rows[0];
        const oldSlots = oldSlotsResult.rows;
        const oldTeknisi = oldTeknisiResult.rows;

        let itemToUpsert: any[] = [];
        let TeknisiToUpsert: any[] = [];

        // =========================
        // CEK SLOT YANG BERUBAH
        // =========================
        if(body.slots){

          body.slots.forEach((s: any) => {
            s.col.forEach((item: any) => {
              const oldSlot = oldSlots.find(
                (old: any) => old.kode === item.kode
              );
              
              const isChanged =
              !oldSlot ||
              oldSlot.produk_id !== item.produk_id ||
              oldSlot.stock !== item.stock ||
              oldSlot.max_stock !== item.max_stock ||
              oldSlot.metadata?.span !== item.span ||
              JSON.stringify(oldSlot.metadata?.gabungan) !==
              JSON.stringify(item.gabungan);
              
              if (isChanged) {
                itemToUpsert.push({
                  kode: item.kode,
                  mesin_id: id,
                  produk_id: item.produk_id || null,
                  stock: item.stock || 0,
                  max_stock: item.max_stock || 0,
                  metadata: {
                    span: item.span,
                    gabungan: item.gabungan,
                    row_number: s.row_number,
                    col_number: item.col_number,
                  },
                });
              }
            });
          });
        }

        // =========================
        // CEK TEKNISI BARU
        // =========================
        if(body.teknisi){

          body.teknisi.forEach((item: any) => {
            const old = oldTeknisi.find(
              (old: any) => old.teknisi_id === item.id
            );
            
            if (!old) {
              TeknisiToUpsert.push({
                mesin_id: id,
                teknisi_id: item.id,
              });
            }
          });

        }
        // =========================
        // DATA YANG DIHAPUS
        // =========================
        
        const incomingKodes = body.slots.flatMap((s: any) =>
          s.col.map((item: any) => item.kode)
        );

        const itemsToDelete =
          oldSlots.filter(
            (old: any) => !incomingKodes.includes(old.kode)
          ) || [];
        
        let TeknisiDelete :any[]= [];
        if(body.teknisi){
          TeknisiDelete =
            oldTeknisi.filter(
              (old: any) =>
                !body.teknisi
                  .map((t: any) => t.id)
                  .includes(old.teknisi_id)
            ) || [];

        }

        // =========================
        // UPSERT SLOT
        // =========================

        if (itemToUpsert.length > 0) {
          for (const item of itemToUpsert) {
            await db.query(
              `
              INSERT INTO slot (
                kode,
                mesin_id,
                produk_id,
                stock,
                max_stock,
                metadata
              )
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (mesin_id, kode)
              DO UPDATE SET
                produk_id = EXCLUDED.produk_id,
                stock = EXCLUDED.stock,
                max_stock = EXCLUDED.max_stock,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
              `,
              [
                item.kode,
                item.mesin_id,
                item.produk_id,
                item.stock,
                item.max_stock,
                JSON.stringify(item.metadata),
              ]
            );
          }
        }

        // =========================
        // UPSERT TEKNISI
        // =========================

        if (TeknisiToUpsert.length > 0) {
          for (const item of TeknisiToUpsert) {
            await db.query(
              `
              INSERT INTO mesin_teknisi (
                mesin_id,
                teknisi_id
              )
              VALUES ($1, $2)
              ON CONFLICT (mesin_id, teknisi_id)
              DO NOTHING
              `,
              [item.mesin_id, item.teknisi_id]
            );
          }
        }

        // =========================
        // DELETE SLOT
        // =========================

        if (itemsToDelete.length > 0) {
          const deleteIds = itemsToDelete.map(
            (item: any) => item.id
          );

          await db.query(
            `DELETE FROM slot WHERE id = ANY($1::uuid[])`,
            [deleteIds]
          );
        }

        // =========================
        // DELETE TEKNISI
        // =========================

        if (TeknisiDelete.length > 0) {
          const deleteIds = TeknisiDelete.map(
            (item: any) => item.id
          );

          await db.query(
            `DELETE FROM mesin_teknisi WHERE id = ANY($1::uuid[])`,
            [deleteIds]
          );
        }

        // =========================
        // UPDATE MESIN
        // =========================

        const isMesinChanged =
          (body.nama !== undefined &&
            body.nama !== oldMesin.nama) ||
          
          (body.latitude !== undefined &&
            body.latitude !== oldMesin.latitude) ||
          (body.longitude !== undefined &&
            body.longitude !== oldMesin.longitude) ||
          (body.desa !== undefined &&
            body.desa !== oldMesin.desa) ||
          (body.kecamatan !== undefined &&
            body.kecamatan !== oldMesin.kecamatan) ||
          (body.kabupaten !== undefined &&
            body.kabupaten !== oldMesin.kabupaten) ||
          (body.negara !== undefined &&
            body.negara !== oldMesin.negara) ||
          (body.provinsi !== undefined &&
            body.provinsi !== oldMesin.provinsi) ||
          (body.kode_pos !== undefined &&
            body.kode_pos !== oldMesin.kode_pos) ||
          (body.row_slot !== undefined &&
            body.row_slot !== oldMesin.row_slot) ||
          (body.total_slot !== undefined &&
            body.total_slot !== oldMesin.total_slot);

        let dataUpdateMesin: any = null;

        if (isMesinChanged) {
          await db.query(
            `
            UPDATE mesin
            SET
              nama = $1,
              row_slots = $2,
              total_slot = $3,
              latitude = $4,
              longitude = $5,
              desa = $6,
              kecamatan = $7,
              kabupaten = $8,
              provinsi = $9,
              negara = $10,
              kode_pos = $11,
              updated_at = NOW()
            WHERE id = $12
            
            `,
            [
              body.nama,
              body.row_slot,
              body.total_slot,
              body.latitude,
              body.longitude,
              body.desa,
              body.kecamatan,
              body.kabupaten,
              body.provinsi,
              body.negara,
              body.kode_pos,
              id,
            ]
          );

        }
        // ambil slot + produk
        const selectResult = await db.query(
          `
          SELECT json_build_object(
                  'kode', m.kode,
                  'nama', m.nama,
                  'created_at', m.created_at,
                  'status', m.status,
                  'updated_at', m.updated_at,
                  'row_slots', m.row_slots,
                  'id', m.id,
                  'total_slot', m.total_slot,
                  'latitude', m.latitude,
                  'longitude', m.longitude,
                  'desa', m.desa,
                  'kecamatan', m.kecamatan,
                  'kabupaten', m.kabupaten,
                  'provinsi', m.provinsi,
                  'negara', m.negara,
                  'kode_pos', m.kode_pos,
                  'slot', COALESCE(s_agg.slots, '[]'::json)
              ) AS result
              FROM mesin m
              LEFT JOIN (
                  SELECT 
                      s.mesin_id,
                      json_agg(
                          json_build_object(
                              'produk_id', s.produk_id,
                              'kode', s.kode,
                              'stock', s.stock,
                              'max_stock', s.max_stock,
                              'metadata', s.metadata,
                              'produk', json_build_object(
                                  'nama', p.nama,
                                  'harga', p.harga,
                                  'img_url', CASE WHEN p.reduced_img IS NOT NULL THEN $2 || p.reduced_img ELSE null END
                              )
                          )
                      ) AS slots
                  FROM slot s
                  LEFT JOIN produk p ON p.id = s.produk_id
                  GROUP BY s.mesin_id
              ) s_agg ON s_agg.mesin_id = m.id
              WHERE m.id = $1;
          `,
          [id, `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/`]
        );

        const fullOutput = selectResult.rows[0].result;

        console.log("keupdatekan");
        await this.sendMqtt(
          `mesin/${fullOutput.kode}/detail`,
          { dataMesin: fullOutput },
          1
        );

        return {
          success: true,
          message: "Berhasil mengubah data",
          code: 200,
        };
      } catch (err: any) {
        console.log("Error nyah:", err);
        throw err;
      }
    }

    async delete(body: { id: string[] }) {
      const db = this.databaseService.getClient();
      try{

        if (!body.id || body.id.length === 0) {
          throw new BadRequestException('ID produk tidak boleh kosong');
        }
    
        // Gunakan .in() untuk menghapus semua ID dalam satu array sekaligus
        await db.query(`DELETE FROM mesin WHERE id = ANY($1)`, [body.id]);
        
    
        return { success: true, message: 'Mesin berhasil dihapus', code: 200 };
      }catch(err:any){
        throw err;
      }
    }

    async updateStatus(status: string, kode: string){
      const db = this.databaseService.getClient();

      try{

        console.log("old mesin", kode, status);
        const queryOldMesin = await db.query(
          `SELECT status FROM mesin WHERE kode = $1`, 
          [kode]
        );

        const oldMesin = queryOldMesin.rows[0]
        console.log("old mesin", oldMesin);

        if(!oldMesin) throw new BadRequestException("Mesin tidak ditemukan");
        if(oldMesin.status === status) throw new BadRequestException("Permintaan tidak bisa dilanjutkan");

        const queryUpdateMesin = `
          WITH updated_mesin AS (
            UPDATE mesin 
            SET status = $1 
            WHERE kode = $2 
            RETURNING *
          )
          SELECT 
            m.*,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'produk_id', s.produk_id,
                    'kode', s.kode,
                    'stock', s.stock,
                    'metadata', s.metadata,
                    'produk', (
                      SELECT json_build_object(
                        'nama', p.nama,
                        'harga', p.harga,
                        'img_url', CASE WHEN p.reduced_img IS NOT NULL THEN $3 || p.reduced_img ELSE null END
                      )
                      FROM produk p 
                      WHERE p.id = s.produk_id
                    )
                  )
                )
                FROM slot s 
                WHERE s.mesin_id = m.id -- Asumsi: relasi tabel slot ke mesin menggunakan mesin_id atau kode_mesin
              ), 
              '[]'::json
            ) AS slot
          FROM updated_mesin m;
        `;
        const resDataMesin = await db.query(queryUpdateMesin, [status, kode, `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/`]);
        const dataMesin = resDataMesin.rows[0]
        let messageLog = "";
        if(status === "online"){
          messageLog = `Mesin ${dataMesin?.nama} sekarang Online`;
          await this.sendMqtt(`mesin/${kode}/detail`, { dataMesin }, 1);
          console.log("kekerem ora seh");
        }else if(status === "offline"){
          messageLog = `Mesin ${dataMesin?.nama} sekarang Offline`;
        } else if(status === "maintenance"){
          messageLog = `Mesin ${dataMesin?.nama} sedang dalam perawatan`;
        }

        await db.query(`INSERT INTO log_mesin 
          (
          mesin_id,
          tipe,
          payload ) VALUES ($1, $2, $3);`, [dataMesin.id, status, {
              kode: kode,
              message: messageLog,
              waktu: new Date(Date.now()).toISOString(),
            }])
          
      }catch(err: any){
        throw err;
      }

      
    }
    async updateStockSlot(idMesin: string, dataSlot: any[]){
      const db = this.databaseService.getClient();
      try{
        if(!dataSlot || !idMesin) throw new NotFoundException("data tidak lengkap");

        const resDataMesin = await db.query(`SELECT * FROM mesin WHERE id = $1;`, [idMesin]);
        
        const dataMesin = resDataMesin.rows[0]
        
        if(dataMesin.status != 'maintenance') throw new BadRequestException("Perubahan tidak diperbolehkan");

        const d_items = dataSlot;
        const d_mesin_id = idMesin;

       await db.query(
        `SELECT * FROM bulk_add_stock($1, $2)`, 
        [JSON.stringify(d_items), d_mesin_id] // <--- Bungkus dengan JSON.stringify()
      );
    
      
        return { success: true, message: "Berhasil mengubah stock", code: 200};
      }catch(err: any){
        console.log(err);
        throw err;
      }
    }
}
