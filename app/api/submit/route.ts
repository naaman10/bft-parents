import { readFile } from "fs/promises";
import path from "path";
import { and, eq, sql } from "drizzle-orm";
import { Resend } from "resend";
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

const RESEND_TEMPLATE_ID = "new-starter";

const DUPLICATE_STUDENT_MESSAGE =
  "This student is already registered with this email address. You can submit the form again to add a different child.";

function errorText(err: unknown): string {
  if (err instanceof Error) {
    const cause = err.cause ? errorText(err.cause) : "";
    return `${err.message} ${cause}`;
  }
  return String(err);
}

function isDuplicateEmailError(err: unknown) {
  return errorText(err).includes("parents_email_key");
}

/** Match an existing parent by email, ignoring case and surrounding spaces. */
async function findParentByEmail(email: string) {
  const [parent] = await db
    .select()
    .from(parents)
    .where(sql`lower(btrim(${parents.email})) = ${email}`)
    .limit(1);
  return parent;
}

/**
 * A student already belongs to this parent when first name, last name, and
 * date of birth match. A different child, including one who shares a name
 * but has a different date of birth, can still be registered.
 */
async function findStudentForParent(
  parentId: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string
) {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.parentId, parentId),
        sql`lower(btrim(${students.firstName})) = ${firstName.toLowerCase()}`,
        sql`lower(btrim(${students.lastName})) = ${lastName.toLowerCase()}`,
        eq(students.dob, dateOfBirth)
      )
    )
    .limit(1);
  return student;
}

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
 *   content/terms-and-conditions.md (server-read at submit) → terms_text
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

    let termsText: string;
    try {
      termsText = await readFile(
        path.join(process.cwd(), "content/terms-and-conditions.md"),
        "utf-8"
      );
    } catch (readErr) {
      console.error("Failed to read terms-and-conditions.md:", readErr);
      return NextResponse.json(
        { error: "Failed to save your details. Please try again." },
        { status: 500 }
      );
    }

    const email = p.email.trim().toLowerCase();
    const childFirstName = s.childFirstName.trim();
    const childLastName = s.childLastName.trim();
    const dateOfBirth = s.dateOfBirth.trim();

    const parentDetails = {
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
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
      termsText,
      updatedAt: agreedAt,
    };

    // Reuse the parent when this email has already signed up, so another child
    // can be added. Email stays unique; students are added under that parent.
    let parent = await findParentByEmail(email);
    let createdNewParent = false;

    if (!parent) {
      try {
        const [created] = await db
          .insert(parents)
          .values({
            email,
            ...parentDetails,
          })
          .returning();
        parent = created;
        createdNewParent = Boolean(created);
      } catch (insertErr) {
        if (!isDuplicateEmailError(insertErr)) throw insertErr;
        parent = await findParentByEmail(email);
      }
    }

    if (!parent) {
      return NextResponse.json(
        { error: "Failed to create parent record" },
        { status: 500 }
      );
    }

    if (!createdNewParent) {
      const existingStudent = await findStudentForParent(
        parent.id,
        childFirstName,
        childLastName,
        dateOfBirth
      );
      if (existingStudent) {
        return NextResponse.json({ error: DUPLICATE_STUDENT_MESSAGE }, { status: 409 });
      }

      const [updated] = await db
        .update(parents)
        .set(parentDetails)
        .where(eq(parents.id, parent.id))
        .returning();
      if (updated) parent = updated;
    }

    const leaveIndependantly =
      c.allowedToLeaveIndependently === "yes"
        ? true
        : c.allowedToLeaveIndependently === "no"
          ? false
          : null;

    await db.insert(students).values({
      parentId: parent.id,
      firstName: childFirstName,
      lastName: childLastName,
      dob: dateOfBirth,
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

    // Send confirmation email to parent via Resend template
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (apiKey && fromEmail) {
      const resend = new Resend(apiKey);
      try {
        await resend.emails.send({
          from: fromEmail,
          to: parent.email,
          subject: "Welcome to Brighter Futures Tutoring",
          template: RESEND_TEMPLATE_ID,
          template_data: {
            parent_name: parent.firstName,
          },
        } as any);
      } catch (emailErr) {
        console.error("Resend confirmation email failed:", emailErr);
        // Still return success so the sign-up is not lost; email is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      parentId: parent.id,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Failed to save your details. Please try again." },
      { status: 500 }
    );
  }
}
