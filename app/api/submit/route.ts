import sgMail from "@sendgrid/mail";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parents, students } from "@/lib/schema";
import {
  parentDetailsSchema,
  studentDetailsSchema,
  emergencyContactSchema,
  medicalDetailsSchema,
  collectionArrangementsSchema,
  agreementsSchema,
} from "@/lib/validations";

const SENDGRID_TEMPLATE_ID = "d-6817f876ad7145f6bf4b7368693b26ab";

/**
 * Form → database mapping (validation key → table.column)
 *
 * PARENTS table:
 *   firstName, lastName, email, primaryContactNumber → first_name, last_name, email, contact_number
 *   relationshipToChild → relationship
 *   secondaryContactNumber → secondary_contact_number
 *   addressLine1, addressLine2, town, postCode → address_line_1, address_line_2, town, post_code
 *   emergencyContact* (step 3) → emergency_first_name, emergency_last_name, emergency_relation, emergency_contact
 *   termsAgreed, infoAccurateAgreed (step 6) → terms, acknowledgement (timestamps)
 *
 * STUDENTS table:
 *   childFirstName, childLastName, dateOfBirth → first_name, last_name, dob
 *   currentSchool, currentYearGroup → current_school, current_year_group
 *   senAdditionalNeeds, examBoard → sen_needs, exam_board
 *   medicalConditionsYesNo + medicalConditionsDetails → medical_conditions (when yes)
 *   medicationYesNo + medicationDetails → medication (when yes)
 *   whoCollectsChild → collector_name
 *   allowedToLeaveIndependently ("yes"|"no") → leave_independantly (boolean)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const flat = body.parent ? { ...body.parent, ...body.student } : body;

    const step1Result = parentDetailsSchema.safeParse(flat);
    if (!step1Result.success) {
      const firstError = step1Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const step2Result = studentDetailsSchema.safeParse(flat);
    if (!step2Result.success) {
      const firstError = step2Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const step3Result = emergencyContactSchema.safeParse(flat);
    if (!step3Result.success) {
      const firstError = step3Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const step4Result = medicalDetailsSchema.safeParse(flat);
    if (!step4Result.success) {
      const firstError = step4Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const step5Result = collectionArrangementsSchema.safeParse(flat);
    if (!step5Result.success) {
      const firstError = step5Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const step6Result = agreementsSchema.safeParse(flat);
    if (!step6Result.success) {
      const firstError = step6Result.error.flatten().fieldErrors;
      const message =
        Object.values(firstError)[0]?.[0] ?? "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const p = step1Result.data;
    const s = step2Result.data;
    const e = step3Result.data;
    const m = step4Result.data;
    const c = step5Result.data;

    const agreedAt = new Date();

    // Step 1: Create parent first. .returning() returns the inserted row(s) so we get the new parent's id.
    const [parent] = await db
      .insert(parents)
      .values({
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        email: p.email.trim().toLowerCase(),
        contactNumber: p.primaryContactNumber.trim(),
        relationship: p.relationshipToChild,
        secondaryContactNumber: p.secondaryContactNumber?.trim() || null,
        addressLine1: p.addressLine1.trim(),
        addressLine2: p.addressLine2?.trim() || null,
        town: p.town.trim(),
        postCode: p.postCode.trim(),
        emergencyFirstName: e.emergencyContactFirstName.trim(),
        emergencyLastName: e.emergencyContactLastName.trim(),
        emergencyRelation: e.emergencyContactRelationship.trim(),
        emergencyContact: e.emergencyContactNumber.trim(),
        terms: agreedAt,
        acknowledgement: agreedAt,
      })
      .returning();

    if (!parent) {
      return NextResponse.json(
        { error: "Failed to create parent record" },
        { status: 500 }
      );
    }

    // Step 2: Create student linked to the new parent using parent.id from step 1.
    const leaveIndependantly =
      c.allowedToLeaveIndependently === "yes"
        ? true
        : c.allowedToLeaveIndependently === "no"
          ? false
          : null;

    await db.insert(students).values({
      parentId: parent.id,
      firstName: s.childFirstName.trim(),
      lastName: s.childLastName.trim(),
      dob: s.dateOfBirth.trim() || null,
      currentSchool: s.currentSchool.trim() || null,
      currentYearGroup: s.currentYearGroup.trim() || null,
      senNeeds: s.senAdditionalNeeds?.trim() || null,
      examBoard: s.examBoard?.trim() || null,
      medicalConditions:
        m.medicalConditionsYesNo === "yes" ? (m.medicalConditionsDetails?.trim() || null) : null,
      medication:
        m.medicationYesNo === "yes" ? (m.medicationDetails?.trim() || null) : null,
      collectorName: c.whoCollectsChild?.trim() || null,
      leaveIndependantly,
    });

    // Send confirmation email to parent via SendGrid template
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (apiKey && fromEmail) {
      sgMail.setApiKey(apiKey);
      try {
        await sgMail.send({
          to: parent.email,
          from: fromEmail,
          templateId: SENDGRID_TEMPLATE_ID,
          dynamicTemplateData: {
            parent_name: parent.firstName,
          },
        });
      } catch (emailErr) {
        console.error("SendGrid confirmation email failed:", emailErr);
        // Still return success so the sign-up is not lost; email is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      parentId: parent.id,
    });
  } catch (err) {
    console.error("Submit error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const isDuplicateEmail = message.includes("parents_email_key");
    if (isDuplicateEmail) {
      return NextResponse.json(
        {
          error:
            "An account with this email address has already been registered. Please use a different email or contact us if you need help.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save your details. Please try again." },
      { status: 500 }
    );
  }
}
