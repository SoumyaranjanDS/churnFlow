const { z } = require("zod");

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(160).optional().default(""),
  message: z.string().min(10).max(4000)
});

module.exports = { contactSchema };
