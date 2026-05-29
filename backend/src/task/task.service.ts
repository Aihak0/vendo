import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TaskService {
    constructor(private databaseService: DatabaseService) {}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, status?: string, prioritas?: string) {
        const db = this.databaseService.getClient();
        try {
            const { offset } = this.databaseService.getPaginationOffset(page, limit);
            const orderDir = sortAsc ? 'ASC' : 'DESC';
            const sortColumn = sortKey || 'created_at';

            let whereConditions: string[] = [];
            let queryParams: any[] = [];
            let paramIndex = 1;

            if (status && status !== 'all') {
                whereConditions.push(`t.status = $${paramIndex}`);
                queryParams.push(status);
                paramIndex++;
            }

            if (prioritas && prioritas !== 'all') {
                whereConditions.push(`t.prioritas = $${paramIndex}`);
                queryParams.push(prioritas);
                paramIndex++;
            }

            if (search) {
                whereConditions.push(`(m.nama ILIKE $${paramIndex} OR t.order_id ILIKE $${paramIndex})`);
                queryParams.push(`%${search}%`, `%${search}%`);
                paramIndex += 2;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            const mainQuery = `
              SELECT 
                t.*,
                m.id as mesin_id,
                m.nama as mesin_nama,
                COALESCE(json_agg(json_build_object(
                  'user_id', up.user_id,
                  'nama', up.nama,
                  'email', up.email,
                  'urlPasfoto', up."urlPasfoto"
                )) FILTER (WHERE up.user_id IS NOT NULL), '[]'::json) as ditugaskan_ke
              FROM task t
              LEFT JOIN mesin m ON t.mesin_id = m.id
              LEFT JOIN task_teknisi tt ON t.id = tt.task_id
              LEFT JOIN user_profiles up ON tt.teknisi_id = up.user_id
              ${whereClause}
              GROUP BY t.id, m.id
              ORDER BY t.${sortColumn} ${orderDir}
              LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            queryParams.push(limit, offset);

            const result = await db.query(mainQuery, queryParams);
            const data = result.rows;

            const countQuery = `SELECT COUNT(*) as total FROM task t LEFT JOIN mesin m ON t.mesin_id = m.id ${whereClause}`;
            const countResult = await db.query(
              countQuery,
              whereConditions.length > 0 ? queryParams.slice(0, -2) : []
            );
            const count = parseInt(countResult.rows[0].total, 10);

            const statsQuery = `SELECT status, COUNT(*) as count FROM task GROUP BY status`;
            const statsResult = await db.query(statsQuery);
            const countPending = statsResult.rows.find(r => r.status === 'pending')?.count || 0;
            const countInProgress = statsResult.rows.find(r => r.status === 'in_progress')?.count || 0;
            const countAssigned = statsResult.rows.find(r => r.status === 'assigned')?.count || 0;
            const countDone = statsResult.rows.find(r => r.status === 'done')?.count || 0;
            const countCancelled = statsResult.rows.find(r => r.status === 'cancelled')?.count || 0;

            return {
                success: true,
                data,
                metadata: {
                    totalData: count,
                    totalDataPending: parseInt(countPending, 10),
                    totalDataInProgress: parseInt(countInProgress, 10),
                    totalDataAssigned: parseInt(countAssigned, 10),
                    totalDataDone: parseInt(countDone, 10),
                    totalDataCancelled: parseInt(countCancelled, 10),
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    pageSize: limit,
                }
            };
        } catch (err: any) {
            throw err;
        }
    }

    async findAllMyTask(id: string, prioritas?: string) {
        const db = this.databaseService.getClient();
        try {
            let queryParams: any[] = [id];
            let paramIndex = 2;
            let prioritasCondition = '';

            if (prioritas && prioritas !== 'all') {
                prioritasCondition = `AND t.prioritas = $${paramIndex}`;
                queryParams.push(prioritas);
            }

            const query = `
                SELECT 
                    t.*,
                    mesin_agg.mesin
                FROM task_teknisi tt
                INNER JOIN task t ON tt.task_id = t.id
                LEFT JOIN LATERAL (
                    SELECT 
                    CASE 
                        WHEN m.id IS NOT NULL THEN 
                        jsonb_build_object(
                            'id', m.id,
                            'nama', m.nama,
                            'status', m.status
                        )
                        ELSE NULL 
                    END AS mesin
                    FROM mesin m
                    WHERE t.mesin_id = m.id
                ) mesin_agg ON TRUE
                WHERE tt.teknisi_id = $1
                ${prioritasCondition}
                ORDER BY t.created_at DESC
                `;
            const result = await db.query(query, queryParams);
            const data = result.rows;

            const statsQuery = `SELECT status, COUNT(*) as count FROM task GROUP BY status`;
            const statsResult = await db.query(statsQuery);
            const countPending = statsResult.rows.find(r => r.status === 'pending')?.count || 0;
            const countInProgress = statsResult.rows.find(r => r.status === 'in_progress')?.count || 0;
            const countAssigned = statsResult.rows.find(r => r.status === 'assigned')?.count || 0;
            const countDone = statsResult.rows.find(r => r.status === 'done')?.count || 0;
            const countCancelled = statsResult.rows.find(r => r.status === 'cancelled')?.count || 0;

            return {
                success: true,
                data,
                metadata: {
                    totalData: data.length,
                    totalDataPending: parseInt(countPending, 10),
                    totalDataInProgress: parseInt(countInProgress, 10),
                    totalDataAssigned: parseInt(countAssigned, 10),
                    totalDataDone: parseInt(countDone, 10),
                    totalDataCancelled: parseInt(countCancelled, 10),
                }
            };
        } catch (err: any) {
            throw err;
        }
    }

    async add(body: any) {
        const db = this.databaseService.getClient();
        const { judul, prioritas, ditugaskan_ke, mesin_id, tenggat_waktu, tipe_tugas } = body;

        try {
            await db.query('BEGIN');
            
            const insertTaskQuery = `
              INSERT INTO task (judul, prioritas, mesin_id, tenggat_waktu, tipe_tugas, dibuat_oleh, status, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
              RETURNING id
            `;
            const taskResult = await db.query(insertTaskQuery, [
              judul,
              prioritas,
              mesin_id,
              tenggat_waktu,
              tipe_tugas,
              'admin',
              'assigned'
            ]);
            const taskId = taskResult.rows[0].id;

            if (ditugaskan_ke && ditugaskan_ke.length > 0) {
                const taskTeknisiValues = ditugaskan_ke.map((teknisi_id, idx) => `($1, $${idx + 2}, NOW())`).join(',');
                const insertTaskTeknisiQuery = `
                  INSERT INTO task_teknisi (task_id, teknisi_id, created_at)
                  VALUES ${taskTeknisiValues}
                `;
                const params = [taskId, ...ditugaskan_ke];
                await db.query(insertTaskTeknisiQuery, params);
            }

            await db.query('COMMIT');
            return { success: true, message: 'berhasil menambahkan data task', code: 200 };
        } catch (err: any) {
            await db.query('ROLLBACK');
            throw err;
        }
    }

    async update(id: string, body: any) {
        const db = this.databaseService.getClient();
        const { judul, prioritas, ditugaskan_ke, mesin_id, tenggat_waktu, tipe_tugas } = body;

        try {
            await db.query('BEGIN');

            const oldDataQuery = `SELECT * FROM task WHERE id = $1`;
            const oldDataResult = await db.query(oldDataQuery, [id]);
            if (oldDataResult.rows.length === 0) {
                throw new BadRequestException('Task tidak ditemukan');
            }
            const oldData = oldDataResult.rows[0];

            const oldTaskTeknisiQuery = `SELECT id, teknisi_id FROM task_teknisi WHERE task_id = $1`;
            const oldTaskTeknisiResult = await db.query(oldTaskTeknisiQuery, [id]);
            const dataOldTaskTeknisi = oldTaskTeknisiResult.rows;

            const taskTeknsiisDelete = dataOldTaskTeknisi.filter(
              old => !ditugaskan_ke.includes(old.teknisi_id)
            );
            const taskTeknisiToUpsert: any[] = [];
            ditugaskan_ke.forEach((item) => {
                const old = dataOldTaskTeknisi.find(old => old.teknisi_id === item);
                if (!old) {
                    taskTeknisiToUpsert.push({
                        task_id: id,
                        teknisi_id: item
                    });
                }
            });

            if (taskTeknisiToUpsert.length > 0) {
                const upsertValues = taskTeknisiToUpsert.map((_, idx) => `($1, $${idx * 2 + 2}, NOW())`).join(',');
                const upsertQuery = `
                  INSERT INTO task_teknisi (task_id, teknisi_id, created_at)
                  VALUES ${upsertValues}
                  ON CONFLICT (task_id, teknisi_id) DO NOTHING
                `;
                const params: any[] = [id];
                taskTeknisiToUpsert.forEach(item => params.push(item.teknisi_id));
                await db.query(upsertQuery, params);
            }

            if (taskTeknsiisDelete.length > 0) {
                const deleteIds = taskTeknsiisDelete.map(item => item.id);
                const placeholders = deleteIds.map((_, idx) => `$${idx + 1}`).join(',');
                const deleteQuery = `DELETE FROM task_teknisi WHERE id IN (${placeholders})`;
                await db.query(deleteQuery, deleteIds);
            }

            if (oldData.dibuat_oleh === 'system') {
                const countQuery = `SELECT COUNT(*) as count FROM task_teknisi WHERE task_id = $1`;
                const countResult = await db.query(countQuery, [id]);
                const totalTeknisi = parseInt(countResult.rows[0].count, 10);

                const updateTaskQuery = `
                  UPDATE task
                  SET tenggat_waktu = $2, updated_at = NOW()
                  WHERE id = $1
                `;
                await db.query(updateTaskQuery, [id, tenggat_waktu]);

                if (totalTeknisi > 0 && dataOldTaskTeknisi.length > 0) {
                    const updateStatusQuery = `
                      UPDATE task SET status = 'assigned', updated_at = NOW()
                      WHERE id = $1
                    `;
                    await db.query(updateStatusQuery, [id]);
                }
            } else {
                const updateTaskQuery = `
                  UPDATE task
                  SET judul = $2, prioritas = $3, mesin_id = $4, tenggat_waktu = $5, tipe_tugas = $6, updated_at = NOW()
                  WHERE id = $1
                `;
                await db.query(updateTaskQuery, [id, judul, prioritas, mesin_id, tenggat_waktu, tipe_tugas]);
            }

            await db.query('COMMIT');
            return { success: true, message: 'berhasil memperbarui task', code: 200 };
        } catch (err: any) {
            await db.query('ROLLBACK');
            throw err;
        }
    }

    async updateStatus(id: string, body: any) {
        const db = this.databaseService.getClient();
        const { status, reason } = body;

        try {
            if (status !== 'cancelled' && status !== 'done' && status !== 'in_progress' && status !== 'assigned') {
                throw new BadRequestException('status tidak valid');
            }

            let query = `UPDATE task SET status = $1, updated_at = NOW()`;
            let params: any[] = [status, id];

            if (status === 'cancelled') {
                query += `, metadata = $3`;
                params = [status, id, JSON.stringify({ reason })];
            }

            if (status === 'done') {
                query += `, waktu_selesai = NOW()`;
            }

            query += ` WHERE id = $2`;

            await db.query(query, params);
            return { success: true, message: 'berhasil memperbarui status task', code: 200 };
        } catch (err: any) {
            console.log(err);
            throw err;
        }
    }

    async delete(body: { id: string[] }) {
        const db = this.databaseService.getClient();
        try {
            const placeholders = body.id.map((_, idx) => `$${idx + 1}`).join(',');
            const query = `DELETE FROM task WHERE id IN (${placeholders})`;
            await db.query(query, body.id);
            return { success: true, message: 'berhasil menghapus task', code: 200 };
        } catch (err: any) {
            throw err;
        }
    }
}
