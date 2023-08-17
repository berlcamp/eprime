export const documentTypes = [
  { type: "Business Permit", shortcut: "BUSS-PER" },
  { type: "Case", shortcut: "CASE" },
  { type: "Certification", shortcut: "CERT" },
  { type: "Contract of Service", shortcut: "COS" },
  { type: "Cheque", shortcut: "CHQ" },
  { type: "DTR", shortcut: "DTR" },
  { type: "Disbursement Voucher", shortcut: "DV" },
  { type: "Executive Order", shortcut: "EO" },
  { type: "IPCR/OPCR", shortcut: "IPCR/OPCR" },
  { type: "Letters", shortcut: "LETTER" },
  { type: "Leave", shortcut: "LEAVE" },
  { type: "Liquidation", shortcut: "LIQUIDATION" },
  { type: "Retirement", shortcut: "RET" },
  { type: "Memorandum Order", shortcut: "MEMO" },
  { type: "Notice", shortcut: "NOTICE" },
  { type: "Notice of Violation", shortcut: "NOTI-VIOL" },
  { type: "Office Order", shortcut: "OFC-ORD" },
  { type: "Other Documents", shortcut: "OTR-DOC" },
  { type: "Order of Payment", shortcut: "ORD-PYMT" },
  { type: "Ordinance", shortcut: "ORD" },
  { type: "OBR", shortcut: "OBR" },
  { type: "OBR/Payroll", shortcut: "OBR/PYRL" },
  { type: "Permit", shortcut: "PERMIT" },
  { type: "Project", shortcut: "PROJ" },
  { type: "PR/OBR", shortcut: "PR/OBR" },
  { type: "Purchase Request", shortcut: "PR" },
  { type: "Proposal", shortcut: "PRPSL" },
  { type: "Purchase Order", shortcut: "PO" },
  { type: "OBR/Reimbursement", shortcut: "OBR/REIMB" },
  { type: "Resolution", shortcut: "RESO" },
  { type: "Reports", shortcut: "REPORT" },
  { type: "Salary Loan", shortcut: "SAL-LOAN" },
  { type: "Show Cause", shortcut: "SHW-CAUSE" },
  { type: "Special Order", shortcut: "SO" },
  { type: "Travel Order", shortcut: "TO" },
];

export const assigneeList = ["AS", "AR", "AB", "AL"];

export const statusList = [
  { status: "Received at OCM" },
  { status: "Received at CADM" },
  { status: "Resolved" },
  { status: "Pending for approval" },
  { status: "Approved" },
  { status: "Disapproved" },
  { status: "For File" },
  { status: "Confidential" },
  { status: "For Further Instruction" },
  { status: "Cancelled" },
  { status: "Forwarded" },
  { status: "Forwarded to CADM" },
  { status: "Forwarded to Atty Rhea" },
  { status: "Others" },
];

export const superAdmins = ["berlcamp@gmail.com", "berlcampomanes@gmail.com"];

export const orgChart = [
  {
    id: 12,
    name: "Imelda Saburnido",
    role: "SDS",
    profiles: [
      {
        id: 25,
        name: "Antonieta Narra",
        role: "ASDS",
        profiles: [
          {
            id: 83,
            name: "CURRICULUM IMPLEMENTATION DIVISION (CID)",
            type: 'office',
            role: "CID",
            profiles: [
              {
                id: 83,
                name: "Juan D",
                role: "CID CHIEF",
                profiles: [
                  {
                    id: 46,
                    name: "INSTRUCTIONAL MGMT SECTION",
                    type: 'office',
                    role: "IMS",
                    profiles: [
                      {
                        id: 76,
                        name: "Daniel Zhou",
                        role: "Team Lead",
                        profiles: [
                          {
                            id: 55,
                            name: "Patrick Wang",
                            role: "Developer",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                    profiles: [
                                      {
                                        id: 55,
                                        name: "Patrick Wang",
                                        role: "Developer",
                                        profiles: [
                                          {
                                            id: 76,
                                            name: "Daniel Zhou",
                                            role: "Team Lead",
                                            profiles: [
                                              {
                                                id: 55,
                                                name: "Patrick Wang",
                                                role: "Developer",
                                                profiles: [
                                                  {
                                                    id: 55,
                                                    name: "Patrick Wang",
                                                    role: "Developer",
                                                    profiles: [
                                                      {
                                                        id: 55,
                                                        name: "Patrick Wang",
                                                        role: "Developer",
                                                        profiles: [
                                                          {
                                                            id: 55,
                                                            name: "Patrick Wang",
                                                            role: "Developer",
                                                          },
                                                        ],
                                                      },
                                                    ],
                                                  },
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 46,
                    name: "LEARNING RESOURCES MANAGEMENT SYSTEM",
                    type: 'office',
                    role: "LRMS",
                    profiles: [
                      {
                        id: 76,
                        name: "Daniel Zhou",
                        role: "Team Lead",
                        profiles: [
                          {
                            id: 55,
                            name: "Patrick Wang",
                            role: "Developer",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 46,
                    name: "ALTERNATIVE LEARNING SYSTEM",
                    type: 'office',
                    role: "ALS",
                    profiles: [
                      {
                        id: 76,
                        name: "Daniel Zhou",
                        role: "Team Lead",
                        profiles: [
                          {
                            id: 55,
                            name: "Patrick Wang",
                            role: "Developer",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 46,
                    name: "DISTRICT INSTRUCTIONAL SUPERVISION SECTION",
                    type: 'office',
                    role: "DISSS",
                    profiles: [
                      {
                        id: 76,
                        name: "Daniel Zhou",
                        role: "Team Lead",
                        profiles: [
                          {
                            id: 55,
                            name: "Patrick Wang",
                            role: "Developer",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 83,
            name: "OFFICE OF THE SCHOOLS DIVISION SUPERINTENDENT (OSDS)",
            type: 'office',
            role: "OSDS",
            profiles: [
              {
                id: 83,
                name: "ADMINISTRATIVE SERVICES",
                type: 'office',
                role: "AS",
                profiles: [
                  {
                    id: 83,
                    name: "ADMINISTRATIVE OFFICER ||",
                    role: "AO ||",
                    profiles: [
                      {
                        id: 46,
                        name: "CASH UNIT",
                        role: "CU",
                        profiles: [
                          {
                            id: 76,
                            name: "Daniel Zhou",
                            role: "Team Lead",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 46,
                        name: "PERSONNEL UNIT",
                        type: 'office',
                        role: "PU",
                        profiles: [
                          {
                            id: 76,
                            name: "Daniel Zhou",
                            role: "Team Lead",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 46,
                        name: "PROPERTY AND SUPPLY UNIT",
                        role: "PSU",
                        profiles: [
                          {
                            id: 76,
                            name: "Daniel Zhou",
                            role: "Team Lead",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 46,
                        name: "RECORDS UNIT",
                        type: 'office',
                        role: "RU",
                        profiles: [
                          {
                            id: 76,
                            name: "Daniel Zhou",
                            role: "Team Lead",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 46,
                        name: "GENERAL SERVICES",
                        type: 'office',
                        role: "GS",
                        profiles: [
                          {
                            id: 76,
                            name: "Daniel Zhou",
                            role: "Team Lead",
                            profiles: [
                              {
                                id: 55,
                                name: "Patrick Wang",
                                role: "Developer",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 83,
                name: "FINANCE SERVICES",
                type: 'office',
                role: "AS",
                profiles: [
                  {
                    id: 83,
                    name: "ACCOUNTING UNIT",
                    type: 'office',
                    role: "AS",
                    profiles: [
                      {
                        id: 83,
                        name: "ACCOUNTANT ||",
                        role: "AO ||",
                        profiles: [
                          {
                            id: 46,
                            name: "JOHN D",
                            role: "CU",
                            profiles: [
                              {
                                id: 76,
                                name: "Daniel Zhou",
                                role: "Team Lead",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                    profiles: [
                                      {
                                        id: 55,
                                        name: "Patrick Wang",
                                        role: "Developer",
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 83,
                    name: "BUDGET UNIT",
                    type: 'office',
                    role: "AS",
                    profiles: [
                      {
                        id: 83,
                        name: "BUDGET OFFICER ||",
                        role: "AO ||",
                        profiles: [
                          {
                            id: 46,
                            name: "JOHN R",
                            role: "CU",
                            profiles: [
                              {
                                id: 76,
                                name: "Daniel Zhou",
                                role: "Team Lead",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                    profiles: [
                                      {
                                        id: 55,
                                        name: "Patrick Wang",
                                        role: "Developer",
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 83,
            name: "SCHOOL GOVERNANCE AND OPERATION DIVISION (SGOD)",
            type: 'office',
            role: "SGOD",
            profiles: [
              {
                id: 83,
                name: "SGOD CHIEF",
                role: "AS",
                profiles: [
                  {
                    id: 83,
                    name: "ACCOUNTING UNIT",
                    role: "AS",
                    profiles: [
                      {
                        id: 83,
                        name: "ACCOUNTANT ||",
                        role: "AO ||",
                        profiles: [
                          {
                            id: 46,
                            name: "JOHN D",
                            role: "CU",
                            profiles: [
                              {
                                id: 76,
                                name: "Daniel Zhou",
                                role: "Team Lead",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                    profiles: [
                                      {
                                        id: 55,
                                        name: "Patrick Wang",
                                        role: "Developer",
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 83,
                    name: "SCHOOL HEALTH AND NUTRITION",
                    type: 'office',
                    role: "AS",
                    profiles: [
                      {
                        id: 83,
                        name: "ACCOUNTANT ||",
                        role: "AO ||",
                        profiles: [
                          {
                            id: 46,
                            name: "JOHN D",
                            role: "CU",
                            profiles: [
                              {
                                id: 76,
                                name: "Daniel Zhou",
                                role: "Team Lead",
                                profiles: [
                                  {
                                    id: 55,
                                    name: "Patrick Wang",
                                    role: "Developer",
                                    profiles: [
                                      {
                                        id: 55,
                                        name: "Patrick Wang",
                                        role: "Developer",
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: 83,
                        name: "ACCOUNTANT ||",
                        role: "AO ||",
                      },
                    ],
                  },
                  {
                    id: 83,
                    name: "SCHOOL HEALTH AND NUTRITION",
                    role: "AS",
                  },
                  {
                    id: 83,
                    name: "SCHOOL HEALTH AND NUTRITION",
                    role: "AS",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 46,
        name: "ICT",
        type: 'office',
        role: "DISSS",
        profiles: [
          {
            id: 76,
            name: "Daniel Zhou",
            role: "Team Lead"
          },
        ],
      },
    ],
  },
];
