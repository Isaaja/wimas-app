import Joi from "joi";

const FileSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid("application/pdf").required(),
  size: Joi.number().required(),
});

const LoanItemSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const ReportSchema = Joi.object({
  spt_number: Joi.string().required(),
  destination: Joi.string().required(),
  place_of_execution: Joi.string().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref("start_date")).required().messages({
    "date.min": `"end_date" must be greater than or equal to "start_date"`,
  }),
});
const LoanSchemaPayload = Joi.object({
  user: Joi.array().items(Joi.string()).min(1).required(),
  items: Joi.array().items(LoanItemSchema).min(1).required(),
  docs: FileSchema.required(),
  report: ReportSchema.required(),
});

export default LoanSchemaPayload;
