import { z } from 'zod'

export const realPropertySchema = z.object({
    pin: z.string().min(1, 'PIN is required'),
    owner: z.string().min(1, 'Owner is required'),
    taxdecnumber: z.string().min(1, 'Tax Declaration Number is required'),
    tctOct: z.string().min(1, 'TCT/OCT Number is required'),
    location: z.string().min(1, 'Location is required'),
    lotNumber: z.string().min(1, 'Lot Number is required'),
    area: z.coerce.number().min(0, 'Area must be a positive number'),
    marketValue: z.coerce.number().min(0, 'Market Value must be a positive number'),
})

const numberField = z
    .union([z.string(), z.number()])
    .transform((val) => (val === undefined || val === "" ? 0 : Number(val)));

export const transferTaxSchema = z.object({
    transferee: z.string().min(1),
    transferor: z.string().min(1),
    transactionType: z.string().min(1),

    considerationValue: numberField.default(0),
    totalMarketValue: numberField.default(0),
    taxBase: numberField.default(0),
    taxDue: numberField.default(0),
    surcharge: numberField.default(0),
    interest: numberField.default(0),
    totalAmountDue: numberField.default(0),

    paymentStatus: z.string().default("UNPAID"),
    transactionDate: z.coerce.date().optional(),
    validUntil: z.string().default("N/A"),
});

export const transferTaxDetailSchema = z.object({
    id: z.string().min(1),
    taxdecnumber: z.string().min(1),
    lotNumber: z.string().min(1),
    owner: z.string().min(1),
    marketValue: numberField,
    area: numberField,
});

export const notarialDocumentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    number: z.string().min(1, "Number is required"),
    date: z.coerce.date().optional(),
    notarizedBy: z.string().min(1, "Notarized By is required"),
    document_url: z.string().optional()
});

export const transferTaxFormSchema = z.object({
    documentInfo: notarialDocumentSchema,
    transferTaxInfo: transferTaxSchema,
    transferTaxDetails: z.array(transferTaxDetailSchema).min(1)
});
