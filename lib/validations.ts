import { z } from "zod";

const relationshipOptions = [
  "parent",
  "guardian",
  "carer",
  "other",
] as const;

export const parentDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationshipToChild: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(relationshipOptions, {
      required_error: "Please select your relationship to the child",
    })
  ),
  email: z.string().email("Please enter a valid email address"),
  primaryContactNumber: z.string().min(1, "Primary contact number is required"),
  secondaryContactNumber: z.string().optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  town: z.string().min(1, "Town is required"),
  postCode: z.string().min(1, "Post code is required"),
});

export type ParentDetails = z.infer<typeof parentDetailsSchema>;

export const formStep1Schema = parentDetailsSchema;

/** Student (child) details for step 2 */
export const studentDetailsSchema = z.object({
  childFirstName: z.string().min(1, "First name is required").max(100),
  childLastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Please enter a valid date"),
  currentSchool: z.string().min(1, "Current school is required"),
  currentYearGroup: z.string().min(1, "Current year group is required"),
  senAdditionalNeeds: z.string().optional().or(z.literal("")),
  examBoard: z.string().optional().or(z.literal("")),
});

export type StudentDetails = z.infer<typeof studentDetailsSchema>;

/** Emergency contact details for step 3 */
export const emergencyContactSchema = z.object({
  emergencyContactFirstName: z.string().min(1, "First name is required").max(100),
  emergencyContactLastName: z.string().min(1, "Last name is required").max(100),
  emergencyContactRelationship: z.string().min(1, "Relationship to child is required"),
  emergencyContactNumber: z.string().min(1, "Emergency contact number is required"),
});

export type EmergencyContactDetails = z.infer<typeof emergencyContactSchema>;

const yesNo = ["yes", "no"] as const;

/** Medical details for step 4 */
export const medicalDetailsSchema = z.object({
  medicalConditionsYesNo: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(yesNo, { required_error: "Please select Yes or No" })
  ),
  medicalConditionsDetails: z.string().optional().or(z.literal("")),
  medicationYesNo: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(yesNo, { required_error: "Please select Yes or No" })
  ),
  medicationDetails: z.string().optional().or(z.literal("")),
});

export type MedicalDetails = z.infer<typeof medicalDetailsSchema>;

/** Collection arrangements for step 5 (all optional) */
export const collectionArrangementsSchema = z.object({
  whoCollectsChild: z.string().optional().or(z.literal("")),
  allowedToLeaveIndependently: z
    .enum(yesNo)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type CollectionArrangementsDetails = z.infer<typeof collectionArrangementsSchema>;

/** Agreements for step 6 (both required to submit) */
export const agreementsSchema = z.object({
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
  infoAccurateAgreed: z.literal(true, {
    errorMap: () => ({
      message:
        "You must confirm that the information provided is accurate and that you will inform Brighter Futures Tutoring of any changes",
    }),
  }),
});

export type AgreementsDetails = z.infer<typeof agreementsSchema>;
