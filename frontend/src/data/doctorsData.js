// Available doctors for appointment booking

export const availableDoctors = [
  {
    id: 'DOC-001',
    name: 'Dr. Priya Mehta',
    specialty: 'Cardiology',
    qualification: 'MD, DM (Cardiology)',
    experience: 15,
    rating: 4.8,
    reviews: 324,
    hospital: 'City Heart Hospital',
    location: 'Sector 21, Mumbai',
    distance: '2.3 km',
    consultationFee: 1200,
    languages: ['English', 'Hindi', 'Marathi'],
    availability: [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '11:00 AM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['10:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] },
      { day: 'Friday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya'
  },
  {
    id: 'DOC-002',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 12,
    rating: 4.6,
    reviews: 256,
    hospital: 'Apex Heart Care',
    location: 'Andheri West, Mumbai',
    distance: '3.8 km',
    consultationFee: 1000,
    languages: ['English', 'Hindi', 'Tamil'],
    availability: [
      { day: 'Monday', slots: ['10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '03:00 PM', '04:00 PM'] },
      { day: 'Saturday', slots: ['09:00 AM', '10:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh'
  },
  {
    id: 'DOC-003',
    name: 'Dr. Aisha Khan',
    specialty: 'General Physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 8,
    rating: 4.7,
    reviews: 189,
    hospital: 'Medicare Clinic',
    location: 'Bandra East, Mumbai',
    distance: '1.5 km',
    consultationFee: 800,
    languages: ['English', 'Hindi', 'Urdu'],
    availability: [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Saturday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha'
  },
  {
    id: 'DOC-004',
    name: 'Dr. Sunil Reddy',
    specialty: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    experience: 18,
    rating: 4.9,
    reviews: 412,
    hospital: 'Bone & Joint Clinic',
    location: 'Powai, Mumbai',
    distance: '4.2 km',
    consultationFee: 1500,
    languages: ['English', 'Hindi', 'Telugu'],
    availability: [
      { day: 'Monday', slots: ['10:00 AM', '11:00 AM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['10:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '02:00 PM', '04:00 PM'] },
      { day: 'Saturday', slots: ['09:00 AM', '10:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunil'
  },
  {
    id: 'DOC-005',
    name: 'Dr. Neha Sharma',
    specialty: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology)',
    experience: 10,
    rating: 4.8,
    reviews: 298,
    hospital: 'Skin & Wellness Center',
    location: 'Juhu, Mumbai',
    distance: '5.1 km',
    consultationFee: 1100,
    languages: ['English', 'Hindi', 'Punjabi'],
    availability: [
      { day: 'Monday', slots: ['11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['10:00 AM', '11:00 AM', '03:00 PM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
      { day: 'Thursday', slots: ['11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '04:00 PM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neha'
  },
  {
    id: 'DOC-006',
    name: 'Dr. Vikram Singh',
    specialty: 'Neurology',
    qualification: 'MBBS, DM (Neurology)',
    experience: 14,
    rating: 4.7,
    reviews: 267,
    hospital: 'NeuroLife Hospital',
    location: 'Worli, Mumbai',
    distance: '3.2 km',
    consultationFee: 1400,
    languages: ['English', 'Hindi'],
    availability: [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '11:00 AM', '03:00 PM', '04:00 PM'] },
      { day: 'Thursday', slots: ['10:00 AM', '11:00 AM', '02:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '03:00 PM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram'
  },
  {
    id: 'DOC-007',
    name: 'Dr. Anjali Desai',
    specialty: 'Pediatrics',
    qualification: 'MBBS, MD (Pediatrics)',
    experience: 11,
    rating: 4.9,
    reviews: 356,
    hospital: 'Children Care Hospital',
    location: 'Santacruz, Mumbai',
    distance: '2.8 km',
    consultationFee: 900,
    languages: ['English', 'Hindi', 'Gujarati'],
    availability: [
      { day: 'Monday', slots: ['10:00 AM', '11:00 AM', '03:00 PM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'] },
      { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '04:00 PM'] },
      { day: 'Saturday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anjali'
  },
  {
    id: 'DOC-008',
    name: 'Dr. Mohammed Ali',
    specialty: 'General Physician',
    qualification: 'MBBS, MD',
    experience: 7,
    rating: 4.5,
    reviews: 142,
    hospital: 'Community Health Center',
    location: 'Kurla, Mumbai',
    distance: '6.5 km',
    consultationFee: 600,
    languages: ['English', 'Hindi', 'Urdu', 'Marathi'],
    availability: [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Thursday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Saturday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mohammed'
  },
  {
    id: 'DOC-009',
    name: 'Dr. Kavita Iyer',
    specialty: 'Gynecology',
    qualification: 'MBBS, MS (Obstetrics & Gynecology)',
    experience: 13,
    rating: 4.8,
    reviews: 289,
    hospital: "Women's Health Clinic",
    location: 'Dadar, Mumbai',
    distance: '4.7 km',
    consultationFee: 1000,
    languages: ['English', 'Hindi', 'Tamil', 'Marathi'],
    availability: [
      { day: 'Monday', slots: ['10:00 AM', '11:00 AM', '03:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '04:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '03:00 PM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kavita'
  },
  {
    id: 'DOC-010',
    name: 'Dr. Arjun Patel',
    specialty: 'Psychiatry',
    qualification: 'MBBS, MD (Psychiatry)',
    experience: 9,
    rating: 4.6,
    reviews: 178,
    hospital: 'Mind Wellness Center',
    location: 'Malad, Mumbai',
    distance: '7.2 km',
    consultationFee: 1300,
    languages: ['English', 'Hindi', 'Gujarati'],
    availability: [
      { day: 'Monday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '02:00 PM'] },
      { day: 'Thursday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
      { day: 'Saturday', slots: ['10:00 AM', '11:00 AM'] }
    ],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun'
  }
];

export const specialties = [
  'All Specialties',
  'Cardiology',
  'General Physician',
  'Orthopedics',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Gynecology',
  'Psychiatry'
];

export const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'fee-low', label: 'Fee: Low to High' },
  { value: 'fee-high', label: 'Fee: High to Low' },
  { value: 'experience', label: 'Most Experienced' }
];
