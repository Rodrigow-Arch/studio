# **App Name**: Portugal Unido

## Core Features:

- Stepped Registration & Profile Creation: User signup via 5 sequential steps: credentials (email, password strength), identity (name, @username generated/editable with an AI tool for intelligent suggestions if taken), birthdate (18+ validation, DD/MM/AAAA mask), location (district select, free-text zone, GPS auto-fill), and optional phone number (masked input). Avatar generation and initial profile data storage (points, status, etc.) in Firestore. Session persistence via localStorage.

## Style Guidelines:

- Primary color: A rich forest green (#1A6635) evoking stability, nature, and community spirit.
- Background color: A very soft, desaturated pale green, almost off-white (#F5FAF6), providing a clean and calming canvas.
- Accent color: A vibrant, clear green (#33CC33), analogous to the primary but brighter and more saturated, ideal for CTAs and highlights.
- Thematic colors: Strategic use of warm gold (#FFD700) for elements of achievement (e.g., badges, points) and muted crimson red (#C8102E) for urgent alerts or warnings (e.g., SOS posts), drawing from national colors.
- Headline font: 'Playfair' (serif) for a sophisticated and inviting aesthetic for titles and larger text. Body font: 'PT Sans' (humanist sans-serif) for high readability in longer text blocks and general UI elements. Note: currently only Google Fonts are supported.
- Circular avatars displaying an initial letter (dynamically colored per user) or a selected emoji. Utilize crisp, modern SVG icons for navigation, status indicators, and actions, ensuring clarity. Location pins on an SVG map for geographical context.
- Mobile-first design with content maximized for widths up to 480px. Features an intuitive bottom navigation bar for core functionalities (Home, Groups, Add, Messages, Profile). Registration uses a clear progress bar with smooth transitions between its five stages.
- Subtle transition animations for state changes (e.g., registration steps, post status updates) for a fluid user experience. Small interactive animations for user feedback on actions (comments, points, notifications) and graceful loading indicators for ongoing processes.