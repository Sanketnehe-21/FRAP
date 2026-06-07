import { pool } from '../db/pool.js';

export const documentModel = {
  async create(client, { id, familyId, uploadedBy, fileName, storagePath, documentType, fileSizeBytes, uploadedAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO documents (id, family_id, uploaded_by, file_name, storage_path, document_type, file_size_bytes, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [id, familyId, uploadedBy, fileName, storagePath, documentType, fileSizeBytes, uploadedAt];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByFamilyId(client, familyId) {
    const db = client || pool;
    const query = 'SELECT * FROM documents WHERE family_id = $1 ORDER BY uploaded_at DESC;';
    const result = await db.query(query, [familyId]);
    return result.rows;
  }
};
