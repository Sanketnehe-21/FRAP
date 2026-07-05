import { documentService } from '../services/documentService.js';

export const documentController = {
  async listDocuments(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await documentService.listDocuments(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createDocument(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await documentService.createDocument(familyId, req.user.id, req.file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async downloadDocument(req, res, next) {
    try {
      const { familyId, documentId } = req.params;
      const result = await documentService.downloadDocument(familyId, req.user.id, documentId);
      res.download(result.storagePath, result.fileName);
    } catch (err) {
      next(err);
    }
  }
};
