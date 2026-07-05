import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { documentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(config.documentStoragePath, req.params.familyId);
    await fs.promises.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/', documentController.listDocuments);
router.post('/', upload.single('file'), documentController.createDocument);
router.get('/:documentId/download', documentController.downloadDocument);

export default router;
