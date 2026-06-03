# Comprehensive Video Meeting Upgrade Plan

Based on the architectural research and current system constraints, this plan outlines a systematic, phase-by-phase approach to transition our video conferencing application into a premium, production-grade platform utilizing Vercel and Supabase.

---

## Phase 1: Infrastructure & Media Routing Initialization
**Objective:** Replace peer-to-peer WebRTC mesh limitations with a scalable server architecture to handle multi-party meetings without bandwidth saturation.
- **Task 1.1:** Deploy a Selective Forwarding Unit (SFU). Integrate **LiveKit** as the core SFU to handle media routing, clustering, and signaling instead of relying purely on database websockets.
- **Task 1.2:** Implement **Adaptive Bitrate Streaming & Simulcast**. Configure the client application to transmit multiple spatial resolutions simultaneously (e.g., 1080p, 720p, 180p), allowing the SFU to dynamically downgrade video for clients with poor network conditions.
- **Task 1.3:** Setup optimized codec ladders (H.264/VP8/VP9) for different scenarios (webcam streaming vs. high-motion screen sharing).

## Phase 2: State Management & Security Hardening
**Objective:** Establish a robust, secure, and performant persistent state layer using Supabase PostgreSQL.
- **Task 2.1:** Implement **Row Level Security (RLS)**. Transition application logic from middleware to database-level policies ensuring users can only access meeting rooms they are explicitly invited to.
- **Task 2.2:** Optimize Database Queries. Add B-tree indexes to foreign keys (`user_id`, `room_id`) to prevent sequential scans during RLS evaluation.
- **Task 2.3:** Transition from raw WebRTC signaling via Supabase Realtime to utilizing Supabase Realtime *exclusively* for application state (chat, raised hands, polls) while the SFU manages the heavy media exchange.

## Phase 3: Media Processing & Intelligent Features
**Objective:** Introduce premium audio/video capabilities matching industry standards (like Google Meet).
- **Task 3.1:** Implement **Insertable Streams (Breakout Box API)** for background segmentation (blur and virtual backgrounds) using Web Workers, ensuring the main React UI thread is not blocked.
- **Task 3.2:** Integrate Server-Side Noise Suppression. Utilize models like Krisp via the SFU to eliminate keyboard typing and background noise without local CPU penalty.
- **Task 3.3:** Build an Automated Speech Recognition (ASR) pipeline for real-time closed captions and diarization, preparing the foundation for an interactive Voice AI Assistant.

## Phase 4: Delivery Optimization & Egress Storage
**Objective:** Guarantee ultra-low latency globally and manage media recording efficiently.
- **Task 4.1:** Migrate token generation and initialization logic to **Vercel Edge Functions** matching the Supabase region to eliminate "latency waterfalls."
- **Task 4.2:** Implement RoomComposite Egress. Setup headless browser rendering workers to record the meeting grid layout and composite it into MP4 files.
- **Task 4.3:** Direct meeting recordings to **Vercel Blob** storage. Optimize Fast Data Transfer (FDT) consumption by using strict Cache-Control headers and considering HTTP Live Streaming (HLS) segmented delivery.

## Phase 5: UI Revamp & Responsive Interface Optimization
**Objective:** Overhaul the display interface to ensure perfect responsiveness, addressing hidden buttons and providing a seamless experience across desktop and mobile.
- **Task 5.1:** **Fix Mobile Navigation Overflows:** Convert hidden overflow containers in the "More Options" bottom sheet to scrollable `overflow-y-auto` elements so all extended features (Polls, Notes, Effects, Captions, Recording) are easily accessible on small screens.
- **Task 5.2:** **Optimize Bottom Control Bar Layout:** Refactor the primary action bar to utilize intelligent flex wrapping and horizontal scrolling (`overflow-x-auto`) with proper padding (`env(safe-area-inset-bottom)`) ensuring core buttons (Mic, Video, Leave) are instantly reachable.
- **Task 5.3:** **Fluid Grid Architecture:** Implement a dynamic layout engine that automatically recalculates participant tile dimensions based on viewport width, switching from a grid view on desktop to a stacked or swipeable carousel view on mobile for high participant counts.
- **Task 5.4:** **Interactive Sidebar Adjustments:** Ensure that Chat, People, Notes, and Polls panels elegantly slide over the video grid on mobile devices (as a bottom sheet or full overlay) with easily identifiable close actions, while operating as side-by-side dockable panels on desktop views.
- **Task 5.5:** **Touch Targets & Micro-interactions:** Increase the touch target sizes for all mobile icons (minimum 44x44px), improve visual feedback states (active/disabled), and integrate smooth framer-motion transitions for entering/leaving states across all devices.
