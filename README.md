

# Full Stack URL Shortener using Next.js and Node.js Microservices

This is a complete full-stack URL shortener built using modern technologies like Next.js, TypeScript, Tailwind CSS, and Express.js. The system is designed with clean architecture principles and reflects real-world project structure and coding practices.

Every part of this project has been developed from scratch, showing my dedication to learning and building functional systems independently. From user interface to API communication and logging, all functionalities are implemented with clarity, scalability, and reusability in mind.

---

## Project Overview

The application allows users to shorten URLs, assign custom codes, and track click statistics. The backend supports all major API functionalities, and the frontend provides a clean and easy-to-use interface. A separate, reusable logging middleware is integrated to handle and log all request information, showcasing modular design.

---

## Features

### Frontend (Next.js with TypeScript, Tailwind CSS, Material UI)

* Built using App Router with clean folder structure
* Written fully in TypeScript for safer and scalable development
* Users can shorten up to 5 URLs at once
* Option to add a custom shortcode
* Option to set expiration date for each URL
* Displays statistics like:

  * Click count
  * Created and expiration date
  * Click time and source

### Backend (Node.js with Express)

* All APIs built using clean Express routes and controller pattern
* Built from scratch without using any database
* Generates custom or random shortcodes
* Maintains in-memory data structure for shortcodes and statistics
* Custom reusable logging middleware logs each request in a clean format
* Middleware is designed as a standalone module for reuse in other projects

---

## Project Structure

```
project-root/
│
├── Backend-Test-Submission/        Node.js backend service
│   ├── middleware/                 External logging middleware
│   ├── routes/                     Express routes
│   ├── utils/                      Helper functions
│   ├── shorturlController.js      Core logic of URL shortening and stats
│
├── Logging-Middleware/            Custom reusable logging middleware
│   ├── logger.js                  Handles request logs
│   ├── index.js                   Exportable middleware
│
├── Frontend-Test-Submission/      Next.js frontend application
│   ├── app/                       Routing pages
│   ├── components/                Reusable UI components
│   ├── types/                     TypeScript types
│   ├── utils/                     Client-side utilities
│   ├── styles/                    Tailwind and MUI config
│
├── README.md
```

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Material UI

### Backend

* Node.js
* Express.js
* Custom reusable middleware (no database used)

---

## How to Run the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/priyanshu-tiwariii/2200270130121
cd 2200270130121
```

### Step 2: Install and Start Logging Middleware

```bash
cd Logging-Middleware
npm install
```

No need to run separately. It will be imported into the backend.

### Step 3: Setup and Run Backend

```bash
cd ../Backend-Test-Submission
npm install
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 4: Setup and Run Frontend

Open a new terminal:

```bash
cd ../Frontend-Test-Submission
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

---

## API Endpoints

### POST `/shorturls`

Create shortened links. Accepts up to 5 long URLs. You can also send optional custom shortcodes and expiration dates.

### GET `/shorturls/:shortcode`

Returns details of the short URL such as:

* Total clicks
* Creation time
* Expiration time
* Click history with timestamp

### GET `/:shortcode`

Redirects to the original URL and logs the redirection.

---

## Final Notes

This project was built to demonstrate my ability to develop real-world full-stack applications from scratch. The structure, modular design, clean routing, and reusable middleware reflect my seriousness and focus on writing production-ready code.

I have put full effort into designing both the backend and frontend with proper separation of logic and responsibility. All UI and API functionalities are working as expected and tested.

This project reflects my dedication and strong understanding of modern full-stack development principles.


