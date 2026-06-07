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
  }
};
