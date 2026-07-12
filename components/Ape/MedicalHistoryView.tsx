"use client";

import type { MedicalHistoryTypes } from "@/types";
import {
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  IdentificationIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface Props {
  medicalHistory?: MedicalHistoryTypes | null;
}

const presentHealthItems: Array<{ key: string; label: string }> = [
  { key: "dizziness", label: "Dizziness" },
  { key: "dyspnea", label: "Dyspnea" },
  { key: "chest_back_pain", label: "Chest/Back pain" },
  { key: "easy_fatigability", label: "Easy fatigability" },
  { key: "joint_extremity_pains", label: "Joint/extremity pains" },
  { key: "blurring_of_vision", label: "Blurring of vision" },
  { key: "wearing_eyeglasses", label: "Wearing eyeglasses" },
  { key: "vaginal_discharge_bleeding", label: "Vaginal discharge/bleeding" },
  { key: "lumps", label: "Lumps" },
  { key: "painful_urination", label: "Painful urination" },
  { key: "poor_loss_of_hearing", label: "Poor/loss of hearing" },
  { key: "syncope_fainting", label: "Syncope/fainting" },
  { key: "convulsions", label: "Convulsions" },
  { key: "malaria", label: "Malaria" },
  { key: "goiter", label: "Goiter" },
  { key: "anemia", label: "Anemia" },
];

const personalHistoryItems: Array<{ key: string; label: string }> = [
  { key: "hypertension", label: "Hypertension" },
  { key: "cardiovascular_heart_disease", label: "Cardiovascular Heart Disease" },
  { key: "diabetes_mellitus", label: "Diabetes Mellitus" },
  { key: "kidney_disease", label: "Kidney Disease" },
  { key: "cancer", label: "Cancer" },
  { key: "asthma", label: "Asthma" },
  { key: "allergy", label: "Allergy" },
  { key: "surgical_operations", label: "Surgical Operations" },
  { key: "last_hospitalization", label: "Last hospitalization (reason)" },
  { key: "loss_of_consciousness", label: "Loss of consciousness" },
  { key: "fracture_dislocation", label: "Fracture/Dislocation" },
  { key: "g6pd", label: "G6PD" },
  { key: "other", label: "Other" },
];

// --- small presentational helpers ---

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
    <div className="flex items-center gap-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <span className="text-gray-500 dark:text-gray-300">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200">
        {title}
      </span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-400">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-gray-100">
      {value && value !== "" ? value : "—"}
    </span>
  </div>
);

const StatusBadge = ({ value }: { value?: string }) => {
  if (value === "yes")
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
        Yes
      </span>
    );
  if (value === "no")
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
        No
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-400 dark:bg-gray-700 dark:text-gray-400">
      N/A
    </span>
  );
};

export default function MedicalHistoryView({ medicalHistory }: Props) {
  if (!medicalHistory || Object.keys(medicalHistory).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-xs text-gray-500 italic">
        No Medical History form was submitted for this record.
      </div>
    );
  }

  const header = medicalHistory.header ?? {};
  const ph = medicalHistory.present_health ?? {};
  const personal = medicalHistory.personal_history ?? {};
  const social = medicalHistory.social_history ?? {};
  const obgyn = medicalHistory.obgyn_history ?? {};

  // Collect all "Yes" findings for an at-a-glance summary.
  const reportedFindings: string[] = [];
  if (ph.cough && ph.cough !== "")
    reportedFindings.push(`Cough (${ph.cough})`);
  presentHealthItems.forEach((item) => {
    if ((ph as any)[item.key] === "yes") reportedFindings.push(item.label);
  });
  personalHistoryItems.forEach((item) => {
    const entry = (personal as any)[item.key] ?? {};
    if (entry.value === "yes")
      reportedFindings.push(
        entry.remarks ? `${item.label} (${entry.remarks})` : item.label,
      );
  });
  if (social.smoking === "yes") reportedFindings.push("Smoking");
  if (social.alcohol === "yes") reportedFindings.push("Alcohol");

  return (
    <div className="space-y-3">
      {/* At-a-glance reported findings */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="flex items-center gap-x-2 mb-1.5">
          <SparklesIcon className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Reported Findings
          </span>
        </div>
        {reportedFindings.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            No positive findings reported by the employee.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {reportedFindings.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Personnel Information */}
      <Section
        title="Personnel Information"
        icon={<IdentificationIcon className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Date" value={header.form_date} />
          <Field label="Name" value={header.name} />
          <Field label="Date of Birth" value={header.date_of_birth} />
          <Field label="Age" value={header.age} />
          <Field label="Gender" value={header.gender} />
          <Field label="Civil Status" value={header.civil_status} />
          <Field
            label="School/District/Division"
            value={header.school_district_division}
          />
          <Field
            label="Position/Designation"
            value={header.position_designation}
          />
          <Field label="Years in Service" value={header.years_in_service} />
        </div>
      </Section>

      {/* Present Health Status */}
      <Section
        title="Present Health Status"
        icon={<HeartIcon className="w-4 h-4" />}
      >
        <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700">
          <span className="text-gray-700 dark:text-gray-200">Cough</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {ph.cough && ph.cough !== "" ? ph.cough : "None"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {presentHealthItems.map((item) => {
            const val = (ph as any)[item.key];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700"
              >
                <span
                  className={
                    val === "yes"
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-600 dark:text-gray-300"
                  }
                >
                  {item.label}
                </span>
                <StatusBadge value={val} />
              </div>
            );
          })}
        </div>
        {(ph.others || ph.present_medication) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Others" value={ph.others} />
            <Field
              label="Present Medication taken"
              value={ph.present_medication}
            />
          </div>
        )}
      </Section>

      {/* Personal History */}
      <Section
        title="Personal History"
        icon={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
      >
        <div className="space-y-1">
          {personalHistoryItems.map((item) => {
            const entry = (personal as any)[item.key] ?? {};
            return (
              <div
                key={item.key}
                className="flex items-start justify-between gap-3 text-sm py-1.5 border-b border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1">
                  <span
                    className={
                      entry.value === "yes"
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }
                  >
                    {item.label}
                  </span>
                  {entry.remarks && entry.remarks !== "" && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {entry.remarks}
                    </div>
                  )}
                </div>
                <StatusBadge value={entry.value} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* Social History */}
      <Section
        title="Social History"
        icon={<BeakerIcon className="w-4 h-4" />}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-gray-700 dark:text-gray-200 font-medium w-16">
              Smoking
            </span>
            <StatusBadge value={social.smoking} />
            {social.smoking_age_started && (
              <span className="text-xs text-gray-500">
                · Age started: {social.smoking_age_started}
              </span>
            )}
            {social.smoking_sticks_per_day && (
              <span className="text-xs text-gray-500">
                · Sticks/packs per day: {social.smoking_sticks_per_day}
              </span>
            )}
            {social.smoking_packs_per_year && (
              <span className="text-xs text-gray-500">
                · Packs per year: {social.smoking_packs_per_year}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-gray-700 dark:text-gray-200 font-medium w-16">
              Alcohol
            </span>
            <StatusBadge value={social.alcohol} />
            {social.alcohol_how_often && (
              <span className="text-xs text-gray-500">
                · How often: {social.alcohol_how_often}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <Field label="Food preference" value={social.food_preference} />
            <Field label="Other Remarks" value={social.other_remarks} />
          </div>
        </div>
      </Section>

      {/* OB Gyn History */}
      <Section
        title="OB Gyn History"
        icon={<SparklesIcon className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Menopause" value={obgyn.menopause} />
          <Field label="Cycle" value={obgyn.cycle} />
          <Field label="Duration" value={obgyn.duration} />
          <Field label="Dysmenorrhea" value={obgyn.dysmenorrhea} />
        </div>
      </Section>
    </div>
  );
}
