import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MidtransService } from 'src/midtrans/midtrans.service';
import { DatabaseService } from 'src/database/database.service';
import { MqttRecordBuilder } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TransaksiService {
  constructor(
    private readonly midtransService: MidtransService,
    private databaseService: DatabaseService,
    @Inject('HIVE_CLIENT') private client: ClientProxy
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  private async sendMqtt(topic: string, payload: any, qos: 0 | 1 | 2 = 1) {
    try {
      await this.client.connect();

      const record = new MqttRecordBuilder(payload).setQoS(qos).build();

      await lastValueFrom(this.client.emit(topic, record));
      console.log(`[MQTT] Terkirim ke ${topic} dengan QoS ${qos}`);
    } catch (error: any) {
      console.error(`[MQTT] Gagal kirim ke ${topic}:`, error.message);
    }
  }

  private getFriendlyMessage(status: string): string {
    const messages = {
      settlement: 'Pembayaran Berhasil!',
      capture: 'Pembayaran Berhasil!',
      deny: 'Pembayaran Ditolak.',
      cancel: 'Pembayaran Dibatalkan.',
      expire: 'Pembayaran Kadaluarsa.'
    };
    return messages[status] || 'Status Transaksi Berubah';
  }

  async findAll(page: number, limit: number, sortAsc: boolean, sortKey?: string, search?: string, statusTransaksi?: string, statusPembayaran?: string) {
    const db = this.databaseService.getClient();
    try {
      const { offset } = this.databaseService.getPaginationOffset(page, limit);
      const orderDir = sortAsc ? 'ASC' : 'DESC';
      const sortColumn = sortKey || 'created_at';

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (statusPembayaran && statusPembayaran !== 'all') {
        whereConditions.push(`status_pembayaran = $${paramIndex}`);
        queryParams.push(statusPembayaran);
        paramIndex++;
      }

      if (statusTransaksi && statusTransaksi !== 'all') {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(statusTransaksi);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(mesin_nama ILIKE $${paramIndex} OR order_id ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
        paramIndex += 2;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const mainQuery = `
        SELECT * FROM detailed_transaksi
        ${whereClause}
        ORDER BY ${sortColumn} ${orderDir}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await db.query(mainQuery, queryParams);
      const data = result.rows;

      const countQuery = `SELECT COUNT(*) as total FROM transaksi ${whereClause}`;
      const countResult = await db.query(countQuery, whereConditions.length > 0 ? queryParams.slice(0, -2) : []);
      const count = parseInt(countResult.rows[0].total, 10);

      const statsQuery = `SELECT status, COUNT(*) as count FROM transaksi GROUP BY status`;
      const statsResult = await db.query(statsQuery);
      const countPending = statsResult.rows.find(r => r.status === 'pending')?.count || 0;
      const countCancel = statsResult.rows.find(r => r.status === 'cancel')?.count || 0;
      const countComplete = statsResult.rows.find(r => r.status === 'complete')?.count || 0;

      return {
        success: true,
        data,
        metadata: {
          totalData: count,
          totalDataPending: parseInt(countPending, 10),
          totalDataCancel: parseInt(countCancel, 10),
          totalDataComplete: parseInt(countComplete, 10),
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          pageSize: limit,
        }
      };
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }

  async getSummary(filter: string, dari?: Date, sampai?: Date) {
    const db = this.databaseService.getClient();

    let startDate, endDate;
    if (filter === 'custom') {
      startDate = dayjs.tz(dari, 'Asia/Jakarta').startOf('day').format();
      endDate = dayjs.tz(sampai, 'Asia/Jakarta').add(1, 'day').startOf('day').format();
    }
    if (filter === 'hari') {
      startDate = dayjs().startOf('week').format();
      endDate = dayjs().endOf('week').add(1, 'day').format();
    }
    if (filter === 'minggu') {
      startDate = dayjs().startOf('month').format();
      endDate = dayjs().endOf('month').format();
    }
    if (filter === 'bulan') {
      startDate = dayjs().startOf('year').format();
      endDate = dayjs().add(1, 'year').startOf('year').format();
    }
    if (filter === 'tahun') {
      endDate = dayjs().add(1, 'year').startOf('year').format();
      startDate = dayjs().subtract(4, 'year').startOf('year').format();
    }

    try {
      const query = `
        SELECT 
          DATE_TRUNC('day', created_at) as tanggal,
          COUNT(*) as jumlah_transaksi,
          SUM(total) as total_penjualan,
          COUNT(CASE WHEN status = 'complete' THEN 1 END) as selesai,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancel' THEN 1 END) as batal
        FROM transaksi
        WHERE created_at >= $1 AND created_at < $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY tanggal DESC
      `;

      const result = await db.query(query, [startDate, endDate]);

      return {
        success: true,
        data: result.rows,
        period: filter
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Gagal mengambil data summary');
    }
  }

  async paymentReq(data: any, dataMesin: any) {
    const db = this.databaseService.getClient();
    const midtrans = this.midtransService.getClient();

    const countQuery = `SELECT COUNT(*) as count FROM transaksi WHERE mesin_id = $1`;
    const countResult = await db.query(countQuery, [dataMesin.id]);
    const count = parseInt(countResult.rows[0].count, 10);

    if (!data.total || !data.kode || !data.items || !dataMesin) {
      await this.sendMqtt(`generate/qr`, { success: false, message: 'Data Tidak Lengkap.', data: {} }, 0);
      return;
    }

    const formattedItems = data.items.map((item: any) => ({
      id: item.produk_id,
      price: Number(item.harga),
      quantity: Number(item.qty),
      name: item.nama_produk,
    }));

    const formatedOrderID = `${data.kode.slice(0, 8)}-${Date.now()}-${count || 0}`;

    const midtransPayload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: formatedOrderID,
        gross_amount: data.total,
      },
      qris: { acquirer: 'gopay' },
      item_details: formattedItems,
    };

    try {
      const result = await midtrans.charge(midtransPayload);

      if (result.fraud_status !== 'accept') {
        throw { source: 'midtrans', message: 'Transaksi terdeteksi penipuan.' };
      }
      
      const query = `
        SELECT * FROM tambah_transaksi_dengan_items($1, $2, $3, $4, $5, $6, $7::jsonb)
      `;

      const values = [
        result.transaction_id,
        result.order_id,
        dataMesin.id,
        'pending',
        'pending',
        Number(result.gross_amount),
        JSON.stringify(data.items)
      ];
      const res = await db.query(query, values);

      console.log(JSON.stringify(res.rows, null, 2));

      const payload = {
        success: true,
        message: 'Generating QR',
        data: result,
      };

      await this.sendMqtt(`generate/qr`, payload, 1);
    } catch (error: any) {
      await db.query('ROLLBACK');
      console.error('Payment Request Error:', error);
      throw error;
    }
  }

  async updateStatusTransaksi(data: any) {
    const db = this.databaseService.getClient();

    const { order_id: orderId, transaction_id: transactionId, transaction_status: transactionStatus, fraud_status: fraudStatus } = data;

    try {
      if (transactionStatus === 'pending') {
        return { success: true, message: 'Status masih pending, abaikan.' };
      }

      if (fraudStatus && fraudStatus !== 'accept') {
          this.client.emit(`transaksi/status`, {
            success: false,
            message: "Transaksi terdeteksi fraud.",
            order_id: orderId,
            statusTransaksi: 'cancel'
          });

        return;
      }

      let statusTransaksi: string;
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        statusTransaksi = "process";
      } else if (['expire', 'cancel', 'deny', 'refund'].includes(transactionStatus)) {
        statusTransaksi = "cancel";
      } else {
        throw new BadRequestException("status tidak relevan");
      }


      const updateQuery = `
        UPDATE transaksi
        SET status_pembayaran = $1, status = $2, updated_at = NOW()
        WHERE order_id = $3 AND id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [transactionStatus, statusTransaksi, orderId, transactionId]);

      if (!result.rows || result.rows.length === 0) {
        throw new InternalServerErrorException('Transaksi tidak ditemukan');
      }

      await this.sendMqtt(`transaksi/status`, { success: true, message: this.getFriendlyMessage(transactionStatus), order_id: orderId, statusTransaksi: transactionStatus }, 0);

      return { success: true, data: result.rows[0], code: 200 };
    } catch (err: any) {
      throw err;
    }
  }

  async completeOrder(dataPayload: any, dataMesin: any) {
    const db = this.databaseService.getClient();

    try {
      if(!dataPayload || !dataPayload.order_id || !dataPayload.status) {
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Data Tidak Lengkap.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
        return;
      }
      if(dataPayload.status != 'complete'){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Permintaan tidak dapat dilanjutkan.", order_id: dataPayload?.order_id || null, statusTransaksi: 'failed'}, 0);
        return;
      }

      const queryDataOldTrans = `
        SELECT * FROM transaksi 
        WHERE order_id = $1
      `;

      const resultDataOldTrans = await db.query(queryDataOldTrans, [dataPayload.order_id]);


      if(!resultDataOldTrans || resultDataOldTrans.rows.length === 0){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Order tidak ditemukan.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
        return;
      }

      const dataOldTrans = resultDataOldTrans.rows[0];

      if(dataOldTrans.status_pembayaran != 'settlement' || dataOldTrans.status != 'process'){
        await this.sendMqtt(`transaksi/status`, { success: false, message: "Status Tidak bisa diubah.", order_id: dataPayload.order_id, statusTransaksi: 'failed'}, 0);
        return;
      }

      const queryCompleteTransaction = `
      SELECT * FROM complete_transaction($1, $2)
      `;

      const resultCompleteTransaction = await db.query(queryCompleteTransaction, [dataPayload.order_id, dataMesin.id]);

      if(!resultCompleteTransaction || resultCompleteTransaction.rows.length === 0){
        throw new InternalServerErrorException("Gagal menyelesaikan order,");
      }


      const { rows: datainventaris } = await db.query(
        `SELECT kode, id, stock 
        FROM slot 
        WHERE stock < 5 
        AND mesin_id = $1`,
        [dataMesin.id]
      );

      if(!datainventaris || datainventaris.length === 0){
        throw new InternalServerErrorException("Gagal mengambil data inventaris");
      }

      if(datainventaris.length > 0 ){
        // ✅ Benar & aman
        const { rows: existingTask } = await db.query(
          `SELECT id FROM task
          WHERE mesin_id = $1 
          AND tipe_tugas = 'restock' 
          AND status = ANY($2::status_tugas[])`,
          [dataMesin.id, ["pending", "assigned", "in_progress"]]
        );

        
        if (!existingTask || existingTask.length === 0) {
          const lowStockItem = datainventaris.length === 1 ? datainventaris[0].kode : "beberapa slot";
          const date = new Date();
          date.setHours(23, 59, 59, 999);

          await db.query(`INSERT INTO task (
            judul, 
            status,
            prioritas,
            dibuat_oleh,
            mesin_id,
            tipe_tugas
            ) VALUES (
              $1,
              'pending',
              'medium',
              'system',
              $2,
              'restock' 
            )`
          , [`Restock ${dataMesin.nama} pada ${lowStockItem}`, dataMesin.id])
        }
      }

      const payload = {
        success: true,
        message: "Berhasil menyelesaikan transaksi.",
        order_id: dataPayload.order_id,
        statusTransaksi: 'complete'
      };

      await db.query(`
        INSERT INTO log_mesin (
          mesin_id,
          tipe,
          payload
        ) VALUES (
          $1, 
          $2, 
          $3 
        )`, [dataMesin?.id, dataPayload.status, {
            kode: dataMesin.kode,
            message: `Mesin menyelesaikan order ${dataPayload.order_id}`,
            waktu: new Date(Date.now()).toISOString(),
          }])

      await this.sendMqtt(`transaksi/status`, payload, 0);

      return { success: true, message: 'Order berhasil diselesaikan', code: 200 };
    } catch (err: any) {
      console.log(err)
      // await db.query('ROLLBACK');
      throw err;
    }
  }

  async cancelOrder(dataPayload: any, dataMesin: any) {
    const db = this.databaseService.getClient();

    try {
      await db.query('BEGIN');

      const updateQuery = `
        UPDATE transaksi
        SET status = 'cancel', updated_at = NOW()
        WHERE order_id = $1
        RETURNING *
      `;

      const result = await db.query(updateQuery, [dataPayload.order_id]);

      if (result.rows.length === 0) {
        throw new InternalServerErrorException('Transaksi tidak ditemukan');
      }

      await db.query('COMMIT');

      await this.sendMqtt(`transaksi/${dataMesin.id}`, {
        success: true,
        message: 'Pesanan Dibatalkan',
        status: 'cancel'
      });

      return { success: true, message: 'Order berhasil dibatalkan', code: 200 };
    } catch (err: any) {
      await db.query('ROLLBACK');
      throw err;
    }
  }

  async refundOrder(dataPayload: any, dataMesin: any) {
    const db = this.databaseService.getClient();
    const midtrans = this.midtransService.getClient();

    try {
      await db.query('BEGIN');

      // Request refund ke Midtrans
      const refundResult = await midtrans.refund(dataPayload.order_id);

      if (!refundResult) {
        throw new InternalServerErrorException('Gagal melakukan refund ke Midtrans');
      }

      // Update status transaksi
      const updateQuery = `
        UPDATE transaksi
        SET status = 'cancel', status_pembayaran = 'refunded', updated_at = NOW()
        WHERE order_id = $1
        RETURNING *
      `;

      const result = await db.query(updateQuery, [dataPayload.order_id]);

      if (result.rows.length === 0) {
        throw new InternalServerErrorException('Transaksi tidak ditemukan');
      }

      await db.query('COMMIT');

      await this.sendMqtt(`transaksi/${dataMesin.id}`, {
        success: true,
        message: 'Uang Sudah Dikembalikan',
        status: 'refunded'
      });

      return { success: true, message: 'Refund berhasil diproses', code: 200 };
    } catch (err: any) {
      await db.query('ROLLBACK');
      throw err;
    }
  }
}
