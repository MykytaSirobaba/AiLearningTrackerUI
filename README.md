# AI Learning Tracker - UI

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5](https://img.shields.io/badge/HTML5-E34F26)
![CSS3](https://img.shields.io/badge/CSS3-1572B6)
![Nginx](https://img.shields.io/badge/Nginx-Server-009639)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

**AI Learning Tracker UI** is the client-side application for the intelligent self-reflection platform. It provides a clean, responsive interface for users to manage their learning goals, log progress, and receive AI-driven analytics.

> **Important:** This repository contains only the Frontend code. It requires the Backend API to be running for full functionality.
>
> **Backend Repository:** [https://github.com/MykytaSirobaba/AiLearningTracker](https://github.com/MykytaSirobaba/AiLearningTracker.git)

---

## Features

* **Interactive Dashboard:** Visualizes learning progress and statistics.
* **Goal Management:** Interface for creating goals and viewing AI-generated study plans (subtasks).
* **Journaling UI:** User-friendly forms for logging daily learning activities and reflections.
* **Auth Pages:**
    * Login & Registration (Email/Password & Google OAuth2).
    * **2FA Support:** UI for scanning QR codes and entering TOTP verification codes.
* **Responsive Design:** Adapted for desktop and tablet usage.

---

## Tech Stack

**Frontend:**
* **Languages:** Vanilla JavaScript (ES6+), HTML5, CSS3.
* **No Frameworks:** Lightweight implementation without React/Angular/Vue dependencies.

**Infrastructure:**
* **Web Server:** Nginx (Serving static files & handling routing).
* **Containerization:** Docker & Docker Compose.

---

## Getting Started

### Prerequisites

1.  Ensure you have **Docker Desktop** installed.
2.  **Start the Backend first!** Follow instructions in the [Backend Repository](https://github.com/MykytaSirobaba/AiLearningTracker.git) to get the API running on `http://localhost:8080`.

### Option 1: Run via Docker

This is the easiest way to serve the application using Nginx, which handles routing correctly.

1.  Clone this repository.
2.  Run the command in the root directory:

```bash
  docker-compose up --build
```


### Option 2: Local Development

1.  Clone this repository.
2.  Run the command

```bash
  npx serve
```
