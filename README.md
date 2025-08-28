# RVCE Event Ticketing

This is an open-source event ticketing software designed for RVCE, built with Next.js and Firebase. It provides a comprehensive solution for creating events, managing registrations, and tracking attendance using QR codes.

## Features

- **Event Management**: Admins can create, update, and delete events.
- **User Registration**: Students can register for events and receive a unique QR code ticket via email.
- **QR Code Ticketing**: Each registration generates a unique QR code for attendance tracking.
- **Attendance Tracking**: Attendance takers can scan QR codes to mark attendees.
- **Admin Dashboard**: A dedicated dashboard for managing events and viewing registration data.
- **Email Notifications**: Automated email notifications for event registration and ticket delivery.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **QR Code Generation**: [qrcode](https://www.npmjs.com/package/qrcode)
- **QR Code Scanning**: [qr-scanner](https://www.npmjs.com/package/qr-scanner)
- **PDF Generation**: [jspdf](https://www.npmjs.com/package/jspdf)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/QR-Ticket-Software.git
    cd QR-Ticket-Software
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Configuration

1.  **Set up Firebase:**
    - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    - Set up Firestore, Firebase Storage, and Firebase Authentication.
    - Obtain your Firebase project configuration credentials.
    - Download your Firebase Admin SDK service account key (`serviceAccount.json`).

2.  **Create a `.env.local` file:**
    Create a file named `.env.local` in the root of the project and add the following environment variables. Replace the placeholder values with your actual credentials.

    ```env
    # Firebase Configuration (from your Firebase console)
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Application Configuration
    NEXT_PUBLIC_APP_NAME=RVCE Event Ticketing

    # Email Configuration (e.g., Gmail SMTP)
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASSWORD=your_app_password

    # Admin Credentials
    ADMIN_EMAIL=your_admin_email@example.com
    ADMIN_PASSWORD=your_strong_admin_password

    # Firebase Admin SDK Configuration
    # Place your serviceAccount.json file in the root of the project
    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

- **Admin**: Access the admin dashboard at `/admin` to manage events.
- **Students**: Register for events through the main page.
- **Attendance Takers**: Log in and use the scanning interface to validate tickets.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
