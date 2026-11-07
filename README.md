# CampusFix – College Issue Reporting and Resolution Platform

**CampusFix** is a web-based college issue reporting and resolution platform designed to simplify communication between students and college administrators. It allows students to report campus-related problems, upload supporting images, and track the progress of their complaints. Administrators can manage reported issues, assign priorities, update statuses, and monitor the overall resolution process.

The project uses a React frontend, Node.js and Express backend, MySQL database hosted on Amazon RDS, and various AWS services for cloud deployment, storage, notifications, and monitoring.

## 1. Project Objectives

- Provide students with a simple platform to report college-related issues.
- Allow students to track the status of their submitted complaints.
- Provide administrators with centralized issue management.
- Enable administrators to assign priorities and manage issue resolution.
- Store issue information securely in a relational database.
- Support image uploads for better issue identification.
- Send email notifications for relevant issue updates.
- Deploy the application using AWS cloud infrastructure.
- Monitor application resources, usage, and estimated costs.

## 2. Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3 |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Database Hosting | Amazon RDS |
| Cloud Platform | Amazon Web Services |
| Compute | Amazon EC2 |
| Storage | Amazon S3 |
| Notifications | Amazon SNS |
| Monitoring | Amazon CloudWatch |
| Configuration | AWS Systems Manager Parameter Store |
| Security | AWS IAM, Security Groups |
| Containerization | Docker |
| Version Control | Git and GitHub |

## 3. Security Implementation

Security is considered at both the application and infrastructure levels.

- IAM roles are used to provide controlled AWS permissions.
- IAM policies follow the principle of least privilege.
- Database resources are placed in private subnets.
- Security Groups control network access.
- Sensitive configuration is managed using Parameter Store.
- Credentials are not hardcoded into application source code.
- Database access is restricted to authorized application resources.

## 4. Expected Benefits

- Simplifies the college complaint reporting process.
- Improves communication between students and administrators.
- Provides transparent issue tracking.
- Helps administrators prioritize important complaints.
- Reduces manual complaint management.
- Provides centralized records of reported issues.
- Uses cloud infrastructure for scalability and availability.

## 5. Future Scope

- Push notifications for real-time issue updates.
- Automatic issue categorization.
- AI-based priority suggestions.
- Mobile application integration.
- Advanced analytics and reporting.
- Integration with college management systems.


## 6. Conclusion

CampusFix provides a centralized platform for reporting and managing college-related issues. By combining a React-based frontend, Node.js backend, MySQL database, and AWS cloud services, the project demonstrates the practical implementation of cloud computing concepts, application deployment, secure resource management, file storage, notifications, and infrastructure monitoring.

The platform aims to make campus issue reporting more organized, transparent, and efficient for both students and administrators.

---

**Developed using React, Node.js, MySQL, Docker and Amazon Web Services.**
