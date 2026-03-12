"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parentDetailsSchema,
  studentDetailsSchema,
  emergencyContactSchema,
  medicalDetailsSchema,
  collectionArrangementsSchema,
  agreementsSchema,
  type ParentDetails,
  type StudentDetails,
  type EmergencyContactDetails,
  type MedicalDetails,
  type CollectionArrangementsDetails,
  type AgreementsDetails,
} from "@/lib/validations";

const STEPS = [
  { number: 1, title: "Parent/Guardian Details" },
  { number: 2, title: "Student Details" },
  { number: 3, title: "Emergency Contact" },
  { number: 4, title: "Medical Details" },
  { number: 5, title: "Collection Arrangements" },
  { number: 6, title: "Agreements" },
] as const;

const DRAFT_STORAGE_KEY = "bft-parent-signup-draft";
const DRAFT_DEBOUNCE_MS = 400;

const RELATIONSHIP_OPTIONS: { value: ParentDetails["relationshipToChild"]; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Guardian" },
  { value: "carer", label: "Carer" },
  { value: "other", label: "Other" },
];

/** Form state: relationship + medical radios can be empty before selection */
type FormData = Omit<ParentDetails, "relationshipToChild"> & {
  relationshipToChild?: ParentDetails["relationshipToChild"] | "";
} & StudentDetails &
  EmergencyContactDetails &
  Omit<MedicalDetails, "medicalConditionsYesNo" | "medicationYesNo"> & {
    medicalConditionsYesNo?: MedicalDetails["medicalConditionsYesNo"] | "";
    medicationYesNo?: MedicalDetails["medicationYesNo"] | "";
  } &
  Omit<CollectionArrangementsDetails, "allowedToLeaveIndependently"> & {
    allowedToLeaveIndependently?: "yes" | "no" | "";
  } &
  Omit<AgreementsDetails, "termsAgreed" | "infoAccurateAgreed"> & {
    termsAgreed?: boolean;
    infoAccurateAgreed?: boolean;
  } &
  Record<string, unknown>;

const defaultValues: FormData = {
  firstName: "",
  lastName: "",
  relationshipToChild: "",
  email: "",
  primaryContactNumber: "",
  secondaryContactNumber: "",
  addressLine1: "",
  addressLine2: "",
  town: "",
  postCode: "",
  childFirstName: "",
  childLastName: "",
  dateOfBirth: "",
  currentSchool: "",
  currentYearGroup: "",
  senAdditionalNeeds: "",
  examBoard: "",
  emergencyContactFirstName: "",
  emergencyContactLastName: "",
  emergencyContactRelationship: "",
  emergencyContactNumber: "",
  medicalConditionsYesNo: "",
  medicalConditionsDetails: "",
  medicationYesNo: "",
  medicationDetails: "",
  whoCollectsChild: "",
  allowedToLeaveIndependently: "",
  termsAgreed: false,
  infoAccurateAgreed: false,
};

type ParentSignUpFormProps = {
  termsContent: string;
};

export function ParentSignUpForm({ termsContent }: ParentSignUpFormProps) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    defaultValues,
    mode: "onBlur",
  });

  const allValues = watch();
  const isSuccessRef = useRef(false);

  // Hydrate form from localStorage on mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(DRAFT_STORAGE_KEY) : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormData>;
      if (parsed && typeof parsed === "object") {
        const merged = { ...defaultValues, ...parsed } as FormData;
        reset(merged);
      }
    } catch {
      // Invalid or missing draft; keep default values
    }
  }, [reset]);

  // Persist form values to localStorage (debounced). Skip when already submitted successfully.
  useEffect(() => {
    if (isSuccessRef.current) return;
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(allValues));
        }
      } catch {
        // quota exceeded or disabled
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [allValues]);

  const medicalConditionsYesNo = watch("medicalConditionsYesNo");
  const medicationYesNo = watch("medicationYesNo");

  function validateStep1(): boolean {
    const result = parentDetailsSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep2(): boolean {
    const result = studentDetailsSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep3(): boolean {
    const result = emergencyContactSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep4(): boolean {
    const result = medicalDetailsSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep5(): boolean {
    const result = collectionArrangementsSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep6(): boolean {
    const result = agreementsSchema.safeParse(getValues());
    if (!result.success) {
      const firstError = result.error.flatten().fieldErrors;
      const firstMessage = Object.values(firstError)[0]?.[0];
      setErrorMessage(firstMessage ?? "Please check the form and try again.");
      setStatus("error");
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function onNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    if (step === 5 && !validateStep5()) return;
    if (step === 6 && !validateStep6()) return;
    setStep((s) => Math.min(s + 1, 6));
    setErrorMessage(null);
  }

  async function onFinalSubmit(data: FormData) {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error ?? "Something went wrong");
        setStatus("error");
        return;
      }

      isSuccessRef.current = true;
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="form-section" aria-labelledby="form-heading">
        <div className="message message-success" role="alert">
          Thank you. Your details have been submitted successfully.
        </div>
      </section>
    );
  }

  return (
    <section className="form-section" aria-labelledby="form-heading">
      <h2 id="form-heading" className="visually-hidden">
        New Starter Form
      </h2>

      <div className="form-steps" role="tablist" aria-label="Form sections">
        {STEPS.map((s) => (
          <div
            key={s.number}
            className={`form-step-indicator ${step === s.number ? "form-step-indicator--current" : ""} ${step > s.number ? "form-step-indicator--done" : ""}`}
            aria-current={step === s.number ? "step" : undefined}
          >
            <span className="form-step-indicator__number">{s.number}</span>
            <span className="form-step-indicator__title">{s.title}</span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="message message-error" role="alert">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onFinalSubmit)}
        className="signup-form"
        noValidate
      >
        {/* Step 1: Parent/Guardian Details */}
        {step === 1 && (
          <fieldset className="form-step" aria-labelledby="step-1-heading">
            <legend id="step-1-heading" className="form-step__heading">
              Parent/Guardian Details
            </legend>

            <div className="form-field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                {...register("firstName", { required: "First name is required" })}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <span id="firstName-error" className="form-field__error" role="alert">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                {...register("lastName", { required: "Last name is required" })}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
              />
              {errors.lastName && (
                <span id="lastName-error" className="form-field__error" role="alert">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="relationshipToChild">Relationship to Child</label>
              <select
                id="relationshipToChild"
                {...register("relationshipToChild", {
                  required: "Please select your relationship to the child",
                })}
                aria-invalid={!!errors.relationshipToChild}
                aria-describedby={errors.relationshipToChild ? "relationshipToChild-error" : undefined}
              >
                <option value="">Select…</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.relationshipToChild && (
                <span id="relationshipToChild-error" className="form-field__error" role="alert">
                  {errors.relationshipToChild.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className="form-field__error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="primaryContactNumber">Primary Contact Number</label>
              <input
                id="primaryContactNumber"
                type="tel"
                autoComplete="tel"
                {...register("primaryContactNumber", {
                  required: "Primary contact number is required",
                })}
                aria-invalid={!!errors.primaryContactNumber}
                aria-describedby={errors.primaryContactNumber ? "primaryContactNumber-error" : undefined}
              />
              {errors.primaryContactNumber && (
                <span id="primaryContactNumber-error" className="form-field__error" role="alert">
                  {errors.primaryContactNumber.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="secondaryContactNumber">Secondary Contact Number</label>
              <input
                id="secondaryContactNumber"
                type="tel"
                autoComplete="tel-national"
                {...register("secondaryContactNumber")}
              />
            </div>

            <div className="form-field">
              <label htmlFor="addressLine1">Address Line 1</label>
              <input
                id="addressLine1"
                type="text"
                autoComplete="address-line1"
                {...register("addressLine1", { required: "Address line 1 is required" })}
                aria-invalid={!!errors.addressLine1}
                aria-describedby={errors.addressLine1 ? "addressLine1-error" : undefined}
              />
              {errors.addressLine1 && (
                <span id="addressLine1-error" className="form-field__error" role="alert">
                  {errors.addressLine1.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="addressLine2">Address Line 2</label>
              <input
                id="addressLine2"
                type="text"
                autoComplete="address-line2"
                {...register("addressLine2")}
              />
            </div>

            <div className="form-field">
              <label htmlFor="town">Town</label>
              <input
                id="town"
                type="text"
                autoComplete="address-level2"
                {...register("town", { required: "Town is required" })}
                aria-invalid={!!errors.town}
                aria-describedby={errors.town ? "town-error" : undefined}
              />
              {errors.town && (
                <span id="town-error" className="form-field__error" role="alert">
                  {errors.town.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="postCode">Post Code</label>
              <input
                id="postCode"
                type="text"
                autoComplete="postal-code"
                {...register("postCode", { required: "Post code is required" })}
                aria-invalid={!!errors.postCode}
                aria-describedby={errors.postCode ? "postCode-error" : undefined}
              />
              {errors.postCode && (
                <span id="postCode-error" className="form-field__error" role="alert">
                  {errors.postCode.message}
                </span>
              )}
            </div>
          </fieldset>
        )}

        {/* Step 2: Student Details */}
        {step === 2 && (
          <fieldset className="form-step" aria-labelledby="step-2-heading">
            <legend id="step-2-heading" className="form-step__heading">
              Student Details
            </legend>

            <div className="form-field">
              <label htmlFor="childFirstName">First Name</label>
              <input
                id="childFirstName"
                type="text"
                autoComplete="off"
                {...register("childFirstName", { required: "First name is required" })}
                aria-invalid={!!errors.childFirstName}
                aria-describedby={errors.childFirstName ? "childFirstName-error" : undefined}
              />
              {errors.childFirstName && (
                <span id="childFirstName-error" className="form-field__error" role="alert">
                  {errors.childFirstName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="childLastName">Last Name</label>
              <input
                id="childLastName"
                type="text"
                autoComplete="off"
                {...register("childLastName", { required: "Last name is required" })}
                aria-invalid={!!errors.childLastName}
                aria-describedby={errors.childLastName ? "childLastName-error" : undefined}
              />
              {errors.childLastName && (
                <span id="childLastName-error" className="form-field__error" role="alert">
                  {errors.childLastName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth", { required: "Date of birth is required" })}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
              />
              {errors.dateOfBirth && (
                <span id="dateOfBirth-error" className="form-field__error" role="alert">
                  {errors.dateOfBirth.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="currentSchool">Current School</label>
              <input
                id="currentSchool"
                type="text"
                autoComplete="organization"
                {...register("currentSchool", { required: "Current school is required" })}
                aria-invalid={!!errors.currentSchool}
                aria-describedby={errors.currentSchool ? "currentSchool-error" : undefined}
              />
              {errors.currentSchool && (
                <span id="currentSchool-error" className="form-field__error" role="alert">
                  {errors.currentSchool.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="currentYearGroup">Current Year Group</label>
              <input
                id="currentYearGroup"
                type="text"
                placeholder="e.g. Year 7"
                {...register("currentYearGroup", { required: "Current year group is required" })}
                aria-invalid={!!errors.currentYearGroup}
                aria-describedby={errors.currentYearGroup ? "currentYearGroup-error" : undefined}
              />
              {errors.currentYearGroup && (
                <span id="currentYearGroup-error" className="form-field__error" role="alert">
                  {errors.currentYearGroup.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="senAdditionalNeeds">Any SEN / Additional Needs (optional)</label>
              <textarea
                id="senAdditionalNeeds"
                rows={4}
                {...register("senAdditionalNeeds")}
                aria-describedby="senAdditionalNeeds-hint"
              />
              <span id="senAdditionalNeeds-hint" className="form-field__hint">
                Please share any relevant information that will help us support the student.
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="examBoard">Exam Board (optional)</label>
              <input
                id="examBoard"
                type="text"
                placeholder="e.g. AQA, Edexcel, OCR"
                {...register("examBoard")}
              />
            </div>
          </fieldset>
        )}

        {/* Step 3: Emergency Contact */}
        {step === 3 && (
          <fieldset className="form-step" aria-labelledby="step-3-heading">
            <legend id="step-3-heading" className="form-step__heading">
              Emergency Contact
            </legend>
            <p>If I am unable to reach you, I will contact your emergency contact.</p>
            <div className="form-field">
              <label htmlFor="emergencyContactFirstName">First Name</label>
              <input
                id="emergencyContactFirstName"
                type="text"
                autoComplete="off"
                {...register("emergencyContactFirstName", {
                  required: "First name is required",
                })}
                aria-invalid={!!errors.emergencyContactFirstName}
                aria-describedby={
                  errors.emergencyContactFirstName ? "emergencyContactFirstName-error" : undefined
                }
              />
              {errors.emergencyContactFirstName && (
                <span
                  id="emergencyContactFirstName-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.emergencyContactFirstName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="emergencyContactLastName">Last Name</label>
              <input
                id="emergencyContactLastName"
                type="text"
                autoComplete="off"
                {...register("emergencyContactLastName", {
                  required: "Last name is required",
                })}
                aria-invalid={!!errors.emergencyContactLastName}
                aria-describedby={
                  errors.emergencyContactLastName ? "emergencyContactLastName-error" : undefined
                }
              />
              {errors.emergencyContactLastName && (
                <span
                  id="emergencyContactLastName-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.emergencyContactLastName.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="emergencyContactRelationship">Relationship to Child</label>
              <input
                id="emergencyContactRelationship"
                type="text"
                placeholder="e.g. Grandparent, Aunt, Family friend"
                {...register("emergencyContactRelationship", {
                  required: "Relationship to child is required",
                })}
                aria-invalid={!!errors.emergencyContactRelationship}
                aria-describedby={
                  errors.emergencyContactRelationship
                    ? "emergencyContactRelationship-error"
                    : undefined
                }
              />
              {errors.emergencyContactRelationship && (
                <span
                  id="emergencyContactRelationship-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.emergencyContactRelationship.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="emergencyContactNumber">Emergency Contact Number</label>
              <input
                id="emergencyContactNumber"
                type="tel"
                autoComplete="tel"
                {...register("emergencyContactNumber", {
                  required: "Emergency contact number is required",
                })}
                aria-invalid={!!errors.emergencyContactNumber}
                aria-describedby={
                  errors.emergencyContactNumber ? "emergencyContactNumber-error" : undefined
                }
              />
              {errors.emergencyContactNumber && (
                <span
                  id="emergencyContactNumber-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.emergencyContactNumber.message}
                </span>
              )}
            </div>
          </fieldset>
        )}

        {/* Step 4: Medical Details */}
        {step === 4 && (
          <fieldset className="form-step" aria-labelledby="step-4-heading">
            <legend id="step-4-heading" className="form-step__heading">
              Medical Details
            </legend>

            <div className="form-field form-field--radio-group">
              <span className="form-field__label" id="medical-conditions-label">
                Does your child have any medical conditions, allergies, or health concerns I should
                be aware of?
              </span>
              <div
                className="form-radio-group"
                role="radiogroup"
                aria-labelledby="medical-conditions-label"
                aria-invalid={!!errors.medicalConditionsYesNo}
                aria-describedby={
                  errors.medicalConditionsYesNo ? "medicalConditionsYesNo-error" : undefined
                }
              >
                <label className="form-radio">
                  <input
                    type="radio"
                    value="yes"
                    {...register("medicalConditionsYesNo", {
                      required: "Please select Yes or No",
                    })}
                  />
                  <span>Yes</span>
                </label>
                <label className="form-radio">
                  <input
                    type="radio"
                    value="no"
                    {...register("medicalConditionsYesNo", {
                      required: "Please select Yes or No",
                    })}
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.medicalConditionsYesNo && (
                <span
                  id="medicalConditionsYesNo-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.medicalConditionsYesNo.message}
                </span>
              )}
            </div>

            {medicalConditionsYesNo === "yes" && (
              <div className="form-field">
                <label htmlFor="medicalConditionsDetails">Please provide details:</label>
                <textarea
                  id="medicalConditionsDetails"
                  rows={4}
                  {...register("medicalConditionsDetails")}
                />
              </div>
            )}

            <div className="form-field form-field--radio-group">
              <span className="form-field__label" id="medication-label">
                Is your child currently taking any medication that may affect learning or behaviour?
              </span>
              <div
                className="form-radio-group"
                role="radiogroup"
                aria-labelledby="medication-label"
                aria-invalid={!!errors.medicationYesNo}
                aria-describedby={
                  errors.medicationYesNo ? "medicationYesNo-error" : undefined
                }
              >
                <label className="form-radio">
                  <input
                    type="radio"
                    value="yes"
                    {...register("medicationYesNo", {
                      required: "Please select Yes or No",
                    })}
                  />
                  <span>Yes</span>
                </label>
                <label className="form-radio">
                  <input
                    type="radio"
                    value="no"
                    {...register("medicationYesNo", {
                      required: "Please select Yes or No",
                    })}
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.medicationYesNo && (
                <span id="medicationYesNo-error" className="form-field__error" role="alert">
                  {errors.medicationYesNo.message}
                </span>
              )}
            </div>

            {medicationYesNo === "yes" && (
              <div className="form-field">
                <label htmlFor="medicationDetails">Please provide details:</label>
                <textarea
                  id="medicationDetails"
                  rows={4}
                  {...register("medicationDetails")}
                />
              </div>
            )}
          </fieldset>
        )}

        {/* Step 5: Collection Arrangements */}
        {step === 5 && (
          <fieldset className="form-step" aria-labelledby="step-5-heading">
            <legend id="step-5-heading" className="form-step__heading">
              Collection Arrangements (For in-person tuition)
            </legend>

            <div className="form-field">
              <label htmlFor="whoCollectsChild">
                Who will collect your child? <span className="form-field__optional">(optional)</span>
              </label>
              <input
                id="whoCollectsChild"
                type="text"
                placeholder="e.g. Parent, Grandparent, Childminder"
                {...register("whoCollectsChild")}
              />
            </div>

            <div className="form-field form-field--radio-group">
              <span className="form-field__label" id="leave-independently-label">
                Is your child allowed to leave independently?{" "}
                <span className="form-field__optional">(optional)</span>
              </span>
              <div
                className="form-radio-group"
                role="radiogroup"
                aria-labelledby="leave-independently-label"
              >
                <label className="form-radio">
                  <input type="radio" value="yes" {...register("allowedToLeaveIndependently")} />
                  <span>Yes</span>
                </label>
                <label className="form-radio">
                  <input type="radio" value="no" {...register("allowedToLeaveIndependently")} />
                  <span>No</span>
                </label>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 6: Agreements */}
        {step === 6 && (
          <fieldset className="form-step" aria-labelledby="step-6-heading">
            <legend id="step-6-heading" className="form-step__heading">
              Agreements
            </legend>

            <div className="form-field">
              <span className="form-field__label" id="terms-label">
                Terms and conditions
              </span>
              <div
                className="terms-scroll"
                role="region"
                aria-labelledby="terms-label"
                tabIndex={0}
              >
                <div className="terms-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{termsContent}</ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="form-field form-field--checkbox">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  {...register("termsAgreed", {
                    required: "You must agree to the terms and conditions",
                  })}
                  aria-invalid={!!errors.termsAgreed}
                  aria-describedby={errors.termsAgreed ? "termsAgreed-error" : undefined}
                />
                <span>I have read and agree to the terms and conditions above.</span>
              </label>
              {errors.termsAgreed && (
                <span id="termsAgreed-error" className="form-field__error" role="alert">
                  {errors.termsAgreed.message}
                </span>
              )}
            </div>

            <div className="form-field form-field--checkbox">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  {...register("infoAccurateAgreed", {
                    required:
                      "You must confirm that the information provided is accurate and that you will inform Brighter Futures Tutoring of any changes",
                  })}
                  aria-invalid={!!errors.infoAccurateAgreed}
                  aria-describedby={
                    errors.infoAccurateAgreed ? "infoAccurateAgreed-error" : undefined
                  }
                />
                <span>
                  I confirm that the information provided is accurate to the best of my knowledge. I
                  understand that it is my responsibility to inform Brighter Futures Tutoring of any
                  changes.
                </span>
              </label>
              {errors.infoAccurateAgreed && (
                <span
                  id="infoAccurateAgreed-error"
                  className="form-field__error"
                  role="alert"
                >
                  {errors.infoAccurateAgreed.message}
                </span>
              )}
            </div>
          </fieldset>
        )}

        <div className="form-actions form-actions--between">
          {step > 1 ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </button>
          ) : (
            <span />
          )}
          {step < 6 ? (
            <button
              type="button"
              className="button button-primary"
              onClick={onNext}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="button button-primary"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
