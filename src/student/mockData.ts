export type ReportStatus = 'Pending' | 'In progress' | 'Resolved' | 'Unknown';
export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Urgent' | 'Not available';

export type Report = {
  id: string;
  title: string;
  category: string;
  location: string;
  submitted: string;
  priority: ReportPriority;
  status: ReportStatus;
  description: string;
};

export const mockReports: Report[] = [
  {
    id: 'CF-1048',
    title: 'Leaking faucet in third-floor restroom',
    category: 'Plumbing',
    location: 'West Hall',
    submitted: 'Oct 18, 2024',
    priority: 'Medium',
    status: 'In progress',
    description: 'The faucet beside the accessible stall has been leaking steadily since yesterday.',
  },
  {
    id: 'CF-1042',
    title: 'Projector not working in lecture room',
    category: 'Equipment',
    location: 'Science Building',
    submitted: 'Oct 14, 2024',
    priority: 'High',
    status: 'Pending',
    description: 'The main projector shows a blank screen when connected to the lecture room computer.',
  },
  {
    id: 'CF-1031',
    title: 'Broken light near library entrance',
    category: 'Electrical',
    location: 'Main Library',
    submitted: 'Oct 08, 2024',
    priority: 'Low',
    status: 'Resolved',
    description: 'One of the lights above the east entrance was not turning on after sunset.',
  },
];
