# Musabeat

## Web-Based Digital Audio Workstation (DAW)

![](https://user-images.githubusercontent.com/81443264/224987137-e1a61977-9b35-4c13-b9a2-88ca67447c9c.gif)

[🎵 Explore Musabeat Now! 🎵](https://musamusicapp-c5d73.web.app)

### Overview

Musabeat offers a dynamic web experience that brings the power and versatility of a DAW directly to your browser. Built with React, this app captures the essence of music production, allowing users to:

- Work with various instruments & audio tracks
- Schedule musical events
- Utilize Sequencer and Piano Roll editor
- Engage in different synthesis techniques like Subtractive, FM, etc.
- Incorporate sampling & audio recording
- Integrate sound effects, processors, and more (akin to Plug-ins/VSTs)
- Mix and master seamlessly

### Notable Features

- **User-Centric**: Secure authentication & profile management
- **Cloud Integration**: Save sessions, files, and instrument patches in the cloud; accessible from any location.
- **Engaging Community**: Social features including likes, profiles, and content sharing.
- **Adaptable UI**: Multilingual support

### Technical Stack 🛠

**Frontend 🖥**

- React
- Material UI 5
- WebAudio API (enhanced by ToneJS)

**Backend ☁️**

- Firebase (Baas)
  - Authentication
  - Cloud Storage
  - Firestore NoSQL DB

🚧 **Note**: Musabeat is no longer actively maintained and may contain bugs.

### Musabeat: Its Genesis and future 🌀

Conceived during my Audio Engineering VT, Musabeat was more than just a degree project—it was an exploration into melding my web development prowess with my newfound passion for digital audio. Reflecting on the code, the journey of personal growth in React and JavaScript best practices is evident.

As of now, I am no longer actively working on it. Over time, features began to accumulate, and Musabeat evolved into a product that's quite intricate for beginners. Additionally, WebAudio's performance became a challenge when dealing with a large number of tracks. Transforming it into a commercial-grade product would demand a significant redesign. 

Instead, I'm working on [Modulab](https://github.com/pedrogardim/modulab), a modular synthesis-inspired playground. It embodies a new direction and focus, and I invite everyone to check it out.

Musabeat's repository remains available for those who wish to explore, learn from, or fork the code. ✌🏻



### Acknowledged Problems 🐛

Some parts of the codebase were written during early stages of learning and may not adhere to current best practices. I'm aware that the following is present in the code:

- Lack of modularization (Large component files)
- Lack of the DRY principle
- Messy state management (Huge and over-complex context)
- Styling inconsistency (CSS + MUI `sx` prop + inline styles)
- Hardcoded values

[🎶 Give Musabeat a Spin! 🎶](https://musamusicapp-c5d73.web.app)
