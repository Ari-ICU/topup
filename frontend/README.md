# TopUpPay Frontend 🚀

Welcome to the **TopUpPay Frontend** repository!

This Next.js 15+ (App Router) codebase features a stunning customer-facing interface tailored specifically for the gaming industry along with a comprehensive Admin Dashboard. 

## Highlights
- **Stunning UI/UX**: Custom neon aesthetics, glassy components, CSS grid systems, and micro-animations via standard Tailwind 4 implementations.
- **Robust Integration**: Custom `lib/api.ts` handler providing seamless connectivity to our custom backend and caching data intelligently.
- **Resilience**: Features fallback component structures that prevent UI breakdown when the backend API is disconnected, making demos and load times buttery smooth.
- **Account Verification Proxy**: Routes validation calls securely through Next.js server components to circumvent strict CORS blocking, ensuring clean gameplay account ID verifications. 
- **Admin Capabilities**: Sort items with Drag-and-Drop UI, approve customer reviews, view diamond balances, and handle game packages effortlessly.

## Getting Started

First, install all necessary dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience TopUpPay.

## Project Architecture
- `src/app/page.tsx`: Landing page highlighting features, games grid, and user testimonials.
- `src/app/admin/*`: Fully functional dashboard interfaces including KPI charts, System Settings toggles, and review approvals. 
- `src/app/topup/[gameId]/*`: High-fidelity, multi-step transaction process featuring real-time ID verification and glowing interaction patterns.
- `src/components/*`: Reusable atomic UI components ensuring uniform styles and optimal performance across screen sizes.

## Building for Production
Ensure `.env.production` contains valid configurations (e.g. `NEXT_PUBLIC_API_URL`) before building.

```bash
npm run build
npm run start
```

*This application natively mitigates client-side hydration issues through strategic Next.js `<Suspense>` layers.*
