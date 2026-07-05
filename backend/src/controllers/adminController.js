import fs from 'fs';
import { adminService } from '../services/admin/adminService.js';
import { auditService } from '../services/admin/auditService.js';
import { pool } from '../db/pool.js';
import { NotFoundError } from '../utils/errors.js';

function getIpAddress(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}

export const adminController = {
  async login(req, res, next) {
    try {
      const ipAddress = getIpAddress(req);
      const result = await adminService.adminLogin(req.body, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getDashboard(req, res, next) {
    try {
      const result = await adminService.getDashboardStats();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Families
  async listFamilies(req, res, next) {
    try {
      const { search = '', page = 0, size = 10 } = req.query;
      const result = await adminService.listFamilies(search, Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getFamilyDetails(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await adminService.getFamilyDetails(familyId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateFamilyStatus(req, res, next) {
    try {
      const { familyId } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'
      const ipAddress = getIpAddress(req);
      const result = await adminService.updateFamilyStatus(familyId, status, req.user.id, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteFamily(req, res, next) {
    try {
      const { familyId } = req.params;
      const ipAddress = getIpAddress(req);
      const result = await adminService.deleteFamily(familyId, req.user.id, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Users
  async listUsers(req, res, next) {
    try {
      const { search = '', page = 0, size = 10 } = req.query;
      const result = await adminService.listUsers(search, Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await adminService.getUserDetails(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'SUSPENDED'
      const ipAddress = getIpAddress(req);
      const result = await adminService.updateUserStatus(userId, status, req.user.id, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Transactions
  async listTransactions(req, res, next) {
    try {
      const { familyId, userId, categoryName, merchant, type, startDate, endDate, page = 0, size = 20 } = req.query;
      const filters = { familyId, userId, categoryName, merchant, type, startDate, endDate };
      const result = await adminService.listAllTransactions(filters, Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Goals
  async listGoals(req, res, next) {
    try {
      const { page = 0, size = 20 } = req.query;
      const result = await adminService.listAllGoals(Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Documents
  async listDocuments(req, res, next) {
    try {
      const { page = 0, size = 20 } = req.query;
      const result = await adminService.listAllDocuments(Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const ipAddress = getIpAddress(req);
      const result = await adminService.deleteDocument(documentId, req.user.id, ipAddress);
      
      // Delete from physical storage
      if (result.storagePath) {
        fs.unlink(result.storagePath, (err) => {
          if (err) {
            console.error('Failed to delete statement file from disk:', err.message);
          } else {
            console.log('Deleted statement file from disk:', result.storagePath);
          }
        });
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async downloadDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      
      const docQuery = 'SELECT * FROM documents WHERE id = $1';
      const docRes = await pool.query(docQuery, [documentId]);
      const document = docRes.rows[0];
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      if (!fs.existsSync(document.storage_path)) {
        throw new NotFoundError('Statement file not found on disk');
      }

      // Serve download
      res.download(document.storage_path, document.file_name);
    } catch (err) {
      next(err);
    }
  },

  // Merchant Registry
  async listMerchants(req, res, next) {
    try {
      const { search = '', page = 0, size = 20 } = req.query;
      const result = await adminService.listMerchants(search, Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateMerchantCategory(req, res, next) {
    try {
      const { merchantId } = req.params;
      const { categoryName, categoryType } = req.body;
      const ipAddress = getIpAddress(req);
      const result = await adminService.updateMerchantCategory(merchantId, categoryName, categoryType, req.user.id, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Feedback explorer
  async listFeedback(req, res, next) {
    try {
      const { type, page = 0, size = 20 } = req.query;
      const result = await adminService.listFeedback({ type }, Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Admin users management
  async listAdmins(req, res, next) {
    try {
      const result = await adminService.listAdmins();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createAdmin(req, res, next) {
    try {
      const ipAddress = getIpAddress(req);
      const result = await adminService.createAdmin(req.body, req.user.id, ipAddress);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdmin(req, res, next) {
    try {
      const { adminId } = req.params;
      const ipAddress = getIpAddress(req);
      const result = await adminService.updateAdmin(adminId, req.body, req.user.id, ipAddress);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Audit Logs
  async listAuditLogs(req, res, next) {
    try {
      const { page = 0, size = 50 } = req.query;
      const result = await auditService.listLogs(Number(page), Number(size));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Analytics
  async getAnalytics(req, res, next) {
    try {
      const result = await adminService.getAnalyticsData();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
