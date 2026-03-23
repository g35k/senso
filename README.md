<p align="center">
  <img src="https://github.com/user-attachments/assets/82addd58-54cf-4f3a-a775-b7fb7a5d84b8" width="60%" />
</p>

**Winner, Open Innovation Subcategory — Hornet Hacks 4.0**

Senso is a beginner-focused braille learning system that combines a physical input device, Raspberry Pi hardware, Python logic, and a web interface to make foundational braille literacy more interactive, engaging, and accessible.

Built in 48 hours, Senso was designed to explore how tactile hardware and real-time software feedback can work together to support early braille learning.

---

## Overview

Senso addresses a gap in beginner braille education by pairing a tactile braille input device with a responsive learning interface. The system is designed to help users practice braille patterns, receive immediate validation, and move through lessons in a more structured and encouraging way.

This project combines:

- a Raspberry Pi-based hardware device using tactile switch inputs
- Python logic for braille interpretation
- a Flask API layer to synchronize hardware and UI
- a React + Vite frontend for lessons and feedback

---

## Why We Built It

Literacy rates among the visually impaired remain alarmingly low, and many existing learning tools do not effectively support the earliest stages of braille literacy. We wanted to build something that felt more immediate, interactive, and approachable for beginners.

Our goal was to create a system that teaches more than recognition alone. Senso is intended to support foundational literacy through tactile learning, real-time validation, and responsive audio feedback.

---

## Core Features

### Physical Braille Input
Senso uses tactile switch buttons wired to Raspberry Pi GPIO pins to represent braille cell input. This gives users a hands-on, device-based way to interact with lessons instead of relying on a screen alone.

### Real-Time Validation
User input is checked in real time so the learner can immediately tell whether a pattern is correct or incorrect.

### Lesson-Based Learning
The web interface is structured around beginner-friendly lessons, helping learners progress through foundational braille concepts in a more guided way.

### Audio Feedback
The device uses speech and sound effects to reinforce interactions and make the learning experience more responsive and engaging.

### Hardware and Web Synchronization
Flask is used to connect the Python hardware logic to the frontend interface so that physical button input and the website stay in sync.

---

## System Architecture

Senso consists of three main layers:

### 1. Hardware Layer
- Raspberry Pi
- GPIO-wired tactile switch buttons
- External USB speaker

The hardware captures braille button combinations as physical input.

### 2. Logic and API Layer
- Python
- Flask

Python handles braille input interpretation and device-side logic. Flask acts as the bridge between the hardware scripts and the frontend so that user input can be reflected in the interface.

### 3. Frontend Layer
- React
- Vite

The frontend presents lessons, feedback states, and interactive UI components that respond to the hardware input.

### Data Flow

1. The user presses a braille pattern on the hardware device  
2. Raspberry Pi reads the GPIO input states  
3. Python maps the input to a braille representation  
4. Flask passes that data to the frontend  
5. The UI updates with lesson progress, validation, and feedback  

---

## Tech Stack

### Frontend
- React
- Vite
- HTML
- CSS
- JavaScript

### Backend
- Flask
- Python

### Hardware
- Raspberry Pi
- GPIO
- Tactile switch buttons
- External USB speaker

---

## Project Status

This repository reflects both completed work and ongoing iteration.

### Currently Implemented
- physical braille input prototype
- GPIO-based button handling
- Python braille logic
- React frontend
- lesson-oriented interface
- real-time validation concept
- audio feedback assets
- enclosure prototype and 3D model workflow

### In Progress
- dedicated backend folder for Flask API organization
- continued frontend and backend integration cleanup
- improved enclosure design for revised hardware layout
- expanded reproducibility for others who want to build the device

---

## Repository Structure

```text
senso/
├── braille-hardware/
│   ├── app.py
│   ├── braille.py
│   ├── requirements-api.txt
│   ├── user_state.json
│   ├── *.mp3 / *.wav
│   └── hardware-side logic and audio assets
├── public/
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── lesson-detail.html
├── lessons.html
├── package.json
├── vite.config.js
└── README.md
```

> Note: a separate backend/ directory for the Flask API is planned but not yet finalized in the current repository structure.

Running the Project Frontend
```bash
cd senso
npm install
npm run dev
```

> Note: a separate `backend/` directory for the Flask API is planned but not yet finalized in the current repository structure.

---

## Running the Project

### Frontend

```bash
cd senso
npm install
npm run dev
```

### Backend / Flask Layer

The Flask API is still being reorganized into a dedicated backend folder. At the moment, related Python files live under `braille-hardware/`.

A future structure may look like:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Hardware

To run the hardware prototype, you will need:

- a Raspberry Pi
- tactile switch buttons wired to GPIO
- an external USB speaker
- the Python scripts in `braille-hardware/`

Because the hardware is still being iterated on, setup instructions for pin mappings and assembly are still in progress.

---

## Reproducibility and 3D Enclosure

One important part of this project is that it is being developed with reproducibility in mind.

We plan to include STL files for the device enclosure so others can:
- print the case
- source the components
- assemble the hardware
- run the project themselves

The enclosure was self-modeled during the hackathon as a first-pass prototype. It will be revised because the final circuit layout did not fit the original breadboard assumptions.

That said, we still intend to include the model files because they document the design process and make the project more buildable for others.

> The current enclosure should be considered a prototype iteration, not a final manufacturing-ready design.

---

## Demo

![senso1-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/3aac79a6-7c39-43b9-bd61-7b82d06c102d)

![senso-ui-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/3eb773f6-7186-4fd8-86b5-b51ac34a6b40)

**Demo video coming soon.**

---

## Technical Challenges

### Building Hardware Without Prior Hardware Experience

This project was built by a team with no previous hardware background. That meant learning wiring, GPIO interaction, button mapping, and physical prototyping under a tight time constraint.

### Synchronizing Hardware with a Web Interface

One of the core technical challenges was creating a system where physical device input could meaningfully drive a browser-based learning experience.

### Designing for Real-Time Feedback

The project required fast enough communication between hardware logic and UI feedback to make interaction feel immediate and useful for learning.

### Rapid Physical Prototyping

The enclosure and device form factor had to be conceptualized, modeled, and adapted quickly, while the underlying circuit design was still evolving.

---

## Hackathon Context

Senso was built in 48 hours at Hornet Hacks 4.0 and won the Open Innovation subcategory.

During the final presentation, we ran into Raspberry Pi connection issues and could not demo the device from inside the building. To adapt, part of the team operated Senso remotely from nearby while the live demo was presented over Discord.

That experience reinforced one of the biggest lessons of the project: robust systems are not just about building features, but also about adapting under real-world constraints.

---

## Team

### Team Manta

- **Kayla Garibay** — Team Lead and Product
- **Ankita Patwal** — Systems, Scripting, and Pi Logic
- **Althaea Locano** — Hardware and Circuits
- **Jenna Jimenez** — Lead UI/UX Engineer
- **Indira Debbad** — Backend Engineer
- **Shelby Faith Solana** — Frontend Engineer

---

## Future Work

- multi-cell braille display
- voice and audio customization
- pronunciation checking via microphone
- refined enclosure and industrial design
- finalized backend structure
- clearer hardware documentation
- expanded lessons and learning flow

---

## Notes

This project is still being actively refined after the hackathon. The current repository captures both the functional prototype and the next stage of planned improvements.

---

## Repository

[https://github.com/g35k/senso](https://github.com/g35k/senso)

