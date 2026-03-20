# OnFinance-AI
This repo contains my version of UML generator.

# UML AI Generator

An AI-powered system design tool that transforms natural language descriptions into a suite of consistent UML diagrams. Unlike standard generators that treat each diagram as a separate prompt, this tool uses a **Two-Stage Pipeline** to ensure that your Class, Sequence, and Component diagrams all share the same "source of truth."

## 🚀 Key Features

- **Consistently Coherent Diagrams**: Uses a two-stage approach:
    1. **System extraction**: Gemini extracts a structured System Model (entities, interactions, classes, states).
    2. **Parallel generation**: All selected diagram types are generated in parallel from that same shared JSON model.
- **Support for 5+ Diagram Types**:
    - **Sequence Diagrams**: Interaction-heavy workflows.
    - **Class Diagrams**: Structural relationships with proper visibility and generics.
    - **Flowcharts**: High-level process logic.
    - **State Diagrams**: Lifecycle and transition modeling (auto-derived).
    - **Component Diagrams**: High-level architecture (transpiled from component UML to valid Flowchart TD).
- **Premium Resizable UI**:
    - **Drag-to-resize** panels (25% to 75% split).
    - **Live Zoom**: Interactive zoom (30% to 300%) and pan for complex diagrams.
    - **Session History**: Easily switch between previous generations or clear your history.
- **Export Options**: Download diagrams as high-quality **SVG** or **PNG** for your documentation.
- **Smart Sanitization**: Robust regex-based fixers to correct common LLM errors (e.g., angle brackets in generics, nested class blocks, participant naming).

## 🛠️ Tech Stack

- **Frontend**: React (18), Vite, Vanilla CSS (Glassmorphism design).
- **Core Engine**: Gemini API (`gemini-2.0-flash-lite` with fallback to `gemini-2.0-flash`).
- **Rendering**: Mermaid.js (v11+).

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/))

### 2. Installation
1. Clone the repository.
2. Navigate to the `client` directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Environment Setup
Create a `.env` file in the `client` directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

## 📖 Usage
1. **Natural Mode**: Type a description like *"An e-commerce system where users browse products, add to cart, and checkout via Stripe."*
2. **JSON Mode**: Paste a structured JSON prompt for deterministic inputs.
3. **Select Diagrams**: Toggle the chips (Class, Flow, Seq, etc.) to choose which views to generate.
4. **Update**: Use the "Update diagram" button to refine an existing generation with new instructions.

---
Built as part of the OnFinnance Assignment.


Assignment link : https://p.ip.fi/4IwK
