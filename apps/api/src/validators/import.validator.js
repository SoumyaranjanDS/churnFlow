const { z } = require("zod");

const importFromPathSchema = z.object({
  filePath: z.string().min(1).optional(),
  sheetName: z.string().min(1).optional()
});

module.exports = { importFromPathSchema };
