import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PesanService {
    constructor(private databaseService: DatabaseService) {}

    async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string) {
        const db = this.databaseService.getClient();
        const { offset } = this.databaseService.getPaginationOffset(page, limit);
        const orderDir = sortAsc ? 'ASC' : 'DESC';
        const sortColumn = sortKey || 'created_at';

        try {
            let whereConditions: string[] = [];
            let queryParams: any[] = [];
            let paramIndex = 1;

            if (search) {
                const searchPattern = `%${search}%`;
                whereConditions.push(`(
                    nama ILIKE $${paramIndex} OR 
                    email ILIKE $${paramIndex} OR 
                    nomor_telepon ILIKE $${paramIndex} OR 
                    keperluan ILIKE $${paramIndex} OR 
                    pesan ILIKE $${paramIndex}
                )`);
                queryParams.push(searchPattern);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            const mainQuery = `
                SELECT * FROM pesan
                ${whereClause}
                ORDER BY ${sortColumn} ${orderDir}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
            queryParams.push(limit, offset);

            const result = await db.query(mainQuery, queryParams);
            const data = result.rows;

            const countQuery = `SELECT COUNT(*) as total FROM pesan ${whereClause}`;
            const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
            const count = parseInt(countResult.rows[0].total, 10);

            return {
                data,
                metadata: {
                    totalData: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    pageSize: limit,
                }
            };
        } catch (err: any) {
            throw new InternalServerErrorException(err.message || 'Gagal mengambil data pesan');
        }
    }

    async add(body: any) {
        const db = this.databaseService.getClient();
        try {
            const { nama, email, nomor_telepon, keperluan, pesan } = body;

            if (!nama || !email || !pesan) {
                throw new BadRequestException('Field nama, email, dan pesan tidak boleh kosong');
            }

            const query = `
                INSERT INTO pesan (nama, email, nomor_telepon, keperluan, pesan, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *
            `;

            const result = await db.query(query, [nama, email, nomor_telepon, keperluan, pesan]);

            if (result.rows.length === 0) {
                throw new InternalServerErrorException('Gagal menambahkan pesan');
            }

            return { success: true, message: 'berhasil menambahkan pesan', code: 200 };
        } catch (err: any) {
            throw err;
        }
    }
}
