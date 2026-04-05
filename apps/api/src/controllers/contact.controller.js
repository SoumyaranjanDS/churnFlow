const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { contactSchema } = require("../validators/contact.validator");
const { sendContactEmail } = require("../services/email.service");

const submitContact = asyncHandler(async (req, res) => {
  const payload = contactSchema.parse(req.body);

  const result = await sendContactEmail({
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    company: payload.company?.trim() || "",
    message: payload.message.trim()
  });

  return apiResponse(req, res, 201, "Message received. Our team will contact you soon.", {
    deliveryMode: result.mode,
    delivered: result.delivered
  });
});

module.exports = { submitContact };
