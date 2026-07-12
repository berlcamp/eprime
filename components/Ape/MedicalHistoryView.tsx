"use client";

import type { MedicalHistoryTypes } from "@/types";

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

const yn = (v?: string): string => {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return "—";
};

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="text-xs">
    <span className="font-medium">{label}: </span>
    <span>{value && value !== "" ? value : "—"}</span>
  </div>
);

export default function MedicalHistoryView({ medicalHistory }: Props) {
  if (!medicalHistory || Object.keys(medicalHistory).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No Medical History form was submitted for this record.
      </div>
    );
  }

  const header = medicalHistory.header ?? {};
  const ph = medicalHistory.present_health ?? {};
  const personal = medicalHistory.personal_history ?? {};
  const social = medicalHistory.social_history ?? {};
  const obgyn = medicalHistory.obgyn_history ?? {};

  return (
    <div className="border rounded p-3 bg-white dark:bg-gray-700 space-y-3">
      {/* Header */}
      <div>
        <div className="text-xs font-bold border-b pb-1 mb-1">
          Personnel Information
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
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
      </div>

      {/* Present Health Status */}
      <div>
        <div className="text-xs font-bold border-b pb-1 mb-1">
          Present Health Status
        </div>
        <Field label="Cough" value={ph.cough ? ph.cough : "None"} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {presentHealthItems.map((item) => (
            <Field
              key={item.key}
              label={item.label}
              value={yn((ph as any)[item.key])}
            />
          ))}
        </div>
        <Field label="Others" value={ph.others} />
        <Field label="Present Medication taken" value={ph.present_medication} />
      </div>

      {/* Personal History */}
      <div>
        <div className="text-xs font-bold border-b pb-1 mb-1">
          Personal History
        </div>
        <div className="grid grid-cols-1 gap-y-1">
          {personalHistoryItems.map((item) => {
            const entry = (personal as any)[item.key] ?? {};
            return (
              <div key={item.key} className="text-xs">
                <span className="font-medium">{item.label}: </span>
                <span>{yn(entry.value)}</span>
                {entry.remarks && entry.remarks !== "" && (
                  <span className="text-gray-500"> ({entry.remarks})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Social History */}
      <div>
        <div className="text-xs font-bold border-b pb-1 mb-1">
          Social History
        </div>
        <div className="text-xs">
          <span className="font-medium">Smoking: </span>
          {yn(social.smoking)}
          {social.smoking_age_started && (
            <span> · Age started: {social.smoking_age_started}</span>
          )}
          {social.smoking_sticks_per_day && (
            <span> · Sticks/packs per day: {social.smoking_sticks_per_day}</span>
          )}
          {social.smoking_packs_per_year && (
            <span> · Packs per year: {social.smoking_packs_per_year}</span>
          )}
        </div>
        <div className="text-xs">
          <span className="font-medium">Alcohol: </span>
          {yn(social.alcohol)}
          {social.alcohol_how_often && (
            <span> · How often: {social.alcohol_how_often}</span>
          )}
        </div>
        <Field label="Food preference" value={social.food_preference} />
        <Field label="Other Remarks" value={social.other_remarks} />
      </div>

      {/* OB Gyn History */}
      <div>
        <div className="text-xs font-bold border-b pb-1 mb-1">
          OB Gyn History
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Menopause" value={obgyn.menopause} />
          <Field label="Cycle" value={obgyn.cycle} />
          <Field label="Duration" value={obgyn.duration} />
          <Field label="Dysmenorrhea" value={obgyn.dysmenorrhea} />
        </div>
      </div>
    </div>
  );
}
