export type Project = {
  slug: string; name: string; eyebrow: string; summary: string; contribution: string;
  concepts: string[]; technologies: string[]; repo?: string; image?: string; imageAlt?: string;
  visual: 'splitwise' | 'orderflow' | 'parking' | 'currency'; atlas: string;
};

export const profile = {
  name: 'Yash Kambaria',
  role: 'Backend Engineer | Distributed Systems | Cloud-Native Applications',
  headline: 'Engineering systems that connect services, data and infrastructure.',
  intro: 'I build backend systems and explore the engineering challenges behind distributed applications, event-driven architectures and cloud-native infrastructure.',
  education: 'B.Tech Computer Science Engineering',
  university: 'Nirma University',
  dates: 'August 2023 – August 2027',
  graduation: 'Class of 2027',
  cgpa: '8.55 / 10',
  email: 'yashkambaria245@gmail.com',
  emailPublic: false,
  socials: {
    github: 'https://github.com/YashKambaria',
    linkedin: 'https://www.linkedin.com/in/yash-kambaria/',
    leetcode: 'https://leetcode.com/u/yashkambaria245/',
  },
  resumeUrl: undefined as string | undefined,
};

export const projects: Project[] = [
  {
    slug: 'smart-splitwise', name: 'Smart Splitwise', eyebrow: 'Expense systems · applied ML',
    summary: 'A group expense platform that records shared costs, tracks balances and generates settlements.',
    contribution: 'Originated the product direction and implemented with GitHub Copilot as coding assistance.',
    concepts: ['Expense management', 'Equal splits', 'Group balances', 'Greedy settlement matching', 'Category prediction'],
    technologies: ['Flutter', 'Spring Boot', 'Spring Cloud Gateway', 'FastAPI', 'MongoDB', 'Docker Compose'],
    visual: 'splitwise', atlas: 'Expense flows move through gateway and service boundaries; settlement matching turns group balances into a suggested payment list.',
  },
  {
    slug: 'event-driven-microservices', name: 'OrderFlow', eyebrow: 'Synchronous inventory · async events',
    summary: 'An order workflow combining synchronous inventory validation with Kafka-based asynchronous email processing.',
    contribution: 'Independently implemented the three services and event-driven workflow.',
    concepts: ['Order Service', 'Stock Service', 'OpenFeign', 'MongoDB persistence', 'Kafka consumer'],
    technologies: ['Java 17', 'Spring Boot 3.5', 'OpenFeign', 'Apache Kafka', 'MongoDB', 'Maven'],
    repo: 'https://github.com/YashKambaria/Event-Driven-Microservices', image: '/assets/orderflow-architecture.webp',
    imageAlt: 'Repository architecture diagram showing client, Order Service, Stock Service, MongoDB, Kafka and Email Service.',
    visual: 'orderflow', atlas: 'Orders synchronously check stock through OpenFeign, persist to MongoDB, then publish a Kafka event consumed by the Email Service.',
  },
  {
    slug: 'parking-guardian', name: 'Parking Guardian', eyebrow: 'Authenticated APIs · notifications',
    summary: 'A parking complaint and vehicle-owner notification application with a backend built around authenticated workflows.',
    contribution: 'Developed the backend; frontend implementation was handled separately.',
    concepts: ['Complaint and vehicle registration', 'JWT authentication', 'OTP verification', 'SMS and email alerts', 'Async notifications'],
    technologies: ['Java', 'Spring Boot', 'Spring Security', 'JWT', 'MongoDB', 'Twilio', 'JavaMailSender'],
    repo: 'https://github.com/YashKambaria/Parking-Guardian', image: '/assets/parking-guardian-logo.png',
    imageAlt: 'Parking Guardian vehicle logo from the project repository.', visual: 'parking',
    atlas: 'The backend ties complaint and vehicle records to authentication, OTP checks and asynchronous notification integrations.',
  },
  {
    slug: 'kubernetes-currency-exchange', name: 'Kubernetes Currency Exchange', eyebrow: 'Service communication · orchestration',
    summary: 'A two-service currency exchange and conversion application used to explore container and Kubernetes workflows.',
    contribution: 'Coded the application while learning and implementing the related technologies.',
    concepts: ['Currency Exchange Service', 'Currency Conversion Service', 'OpenFeign', 'Docker', 'Minikube', 'Argo CD GitOps'],
    technologies: ['Java 17', 'Spring Boot', 'OpenFeign', 'Docker', 'Kubernetes', 'Minikube', 'Argo CD', 'H2'],
    repo: 'https://github.com/YashKambaria/Kubernetes-currency-exchange', image: '/assets/currency-minikube-dashboard.webp',
    imageAlt: 'Minikube dashboard screenshot from the repository showing Currency Exchange pods.', visual: 'currency',
    atlas: 'Two Spring services communicate for currency lookup and conversion; repository documentation also describes local Kubernetes and GitOps workflows.',
  },
];

export const skills = [
  { title: 'Backend Engineering', description: 'Designing API and service layers with clear responsibilities and security boundaries.', projects: [{ slug: 'parking-guardian', technologies: ['Java', 'Spring Boot', 'Spring Security', 'JWT', 'REST APIs'] }, { slug: 'event-driven-microservices', technologies: ['Java', 'Spring Boot', 'OpenFeign', 'REST APIs'] }, { slug: 'kubernetes-currency-exchange', technologies: ['Java', 'Spring Boot', 'OpenFeign'] }, { slug: 'smart-splitwise', technologies: ['Spring Boot', 'Spring Cloud Gateway'] }] },
  { title: 'Distributed Systems', description: 'Connecting services and understanding their communication paths and boundaries.', projects: [{ slug: 'smart-splitwise', technologies: ['API Gateway', 'Expense service', 'ML service'] }, { slug: 'event-driven-microservices', technologies: ['Order, Stock and Email services', 'OpenFeign'] }, { slug: 'kubernetes-currency-exchange', technologies: ['Exchange and Conversion services', 'OpenFeign'] }] },
  { title: 'Event-Driven Architecture', description: 'Using asynchronous Kafka events to decouple order handling from downstream email processing.', projects: [{ slug: 'event-driven-microservices', technologies: ['Apache Kafka', 'OrderEvent consumer', 'Async email'] }] },
  { title: 'Databases and Data Management', description: 'Persisting application records across service-specific storage layers.', projects: [{ slug: 'smart-splitwise', technologies: ['MongoDB'] }, { slug: 'event-driven-microservices', technologies: ['MongoDB · orders and stock'] }, { slug: 'parking-guardian', technologies: ['MongoDB'] }, { slug: 'kubernetes-currency-exchange', technologies: ['H2'] }] },
  { title: 'Cloud and Containerization', description: 'Packaging services and practicing container orchestration and GitOps workflows.', projects: [{ slug: 'smart-splitwise', technologies: ['Docker Compose', 'AWS deployment documented'] }, { slug: 'kubernetes-currency-exchange', technologies: ['Docker', 'Kubernetes', 'Minikube', 'Argo CD workflow'] }] },
];

export const languages = ['Java', 'Python', 'C'];
export const developerTools = ['Git', 'Maven', 'Postman', 'Swagger', 'Lens IDE'];

export const achievements = [
  { title: 'Runner-up', event: 'HackaMind 2026', detail: 'Nirma University · DevX track', kind: 'Hackathon' },
  { title: 'Top 10', event: 'Ahmedabad University Hackathon', detail: 'Among 400+ teams', kind: 'Hackathon' },
  { title: 'AWS Academy Graduate', event: 'Cloud Foundations', detail: 'AWS Academy', kind: 'Certification' },
  { title: 'Master Microservices with Spring Boot and Spring Cloud', event: 'Udemy · in28Minutes', detail: 'Course completion', kind: 'Course' },
];
