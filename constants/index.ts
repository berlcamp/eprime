export const statusList = [
  {
    status: 'Disapproved',
    class:
      'text-red-700 font-medium text-lg px-1 py-px bg-red-100 border border-red-500',
    color: '#e02626'
  },
  {
    status: 'For Verification',
    class:
      'text-blue-700 font-medium text-lg px-1 py-px bg-blue-100 border border-blue-500',
    color: '#997c00'
  },
  {
    status: 'Approval Recommended',
    class:
      'text-orange-700 font-medium text-lg px-1 py-px bg-orange-100 border border-orange-500',
    color: '#a44508'
  },
  {
    status: 'Approved',
    class:
      'text-green-700 font-medium text-lg px-1 py-px bg-green-100 border border-green-500',
    color: '#287f00'
  }
]

export const requestTypes = [
  'Leave',
  'Locator Slip',
  'Pass Slip',
  'Service Record Print Request',
  'Travel Authority',
  'Undertime Permit'
]

export const leaveCreditTypes = [
  {
    position_type: 'Teaching',
    gender: 'All',
    type: 'Service Credit',
    credits: 0
  },
  {
    position_type: 'All',
    gender: 'All',
    type: 'Solo Parent Leave',
    credits: 7
  },
  { position_type: 'All', gender: 'All', type: 'Study Leave', credits: 182 },
  {
    position_type: 'All',
    gender: 'All',
    type: 'Special Emergency (Calamity) Leave',
    credits: 5
  },
  {
    position_type: 'All',
    gender: 'Female',
    type: '10-Day VAWC Leave',
    credits: 10
  },
  { position_type: 'All', gender: 'All', type: 'Adoption Leave', credits: 60 },
  { position_type: 'All', gender: 'Male', type: 'Paternity Leave', credits: 7 },
  {
    position_type: 'All',
    gender: 'All',
    type: 'Special Privilege Leave',
    credits: 3
  },
  {
    position_type: 'All',
    gender: 'All',
    type: 'Rehabilitation Leave',
    credits: 182
  },
  {
    position_type: 'All',
    gender: 'Female',
    type: 'Maternity Leave',
    credits: 105
  },
  {
    position_type: 'All',
    gender: 'Female',
    type: 'Special Leave Benefits For Women',
    credits: 60
  },
  {
    position_type: 'Non-teaching',
    gender: 'All',
    type: 'Sick Leave',
    credits: 0
  },
  {
    position_type: 'Non-teaching',
    gender: 'All',
    type: 'Vacation Leave',
    credits: 0
  }
]

export const rankingTypes = [
  'CAR-RQA',
  'CAR-RQA (Special Items)',
  'CAR (Teaching)',
  'CAR (Non-teaching)',
  'Reclassification'
]

export const majors = {
  Elementary: ['Kindergarten', 'SPED', 'General Education'],
  'Junior High School': [
    'English',
    'Filipino',
    'Mathematics',
    'Science - Major in Biology',
    'Science - Major in Chemistry',
    'Science - Major in General Science',
    'Science - Major in Physics',
    'Aralin Panlipunan',
    'MAPEH',
    'Social Science/Values Education',
    'T.L.E - Home Economics',
    'T.L.E - Agri-Fishery',
    'T.L.E - ICT',
    'T.L.E - Industrial Arts'
  ],
  'Senior High School': [
    'Academic Track - Accountancy, Business and Management (ABM)',
    'Academic Track - Science, Technology, Engineering and Mathematics (STEM)',
    'Academic Track - Humanities & Social Science (HUMSS)',
    'Academic Track - General & Academic (GAS)',
    'Arts and Design',
    'Sports',
    'TVL - Agriculture-Fishery Arts (AFA)',
    'TVL - Home Economics (HE)',
    'TVL - Industrial Arts (IA)',
    'TVL - Information and Communication Technology (ICT)'
  ]
}

// Major categories and subjects
export const elementaryMajors = ['Kindergarten', 'SPED', 'General Education']
export const jhsMajors = [
  'English',
  'Filipino',
  'Mathematics',
  'Science - Major in Biology',
  'Science - Major in Chemistry',
  'Science - Major in General Science',
  'Science - Major in Physics',
  'Aralin Panlipunan',
  'MAPEH',
  'Social Science/Values Education',
  'T.L.E - Home Economics',
  'T.L.E - Agri-Fishery',
  'T.L.E - ICT',
  'T.L.E - Industrial Arts'
]
export const shsMajors = [
  'Academic Track - Accountancy, Business and Management (ABM)',
  'Academic Track - Science, Technology, Engineering and Mathematics (STEM)',
  'Academic Track - Humanities & Social Science (HUMSS)',
  'Academic Track - General & Academic (GAS)',
  'Arts and Design',
  'Sports',
  'TVL - Agriculture-Fishery Arts (AFA)',
  'TVL - Home Economics (HE)',
  'TVL - Industrial Arts (IA)',
  'TVL - Information and Communication Technology (ICT)'
]

export const leaveTypes = [
  'Vacation Leave',
  'Sick Leave',
  'Compensatory Time Off',
  'Mandatory/Forced Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Special Privilege Leave',
  'Solo Parent Leave',
  'Study Leave',
  '10-Day VAWC Leave',
  'Rehabilitation Privilege',
  'Special Leave Benefits for Women',
  'Special Emergency (Calamity) Leave',
  'Adoption Leave',
  'Terminal/Monetization Leave',
  'Others'
]

export const superAdmins = [
  'berlcamp@gmail.com',
  'scorpionkean.112688@gmail.com'
]

export const orgChart = [
  {
    id: 12,
    name: 'Imelda Saburnido',
    role: 'SDS',
    profiles: [
      {
        id: 25,
        name: 'Antonieta Narra',
        role: 'ASDS',
        profiles: [
          {
            id: 83,
            name: 'CURRICULUM IMPLEMENTATION DIVISION (CID)',
            type: 'office',
            role: 'CID',
            profiles: [
              {
                id: 83,
                name: 'Juan D',
                role: 'CID CHIEF',
                profiles: [
                  {
                    id: 46,
                    name: 'INSTRUCTIONAL MGMT SECTION',
                    type: 'office',
                    role: 'IMS',
                    profiles: [
                      {
                        id: 76,
                        name: 'Daniel Zhou',
                        role: 'Team Lead',
                        profiles: [
                          {
                            id: 55,
                            name: 'Patrick Wang',
                            role: 'Developer',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer',
                                    profiles: [
                                      {
                                        id: 55,
                                        name: 'Patrick Wang',
                                        role: 'Developer',
                                        profiles: [
                                          {
                                            id: 76,
                                            name: 'Daniel Zhou',
                                            role: 'Team Lead',
                                            profiles: [
                                              {
                                                id: 55,
                                                name: 'Patrick Wang',
                                                role: 'Developer',
                                                profiles: [
                                                  {
                                                    id: 55,
                                                    name: 'Patrick Wang',
                                                    role: 'Developer',
                                                    profiles: [
                                                      {
                                                        id: 55,
                                                        name: 'Patrick Wang',
                                                        role: 'Developer',
                                                        profiles: [
                                                          {
                                                            id: 55,
                                                            name: 'Patrick Wang',
                                                            role: 'Developer'
                                                          }
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                              }
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 46,
                    name: 'LEARNING RESOURCES MANAGEMENT SYSTEM',
                    type: 'office',
                    role: 'LRMS',
                    profiles: [
                      {
                        id: 76,
                        name: 'Daniel Zhou',
                        role: 'Team Lead',
                        profiles: [
                          {
                            id: 55,
                            name: 'Patrick Wang',
                            role: 'Developer'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 46,
                    name: 'ALTERNATIVE LEARNING SYSTEM',
                    type: 'office',
                    role: 'ALS',
                    profiles: [
                      {
                        id: 76,
                        name: 'Daniel Zhou',
                        role: 'Team Lead',
                        profiles: [
                          {
                            id: 55,
                            name: 'Patrick Wang',
                            role: 'Developer'
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 46,
                    name: 'DISTRICT INSTRUCTIONAL SUPERVISION SECTION',
                    type: 'office',
                    role: 'DISSS',
                    profiles: [
                      {
                        id: 76,
                        name: 'Daniel Zhou',
                        role: 'Team Lead',
                        profiles: [
                          {
                            id: 55,
                            name: 'Patrick Wang',
                            role: 'Developer'
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 83,
            name: 'OFFICE OF THE SCHOOLS DIVISION SUPERINTENDENT (OSDS)',
            type: 'office',
            role: 'OSDS',
            profiles: [
              {
                id: 83,
                name: 'ADMINISTRATIVE SERVICES',
                type: 'office',
                role: 'AS',
                profiles: [
                  {
                    id: 83,
                    name: 'ADMINISTRATIVE OFFICER ||',
                    role: 'AO ||',
                    profiles: [
                      {
                        id: 46,
                        name: 'CASH UNIT',
                        role: 'CU',
                        type: 'office',
                        profiles: [
                          {
                            id: 76,
                            name: 'Daniel Zhou',
                            role: 'Team Lead',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer'
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 46,
                        name: 'PERSONNEL UNIT',
                        type: 'office',
                        role: 'PU',
                        profiles: [
                          {
                            id: 76,
                            name: 'Daniel Zhou',
                            role: 'Team Lead',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 46,
                        name: 'PROPERTY AND SUPPLY UNIT',
                        role: 'PSU',
                        type: 'office',
                        profiles: [
                          {
                            id: 76,
                            name: 'Daniel Zhou',
                            role: 'Team Lead',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 46,
                        name: 'RECORDS UNIT',
                        type: 'office',
                        role: 'RU',
                        profiles: [
                          {
                            id: 76,
                            name: 'Daniel Zhou',
                            role: 'Team Lead',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 46,
                        name: 'GENERAL SERVICES',
                        type: 'office',
                        role: 'GS',
                        profiles: [
                          {
                            id: 76,
                            name: 'Daniel Zhou',
                            role: 'Team Lead',
                            profiles: [
                              {
                                id: 55,
                                name: 'Patrick Wang',
                                role: 'Developer'
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                id: 83,
                name: 'FINANCE SERVICES',
                type: 'office',
                role: 'AS',
                profiles: [
                  {
                    id: 83,
                    name: 'ACCOUNTING UNIT',
                    type: 'office',
                    role: 'AS',
                    profiles: [
                      {
                        id: 83,
                        name: 'ACCOUNTANT ||',
                        role: 'AO ||',
                        profiles: [
                          {
                            id: 46,
                            name: 'JOHN D',
                            role: 'CU',
                            profiles: [
                              {
                                id: 76,
                                name: 'Daniel Zhou',
                                role: 'Team Lead',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer',
                                    profiles: [
                                      {
                                        id: 55,
                                        name: 'Patrick Wang',
                                        role: 'Developer'
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 83,
                    name: 'BUDGET UNIT',
                    type: 'office',
                    role: 'AS',
                    profiles: [
                      {
                        id: 83,
                        name: 'BUDGET OFFICER ||',
                        role: 'AO ||',
                        profiles: [
                          {
                            id: 46,
                            name: 'JOHN R',
                            role: 'CU',
                            profiles: [
                              {
                                id: 76,
                                name: 'Daniel Zhou',
                                role: 'Team Lead',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer',
                                    profiles: [
                                      {
                                        id: 55,
                                        name: 'Patrick Wang',
                                        role: 'Developer'
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 83,
            name: 'SCHOOL GOVERNANCE AND OPERATION DIVISION (SGOD)',
            type: 'office',
            role: 'SGOD',
            profiles: [
              {
                id: 83,
                name: 'SGOD CHIEF',
                role: 'AS',
                profiles: [
                  {
                    id: 83,
                    name: 'ACCOUNTING UNIT',
                    role: 'AS',
                    profiles: [
                      {
                        id: 83,
                        name: 'ACCOUNTANT ||',
                        role: 'AO ||',
                        profiles: [
                          {
                            id: 46,
                            name: 'JOHN D',
                            role: 'CU',
                            profiles: [
                              {
                                id: 76,
                                name: 'Daniel Zhou',
                                role: 'Team Lead',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer',
                                    profiles: [
                                      {
                                        id: 55,
                                        name: 'Patrick Wang',
                                        role: 'Developer'
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    id: 83,
                    name: 'SCHOOL HEALTH AND NUTRITION',
                    type: 'office',
                    role: 'AS',
                    profiles: [
                      {
                        id: 83,
                        name: 'ACCOUNTANT ||',
                        role: 'AO ||',
                        profiles: [
                          {
                            id: 46,
                            name: 'JOHN D',
                            role: 'CU',
                            profiles: [
                              {
                                id: 76,
                                name: 'Daniel Zhou',
                                role: 'Team Lead',
                                profiles: [
                                  {
                                    id: 55,
                                    name: 'Patrick Wang',
                                    role: 'Developer',
                                    profiles: [
                                      {
                                        id: 55,
                                        name: 'Patrick Wang',
                                        role: 'Developer'
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      {
                        id: 83,
                        name: 'ACCOUNTANT ||',
                        role: 'AO ||'
                      }
                    ]
                  },
                  {
                    id: 83,
                    name: 'SCHOOL HEALTH AND NUTRITION',
                    role: 'AS'
                  },
                  {
                    id: 83,
                    name: 'SCHOOL HEALTH AND NUTRITION',
                    role: 'AS'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 46,
        name: 'ICT',
        type: 'office',
        role: 'DISSS',
        profiles: [
          {
            id: 76,
            name: 'Daniel Zhou',
            role: 'Team Lead'
          }
        ]
      }
    ]
  }
]
