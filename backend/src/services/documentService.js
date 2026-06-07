import { v4 as uuidv4 } from 'uuid';
import { documentModel } from '../models/documentModel.js';
import { familyModel } from '../models/familyModel.js';
import { familyService } from './familyService.js';
import { BadRequestError } from '../utils/errors.js';

export const documentService = {
  resolveDocumentType(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.csv')) return 'CSV';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'EXCEL';
    throw new BadRequestError('Unsupported document type. Use PDF, CSV, or Excel.');
  },

  async listDocuments(familyId, userId) {
    await familyService.verifyMembership(familyId, userId);
    const documents = await documentModel.findByFamilyId(null, familyId);
    return documents.map((d) => ({
      id: d.id,
      familyId: d.family_id,
      fileName: d.file_name,
      documentType: d.document_type,
      fileSizeBytes: Number(d.file_size_bytes),
      uploadedAt: d.uploaded_at,
    }));
  },

  async createDocument(familyId, userId, file) {
    const member = await familyService.verifyMembership(familyId, userId);

    if (!file) {
      throw new BadRequestError('File is empty');
    }

    const documentType = this.resolveDocumentType(file.originalname);
    const id = uuidv4();
    const now = new Date();

    const created = await documentModel.create(null, {
      id,
      familyId,
      uploadedBy: userId,
      fileName: file.originalname,
      storagePath: file.path,
      documentType,
      fileSizeBytes: file.size,
      uploadedAt: now,
    });

    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'DOCUMENT_UPLOADED',
      message: `Uploaded statement: ${file.originalname}`,
    });

    return {
      id: created.id,
      familyId: created.family_id,
      fileName: created.file_name,
      documentType: created.document_type,
      fileSizeBytes: Number(created.file_size_bytes),
      uploadedAt: created.uploaded_at,
    };
  }
};
