"use client";

import { PrintAdviseOrder } from "@/components/Printables/PrintAdviseOrder";
import { PrintAppointmentForm } from "@/components/Printables/PrintAppointmentForm";
import { PrintAssumption } from "@/components/Printables/PrintAssumption";
import { PrintOathOfOffice } from "@/components/Printables/PrintOathOfOffice";
import AppointmentFormModal from "@/components/Rsp/AppointmentFormModal";
import { AdviseOrderModal } from "@/components/Rsp/AdviseOrderModal";
import AssumptionModal from "@/components/Rsp/AssumptionModal";
import OathOfOfficeModal from "@/components/Rsp/OathOfOfficeModal";
import type { ApplicantTypes } from "@/types";
import { fetchSalaryGrades } from "@/utils/fetchApi";
import { numberToWords } from "@/utils/text-helper";
import * as React from "react";
import { useReactToPrint } from "react-to-print";

export interface EmployeePrintablesControllerHandle {
  openAdviseOrder: (applicant: ApplicantTypes) => void;
  openAssumption: (applicant: ApplicantTypes) => void;
  openOathOfOffice: (applicant: ApplicantTypes) => void;
  openAppointmentForm: (
    applicant: ApplicantTypes,
    opts?: {
      defaultVice?: string;
      defaultPlantillaNumber?: string;
      defaultNatureOfAppointment?: string;
    },
  ) => void;
}

/**
 * Reusable controller for the 4 DepEd appointment printables:
 * Oath of Office, Advise Order, Assumption of Duty, Appointment Form.
 *
 * Owns modal state, react-to-print refs, image preload, and the
 * selected-item mutation dance. Parent renders this once at the page
 * level and exposes the imperative API through a ref — row-level menu
 * buttons just call `ref.current?.openXxx(applicant)`.
 */
const preloadImages = (urls: string[]) =>
  Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  );

const PRINT_IMAGES = [
  "/logos/deped_logo_1.png",
  "/logos/deped_logo_2.png",
  "/deped_header.svg",
  "/logos/matatag.png",
  "/logos/matatag.svg",
  "/logos/bagong.png",
  "/logos/bagong.svg",
  "/logos/bayugan.png",
  "/logos/bayugan.svg",
];

type PrintType =
  | ""
  | "advise-order"
  | "assumption"
  | "oath-of-office"
  | "appointment-form";

export const EmployeePrintablesController = React.forwardRef<
  EmployeePrintablesControllerHandle
>((_props, ref) => {
  const [selectedItem, setSelectedItem] = React.useState<ApplicantTypes | null>(
    null,
  );
  const [selectedType, setSelectedType] = React.useState<PrintType>("");

  const [isAdviseOrderOpen, setIsAdviseOrderOpen] = React.useState(false);
  const [isAssumptionOpen, setIsAssumptionOpen] = React.useState(false);
  const [isOathOpen, setIsOathOpen] = React.useState(false);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] =
    React.useState(false);

  const [appointmentFormDefaults, setAppointmentFormDefaults] = React.useState<{
    defaultVice?: string;
    defaultPlantillaNumber?: string;
    defaultNatureOfAppointment?: string;
  }>({});

  // Shared ref for Advise Order + Oath of Office (letter size, same pageStyle)
  const componentRef = React.useRef(null);
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "request-form",
  });

  // Assumption — folio, 1in margins
  const assumptionRef = React.useRef(null);
  const printAssumptionFn = useReactToPrint({
    contentRef: assumptionRef,
    documentTitle: "assumption-to-duty",
    pageStyle: `@page { size: 8.5in 13in; margin: 1in; } html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
  });

  // Appointment Form — folio, 0.4in margins
  const appointmentFormRef = React.useRef(null);
  const printAppointmentFn = useReactToPrint({
    contentRef: appointmentFormRef,
    documentTitle: "appointment-form",
    pageStyle: `@page { size: 8.5in 13in; margin: 0.4in; } html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
  });

  React.useImperativeHandle(ref, () => ({
    openAdviseOrder: (applicant) => {
      setSelectedItem(applicant);
      setIsAdviseOrderOpen(true);
    },
    openAssumption: (applicant) => {
      setSelectedItem(applicant);
      setIsAssumptionOpen(true);
    },
    openOathOfOffice: (applicant) => {
      setSelectedItem(applicant);
      setIsOathOpen(true);
    },
    openAppointmentForm: (applicant, opts) => {
      setSelectedItem(applicant);
      setAppointmentFormDefaults({
        defaultVice: opts?.defaultVice ?? applicant.hrm_item?.vice ?? "",
        defaultPlantillaNumber:
          opts?.defaultPlantillaNumber ??
          applicant.hrm_item?.item_number ??
          "",
        defaultNatureOfAppointment:
          opts?.defaultNatureOfAppointment ?? "Original",
      });
      setIsAppointmentFormOpen(true);
    },
  }));

  const handlePrintAdviseOrder = async (date: string, location: string) => {
    if (!selectedItem) return;
    await preloadImages(PRINT_IMAGES);
    setSelectedType("advise-order");
    const base = selectedItem;
    setTimeout(() => {
      setSelectedItem({
        ...base,
        date,
        assignment: location,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const handlePrintAssumption = async (
    date: string,
    location: string,
    signatory: string,
    position: string,
    attestedBy: string,
    attestedByPosition: string,
  ) => {
    if (!selectedItem) return;
    await preloadImages(PRINT_IMAGES);
    setSelectedType("assumption");
    const base = selectedItem;
    setTimeout(() => {
      setSelectedItem({
        ...base,
        date,
        assignment: location,
        signatory,
        position,
        attested_by: attestedBy,
        attested_by_position: attestedByPosition,
      });
      setTimeout(() => printAssumptionFn(), 100);
    }, 100);
  };

  const handlePrintOathOfOffice = async (date: string) => {
    if (!selectedItem) return;
    await preloadImages(PRINT_IMAGES);
    setSelectedType("oath-of-office");
    const base = selectedItem;
    setTimeout(() => {
      setSelectedItem({
        ...base,
        date,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const handlePrintAppointmentForm = async (
    date: string,
    employmentStatus: string,
    natureOfAppointment: string,
    assignment: string,
    vice: string,
    reasonOfVacancy: string,
    plantillaNumber: string,
    plantillaType?: string,
    publicationPosting?: {
      publishedAt: string;
      publishedFrom: string;
      publishedTo: string;
      postedIn: string;
      postedFrom: string;
      postedTo: string;
      hrmpsbAssessmentStartedOn: string;
    },
    hrmpsbChair?: {
      id: string;
      name: string;
    },
    acknowledgementDate?: string,
  ) => {
    if (!selectedItem) return;
    await preloadImages(PRINT_IMAGES);

    const base = selectedItem;
    const salaryGrade =
      base?.ranking?.position?.salary_grade ||
      base?.hrm_item?.hrm_position?.salary_grade ||
      base?.hrm_item?.salary_grade;
    let salaryAmount = "";
    let salaryInWords = "";
    if (salaryGrade) {
      const { data: salaryGrades } = await fetchSalaryGrades(999, 0);
      const sameGrade = (salaryGrades ?? []).filter(
        (sg: { grade: string | number }) =>
          String(sg.grade) === String(salaryGrade),
      );
      const matching =
        sameGrade.find(
          (sg: { step: string | number }) => String(sg.step) === "1",
        ) ?? sameGrade[0];
      if (matching?.salary) {
        const amt = Number(matching.salary);
        salaryAmount = amt.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        salaryInWords = numberToWords(amt);
      }
    }

    setSelectedType("appointment-form");
    setTimeout(() => {
      setSelectedItem({
        ...base,
        date,
        assignment,
        employment_status: employmentStatus,
        nature_of_appointment: natureOfAppointment,
        vice,
        reason_of_vacancy: reasonOfVacancy,
        plantilla_number: plantillaNumber,
        salary_amount: salaryAmount,
        salary_in_words: salaryInWords,
        plantilla_type: plantillaType,
        ...(publicationPosting && {
          published_at: publicationPosting.publishedAt,
          published_from: publicationPosting.publishedFrom,
          published_to: publicationPosting.publishedTo,
          posted_in: publicationPosting.postedIn,
          posted_from: publicationPosting.postedFrom,
          posted_to: publicationPosting.postedTo,
          hrmpsb_assessment_started_on:
            publicationPosting.hrmpsbAssessmentStartedOn,
        }),
        ...(hrmpsbChair && {
          hrmpsb_chair_name: hrmpsbChair.name,
        }),
        acknowledgement_date: acknowledgementDate ?? "",
      } as ApplicantTypes);
      setTimeout(() => printAppointmentFn(), 100);
    }, 100);
  };

  return (
    <>
      {selectedItem && (
        <AdviseOrderModal
          open={isAdviseOrderOpen}
          onOpenChange={setIsAdviseOrderOpen}
          onConfirm={(date, location) => {
            void handlePrintAdviseOrder(date, location);
          }}
        />
      )}

      {selectedItem && (
        <AssumptionModal
          open={isAssumptionOpen}
          onOpenChange={setIsAssumptionOpen}
          onConfirm={(
            date,
            location,
            signatory,
            position,
            attestedBy,
            attestedByPosition,
          ) => {
            void handlePrintAssumption(
              date,
              location,
              signatory,
              position,
              attestedBy,
              attestedByPosition,
            );
          }}
        />
      )}

      {selectedItem && (
        <OathOfOfficeModal
          open={isOathOpen}
          onOpenChange={setIsOathOpen}
          onConfirm={(date) => {
            void handlePrintOathOfOffice(date);
          }}
        />
      )}

      {selectedItem && (
        <AppointmentFormModal
          open={isAppointmentFormOpen}
          onOpenChange={setIsAppointmentFormOpen}
          defaultVice={appointmentFormDefaults.defaultVice}
          defaultPlantillaNumber={appointmentFormDefaults.defaultPlantillaNumber}
          defaultNatureOfAppointment={
            appointmentFormDefaults.defaultNatureOfAppointment
          }
          onConfirm={(
            date,
            employmentStatus,
            natureOfAppointment,
            assignment,
            vice,
            reasonOfVacancy,
            plantillaNumber,
            plantillaType,
            publicationPosting,
            hrmpsbChair,
            acknowledgementDate,
          ) => {
            void handlePrintAppointmentForm(
              date,
              employmentStatus,
              natureOfAppointment,
              assignment,
              vice,
              reasonOfVacancy,
              plantillaNumber,
              plantillaType,
              publicationPosting,
              hrmpsbChair,
              acknowledgementDate,
            );
          }}
        />
      )}

      {selectedItem && selectedType === "advise-order" && (
        <PrintAdviseOrder selectedItem={selectedItem} ref={componentRef} />
      )}
      {selectedItem && selectedType === "assumption" && (
        <PrintAssumption selectedItem={selectedItem} ref={assumptionRef} />
      )}
      {selectedItem && selectedType === "oath-of-office" && (
        <PrintOathOfOffice selectedItem={selectedItem} ref={componentRef} />
      )}
      {selectedItem && selectedType === "appointment-form" && (
        <PrintAppointmentForm
          selectedItem={selectedItem}
          ref={appointmentFormRef}
        />
      )}
    </>
  );
});

EmployeePrintablesController.displayName = "EmployeePrintablesController";
