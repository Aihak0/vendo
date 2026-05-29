import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class UserService {
    constructor(private databaseService: DatabaseService, private minioService: MinioService) {}

    async findAll(page?: number, limit?: number, sortAsc?: boolean, sortKey?: string, search?: string, role?: string) {
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

        if (role && role !== 'all') {
          whereConditions.push(`role = $${paramIndex}`);
          queryParams.push(role);
          paramIndex++;
        }

        if (search) {
          whereConditions.push(`nama ILIKE $${paramIndex}`);
          queryParams.push(`%${search}%`);
          paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const mainQuery = `
          SELECT * FROM users 
          ${whereClause}
          ORDER BY ${sortColumn} ${orderDir}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(limitNum, offset);

        const result = await db.query(mainQuery, queryParams);
        const data = result.rows;

        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
        const count = parseInt(countResult.rows[0].total, 10);

        const statsQuery = `SELECT role, COUNT(*) as count FROM users GROUP BY role`;
        const statsResult = await db.query(statsQuery);
        const countAdmin = statsResult.rows.find(r => r.role === 'admin')?.count || 0;
        const countTeknisi = statsResult.rows.find(r => r.role === 'teknisi')?.count || 0;

        return {
          success: true,
          data,
          metadata: {
            totalData: count,
            totalDataAdmin: parseInt(countAdmin, 10),
            totalDataTeknisi: parseInt(countTeknisi, 10),
            currentPage: pageNum,
            totalPages: Math.ceil(count / limitNum),
            pageSize: limitNum,
          }
        };
      } catch (err: any) {
        throw new InternalServerErrorException(err.message || 'Gagal mengambil data users');
      }
    }

    async getUserProfiles(id: string) {
      const db = this.databaseService.getClient();
      try {
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
          throw new InternalServerErrorException('User profile tidak ditemukan');
        }

        return result.rows[0];
      } catch (err: any) {
        console.log(err);
        throw new InternalServerErrorException(err.message || 'Gagal mengambil data profile');
      }
    }

    async registerUser(userData: any, pasFoto: Express.Multer.File) {
      const db = this.databaseService.getClient();
      const { email, password, full_name, role } = userData;

      try {
        const checkEmailQuery = `SELECT id FROM users WHERE email = $1`;
        const checkResult = await db.query(checkEmailQuery, [email]);

        if (checkResult.rows.length > 0) {
          throw new BadRequestException('Email sudah terdaftar');
        }

        const hashedPassword = await bcrypt.hash("Hako123", 10);
        const userId = crypto.randomUUID();

        const fileName = `${userId}-${pasFoto.originalname}`;
        await this.minioService.uploadFile(
          'pasfoto', // bucket
          fileName,
          pasFoto.buffer,
          pasFoto.mimetype,
        );

        const urlPasfoto = `pasfoto/${fileName}`;

        await db.query('BEGIN');

        const insertProfileQuery = `
          INSERT INTO users (id, nama, role, email, is_default_password, "urlPasfoto", password)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await db.query(insertProfileQuery, [
          userId,
          full_name,
          role,
          email,
          true,
          urlPasfoto,
          hashedPassword
        ]);

        await db.query('COMMIT');
          
        return { success: true, message: "Berhasil menambahkan data", code: 200 };

      } catch (err: any) {
        await db.query('ROLLBACK');
        console.error("Registrasi gagal:", err.message);
        const statusCode = err.status || 500;
        const errorMessage = err.response?.message || err.message || "Kegagalan Sistem";
        return { success: false, message: errorMessage, code: statusCode };
      }
    }

    async editUser(id: string, userData: any, pasFoto?: Express.Multer.File) {
      const db = this.databaseService.getClient();
      const { nama, email, role } = userData;
      
      try {
        const checkQuery = `SELECT * FROM users WHERE id = $1`;
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
          throw new InternalServerErrorException('User tidak ditemukan');
        }

        let urlPasfoto;
        
        if (pasFoto) {
          const fileExt = pasFoto.originalname.split('.').pop();
          const fileName = `${id}-${Date.now()}.${fileExt}`;
          await this.minioService.uploadFile(
            'pasfoto', // bucket
            fileName,
            pasFoto.buffer,
            pasFoto.mimetype,
          );

          urlPasfoto = `pasfoto/${fileName}`;
        }

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (nama) {
          updates.push(`nama = $${paramIndex}`);
          params.push(nama);
          paramIndex++;
        }

        if (email) {
          updates.push(`email = $${paramIndex}`);
          params.push(email);
          paramIndex++;
        }

        if (urlPasfoto) {
          updates.push(`"urlPasfoto" = $${paramIndex}`);
          params.push(urlPasfoto);
          paramIndex++;
        }

        updates.push(`updated_at = NOW()`);
        params.push(id);

        const updateQuery = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;

        const result = await db.query(updateQuery, params);

        if (result.rows.length === 0) {
          throw new InternalServerErrorException('Gagal memperbarui data User');
        }

        if (email) {
          const updateUsersQuery = `UPDATE users SET email = $1 WHERE id = $2`;
          await db.query(updateUsersQuery, [email, id]);
        }

        return { success: true, message: 'berhasil mengubah data User', code: 200 };
      } catch (err: any) {
        throw err;
      }
    }

    async updaetProfileByOwn(accessToken: string, id: string, req: Request, nama?: string, password?: string, pasFoto?: Express.Multer.File) {
      const db = this.databaseService.getClient();
      console.log("melebu kene?")
      try {
        let urlPasfoto: string | undefined;

        if (pasFoto) {
          const fileExt = pasFoto.originalname.split('.').pop();
          const fileName = `${id}-${Date.now()}.${fileExt}`;
          await this.minioService.uploadFile(
            'pasfoto', // bucket
            fileName,
            pasFoto.buffer,
            pasFoto.mimetype,
          );

          urlPasfoto = `pasfoto/${fileName}`;
        }

        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const updatePasswordQuery = `UPDATE users SET password = $1 WHERE id = $2`;
          await db.query(updatePasswordQuery, [hashedPassword, id]);
        }

        if (nama || urlPasfoto || password) {
          const updates: string[] = [];
          const params: any[] = [];
          let paramIndex = 1;

          if (nama) {
            updates.push(`nama = $${paramIndex}`);
            params.push(nama);
            paramIndex++;
          }

          if (urlPasfoto) {
            updates.push(`"urlPasfoto" = $${paramIndex}`);
            params.push(urlPasfoto);
            paramIndex++;
          }

          if (password) {
            updates.push(`is_default_password = false`);
          }

          updates.push(`updated_at = NOW()`);
          params.push(id);

          const updateQuery = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
          `;

          await db.query(updateQuery, params);
        }

        return { success: true, message: 'Berhasil Diperbarui', code: 200 };
      } catch (err: any) {
        console.error("DETAIL ERROR 400:", JSON.stringify(err, null, 2)); 
        throw err;
      }
    }

    async changeRole(id: string, changeTo: string) {
      const db = this.databaseService.getClient();
      try {
        const query = `
          UPDATE users 
          SET role = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        const result = await db.query(query, [changeTo, id]);

        if (result.rows.length === 0) {
          throw new InternalServerErrorException('Gagal Mengubah role');
        }

        return {
          success: true,
          message: `berhasil Mengubah Role ${result.rows[0].nama}`,
          code: 200
        };
      } catch (err: any) {
        throw err;
      }
    }

    async deactivateUser(body: any[]) {
      const db = this.databaseService.getClient();
      try {
        if (!body || body.length === 0) {
          throw new BadRequestException('Data Tidak Ditemukan');
        }

        await db.query('BEGIN');

        const updatePromises = body.map(user =>
          db.query(
            `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`,
            [!user.is_active, user.user_id]
          )
        );

        await Promise.all(updatePromises);
        await db.query('COMMIT');

        return { success: true, message: 'User Berhasil Dinonaktifkan', code: 200 };
      } catch (err: any) {
        await db.query('ROLLBACK');
        throw err;
      }
    }
}
