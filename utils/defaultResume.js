const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate a professional executive PDF resume using the modern two-column
 * Mushi Dharun ZETRA architectural template.
 * Features:
 * - Page 1: Header, About Me, Two-Column Project & Experience Layout with Skills & Languages
 * - Page 2: Header, Contact Strip, Profile, Interests, 10+ Certifications, Professional Skills, Achievements
 * - Clean royal deep blue (#1E3A8A) hierarchy, charcoal typography, and sharp line dividers.
 * @param {string} outputPath Target file path for the PDF
 * @returns {Promise<string>}
 */
function generateDefaultResume(outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Standard A4 dimensions in points: 595.28 x 841.89
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 34, bottom: 34, left: 38, right: 38 },
        info: {
          Title: 'Professional Resume - NANTHAKUMAR T',
          Author: 'NANTHAKUMAR T',
          Subject: 'B.Tech AI & Data Science Student & Frontend Developer Resume',
          Keywords: 'Artificial Intelligence, Data Science, Ramco Institute of Technology, Python, Machine Learning, Frontend Developer, JavaScript, UI/UX Design, IoT Projects',
        },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Color Palette matching Mushi Dharun ZETRA Resume
      const primaryBlue = '#1E3A8A';   // Royal / Deep Blue for main titles & headers
      const darkText = '#0F172A';      // Dark Slate for headings & titles
      const bodyText = '#1E293B';      // Charcoal for body text
      const mutedText = '#64748B';     // Slate for secondary text & dates
      const ruleColor = '#CBD5E1';     // Light Gray/Blue for divider rules

      // ==========================================
      // PAGE 1: EXECUTIVE TWO-COLUMN TECHNICAL RESUME
      // ==========================================

      // Top Header (Prominent, centered, elegant)
      doc.moveDown(0.2);
      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryBlue).text('Nanthakumar T', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(12).font('Helvetica').fillColor(darkText).text('B.Tech AI & Data Science Student (2nd Year) | Ramco Institute of Technology', { align: 'center' });

      // Horizontal Divider below header
      doc.moveDown(0.7);
      let currY = doc.y;
      doc.strokeColor(ruleColor).lineWidth(1).moveTo(38, currY).lineTo(557, currY).stroke();
      doc.moveDown(0.65);

      // ABOUT ME Section
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor(primaryBlue).text('ABOUT ME', 38, doc.y);
      doc.moveDown(0.35);
      doc.fontSize(8.4).font('Helvetica').fillColor(bodyText).text(
        'Motivated and detail-oriented Artificial Intelligence and Data Science (B.Tech, 2nd Year) student at Ramco Institute of Technology with a strong passion for AI algorithms, applied machine learning, frontend web development, and intuitive UI/UX design. Continuously learning through national hackathons (Smart India Hackathon 2026 Shortlist), verified technical industry certifications, and hands-on sensor builds. Dedicated to solving complex problems, analyzing data patterns, and engineering reliable software solutions.',
        38,
        doc.y,
        { width: 519, lineGap: 2.5, align: 'left' }
      );

      // Horizontal Divider below About Me
      doc.moveDown(0.7);
      currY = doc.y;
      doc.strokeColor(ruleColor).lineWidth(1).moveTo(38, currY).lineTo(557, currY).stroke();
      doc.moveDown(0.7);

      // ------------------------------------------
      // TWO COLUMN LAYOUT (Asymmetrical Split)
      // Left Column: x = 38, width = 160
      // Right Column: x = 215, width = 342
      // ------------------------------------------
      const colTopY = doc.y;
      const leftColX = 38;
      const leftColWidth = 160;
      const rightColX = 215;
      const rightColWidth = 342;

      // ================= LEFT COLUMN =================
      let leftY = colTopY;

      // CONTACT
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('CONTACT', leftColX, leftY);
      leftY = doc.y + 5;

      const contactItems = [
        '+91 97891 23456',
        'Tamil Nadu, India',
        'nanthakumar7750@gmail.com',
        'https://github.com/nanthakumar',
        'https://linkedin.com/in/nanthakumar'
      ];

      contactItems.forEach(item => {
        doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(`•  ${item}`, leftColX, leftY, { width: leftColWidth, lineGap: 2 });
        leftY = doc.y + 3.5;
      });

      leftY += 12;

      // EDUCATION
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('EDUCATION', leftColX, leftY);
      leftY = doc.y + 6;

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(darkText).text('RAMCO INSTITUTE OF TECHNOLOGY', leftColX, leftY, { width: leftColWidth });
      leftY = doc.y + 2;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlue).text('B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE', leftColX, leftY, { width: leftColWidth });
      leftY = doc.y + 2;
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('2024 – 2028 (2nd Year)', leftColX, leftY);
      leftY = doc.y + 3;
      doc.fontSize(7.4).font('Helvetica').fillColor(bodyText).text('• Currently pursuing 2nd Year (B.Tech AI & DS).', leftColX, leftY, { width: leftColWidth, lineGap: 1.8 });
      leftY = doc.y + 2;
      doc.fontSize(7.4).font('Helvetica').fillColor(bodyText).text('• Core focus: Artificial Intelligence, Machine Learning, Data Analytics & Modern Frontend Web Development.', leftColX, leftY, { width: leftColWidth, lineGap: 1.8 });
      leftY = doc.y + 12;

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(darkText).text('KMKA / STATE BOARD HIGHER SECONDARY SCHOOL', leftColX, leftY, { width: leftColWidth });
      leftY = doc.y + 2;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryBlue).text('HIGHER SECONDARY EDUCATION', leftColX, leftY);
      leftY = doc.y + 2;
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('2022 – 2024', leftColX, leftY);
      leftY = doc.y + 3;
      doc.fontSize(7.4).font('Helvetica').fillColor(bodyText).text('• Completed Secondary & Higher Secondary with distinction in Mathematics, Physics, Chemistry & Computer Science.', leftColX, leftY, { width: leftColWidth, lineGap: 1.8 });
      leftY = doc.y + 2;
      doc.fontSize(7.4).font('Helvetica').fillColor(bodyText).text('• Graduated with Academic Excellence.', leftColX, leftY);

      // ================= RIGHT COLUMN =================
      let rightY = colTopY;

      // PROJECTS
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('PROJECTS', rightColX, rightY);
      rightY = doc.y + 5;

      // Project 1: MPLAD System
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(darkText).text('MPLAD System - Project Guardian', rightColX, rightY);
      rightY = doc.y + 2;
      doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(
        '• Led 6-member engineering team (Code Dominators) to national shortlist in Smart India Hackathon 2026 (SIH26102), designing a civic transparency platform managing INR 15 Cr/MP constituency funds with spatial GIS tracking and duplicate work detection.',
        rightColX,
        rightY,
        { width: rightColWidth, lineGap: 1.8 }
      );
      rightY = doc.y + 2;
      doc.fontSize(7.4).font('Helvetica-Bold').fillColor(mutedText).text('• Tech: ', rightColX, rightY, { continued: true });
      doc.font('Helvetica').fillColor(bodyText).text('JavaScript (ES6+), React/Node.js, GIS Mapping, REST APIs, SQLite WAL');
      rightY = doc.y + 6;

      // Project 2: DOM
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(darkText).text('DOM - AI Study Assistant', rightColX, rightY);
      rightY = doc.y + 2;
      doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(
        '• Engineered an intelligent study companion platform enabling learners to upload academic textbooks, PDFs, and notes for contextual multi-turn Q&A, automated chapter summaries, and accelerated concept mastery.',
        rightColX,
        rightY,
        { width: rightColWidth, lineGap: 1.8 }
      );
      rightY = doc.y + 2;
      doc.fontSize(7.4).font('Helvetica-Bold').fillColor(mutedText).text('• Tech: ', rightColX, rightY, { continued: true });
      doc.font('Helvetica').fillColor(bodyText).text('Python, Google AI Studio, Gemini API, Document Parsing, JavaScript');
      rightY = doc.y + 6;

      // Project 3: IoT Battery & Motor Health Builds
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(darkText).text('IoT Battery Health & Motor Vibration Sensor Builds', rightColX, rightY);
      rightY = doc.y + 2;
      doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(
        '• Built practical IoT sensor prototypes using an ESP32 microcontroller, INA219 current/voltage sensors, and accelerometers to explore Coulomb-counting battery health estimation and basic motor vibration logging.',
        rightColX,
        rightY,
        { width: rightColWidth, lineGap: 1.8 }
      );
      rightY = doc.y + 2;
      doc.fontSize(7.4).font('Helvetica-Bold').fillColor(mutedText).text('• Tech: ', rightColX, rightY, { continued: true });
      doc.font('Helvetica').fillColor(bodyText).text('ESP32, Sensor Interfacing, INA219, Accelerometer, IoT Prototyping');
      rightY = doc.y + 10;

      // TECHNICAL EXPERIENCE
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('TECHNICAL EXPERIENCE', rightColX, rightY);
      rightY = doc.y + 5;

      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(darkText).text('Lead Frontend Architect & Team Leader', rightColX, rightY);
      rightY = doc.y + 2;
      doc.fontSize(7.6).font('Helvetica-Bold').fillColor(primaryBlue).text('Team Code Dominators (Smart India Hackathon 2026)', rightColX, rightY);
      rightY = doc.y + 1.5;
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('2024 – Present', rightColX, rightY);
      rightY = doc.y + 2.5;
      doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(
        '• Directed cross-functional engineering sprints and UI design architecture, building intuitive civic dashboards with spatial GIS tracking and dual-ledger budget reconciliation.\n• Completed multiple software and hardware projects utilizing JavaScript, Python, and Embedded C++.\n• Continuously enhancing expertise in modern frontend engineering, databases, system architecture, and IoT telemetry.',
        rightColX,
        rightY,
        { width: rightColWidth, lineGap: 2 }
      );
      rightY = doc.y + 10;

      // SKILLS
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('SKILLS', rightColX, rightY);
      rightY = doc.y + 5;

      // 2 columns for skills inside right column
      const skillColW = rightColWidth / 2 - 6;
      const skillsLeft = [
        'JavaScript (ES6+)',
        'HTML5 & CSS3',
        'Python Programming',
        'Data Structures & Algorithms',
        'Applied IoT & ESP32 Basics'
      ];
      const skillsRight = [
        'REST API Architecture',
        'Responsive UI/UX Design',
        'AI-Assisted Development',
        'Problem Solving & Logic',
        'System Optimization'
      ];

      let sLeftY = rightY;
      skillsLeft.forEach(sk => {
        doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(`•  ${sk}`, rightColX, sLeftY, { width: skillColW });
        sLeftY = doc.y + 2.5;
      });

      let sRightY = rightY;
      skillsRight.forEach(sk => {
        doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text(`•  ${sk}`, rightColX + skillColW + 12, sRightY, { width: skillColW });
        sRightY = doc.y + 2.5;
      });

      rightY = Math.max(sLeftY, sRightY) + 8;

      // LANGUAGES
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('LANGUAGES', rightColX, rightY);
      rightY = doc.y + 4;
      doc.fontSize(7.6).font('Helvetica').fillColor(bodyText).text('•  English   •  Tamil', rightColX, rightY);

      // ==========================================
      // PAGE 2: DETAILED PROFILE, CERTIFICATIONS & ACHIEVEMENTS
      // ==========================================
      doc.addPage();

      // Top Header Page 2
      doc.moveDown(0.2);
      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryBlue).text('NANTHAKUMAR T', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(12).font('Helvetica').fillColor(darkText).text('B.Tech AI & Data Science Student (2nd Year) | Ramco Institute of Technology', { align: 'center' });
      doc.moveDown(0.5);

      // Contact Strip Bar with border
      const stripY = doc.y;
      doc.rect(38, stripY, 519, 24).fillAndStroke('#F8FAFC', ruleColor);
      doc.fontSize(8.2).font('Helvetica').fillColor(bodyText).text(
        '+91 97891 23456    |    nanthakumar7750@gmail.com    |    Tamil Nadu, India',
        38,
        stripY + 7,
        { width: 519, align: 'center' }
      );

      doc.moveDown(1.2);
      const p2BodyY = doc.y + 8;

      // Two columns with vertical divider line at x = 248
      const p2DividerX = 248;
      const p2LeftX = 38;
      const p2LeftW = 194;
      const p2RightX = 268;
      const p2RightW = 289;

      // Draw vertical divider line
      doc.strokeColor(ruleColor).lineWidth(1).moveTo(p2DividerX, p2BodyY).lineTo(p2DividerX, 790).stroke();

      // ================= PAGE 2 LEFT COLUMN =================
      let p2LeftY = p2BodyY;

      // PROFILE
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryBlue).text('PROFILE', p2LeftX, p2LeftY);
      p2LeftY = doc.y + 6;
      doc.fontSize(8.4).font('Helvetica').fillColor(bodyText).text(
        '2nd-year B.Tech Artificial Intelligence and Data Science student at Ramco Institute of Technology passionate about machine learning, data science, and modern frontend web engineering. Proven track record as Team Leader in Smart India Hackathon 2026 (National Shortlist) and creator of practical AI and IoT prototypes. Strong technical foundation in Python, JavaScript, and Machine Learning principles, backed by 10+ professional industry certifications.',
        p2LeftX,
        p2LeftY,
        { width: p2LeftW, lineGap: 2.5 }
      );
      p2LeftY = doc.y + 22;

      // INTERESTS
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryBlue).text('INTERESTS', p2LeftX, p2LeftY);
      p2LeftY = doc.y + 6;

      const interests = [
        'Kabaddi & Competitive Team Sports',
        'Body & Mind Conditioning (Gym & Yoga)',
        'Endurance Jogging (Morning & Evening)',
        'Team Hackathons & Engineering Sprints',
        'Cinema: Historical, Mythic & Crime Thrillers',
        'Interactive Gaming & Arena Spectating',
        'Eclectic Music & Melodic Landscapes',
        'Applied IoT & Sensor Prototyping'
      ];

      interests.forEach(interest => {
        doc.fontSize(8.2).font('Helvetica').fillColor(bodyText).text(`•  ${interest}`, p2LeftX, p2LeftY, { width: p2LeftW, lineGap: 2.2 });
        p2LeftY = doc.y + 4.5;
      });

      // ================= PAGE 2 RIGHT COLUMN =================
      let p2RightY = p2BodyY;

      // CERTIFICATIONS
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryBlue).text('CERTIFICATIONS', p2RightX, p2RightY);
      p2RightY = doc.y + 3;
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(darkText).text('Professional Certifications & Recognitions', p2RightX, p2RightY);
      p2RightY = doc.y + 6;

      const certs = [
        'Smart India Hackathon 2026 – National Shortlist (MoE & MoSPI)',
        'Google AI Studio Build & Deploy Challenge (GUVI × HCL AI)',
        'Deploying Open Models on GKE (Google Developer Groups)',
        'GenAI Powered Data Analytics Simulation (TATA Group)',
        'Technology & Forensic Analytics Simulation (Deloitte)',
        'Financial Controllers & Valuations Simulation (Goldman Sachs)',
        '3D Spatial Prototyping & Wireframing (HP LIFE Foundation)',
        'Strategic Business Communication & Leadership (HP Foundation)'
      ];

      certs.forEach(cert => {
        doc.fontSize(8).font('Helvetica').fillColor(bodyText).text(`•  ${cert}`, p2RightX, p2RightY, { width: p2RightW, lineGap: 2 });
        p2RightY = doc.y + 3.5;
      });

      p2RightY += 3;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryBlue).text('10+ Industry Certifications Completed', p2RightX, p2RightY);
      p2RightY = doc.y + 16;

      // PROFESSIONAL SKILLS
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryBlue).text('PROFESSIONAL SKILLS', p2RightX, p2RightY);
      p2RightY = doc.y + 6;

      const profSkills = [
        'Technical Team Leadership (Led SIH 6-Member Team)',
        'Analytical Thinking & Systematic Debugging',
        'Critical Problem Solving & Logic Analysis',
        'Empathetic Collaboration & Team Coordination',
        'Attention to Visual Detail & UI Craftsmanship',
        'Calm Persistence Under Complex Challenges',
        'Continuous Engineering Learning & Adaptation'
      ];

      profSkills.forEach(ps => {
        doc.fontSize(8).font('Helvetica').fillColor(bodyText).text(`•  ${ps}`, p2RightX, p2RightY, { width: p2RightW, lineGap: 2 });
        p2RightY = doc.y + 3.5;
      });

      p2RightY += 16;

      // ACHIEVEMENTS
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryBlue).text('ACHIEVEMENTS', p2RightX, p2RightY);
      p2RightY = doc.y + 6;

      const achievements = [
        'Smart India Hackathon 2026 National Shortlist (Problem SIH26102)',
        'Team Leader of Team Code Dominators (Spearheaded MPLAD Platform)',
        '10+ Professional Industry Certifications & Simulations Completed',
        'Google Developer Groups & OpenmadurAI Community Participant',
        'Developed Applied IoT Prototypes for Battery Health & Motor Vibration Tracking'
      ];

      achievements.forEach(ach => {
        doc.fontSize(8).font('Helvetica').fillColor(bodyText).text(`•  ${ach}`, p2RightX, p2RightY, { width: p2RightW, lineGap: 2 });
        p2RightY = doc.y + 3.5;
      });

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
module.exports = { generateDefaultResume };
