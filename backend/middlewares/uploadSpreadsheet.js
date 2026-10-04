import multer from "multer";

const ALLOWED = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || "").toLowerCase();
    const okExt = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!okExt && !ALLOWED.has(file.mimetype)) {
      cb(new Error("Only CSV or Excel (.xlsx) files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export default uploadSpreadsheet;
